import { createHash } from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const batchSize = Math.max(1, Math.min(10, Number(process.env.TRANSLATION_BATCH_SIZE ?? 5)));

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GEMINI_API_KEY?.trim();
  if (primary) keys.push(primary);
  for (let i = 1; i <= 30; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

async function generateGeminiTextForJob(prompt: string, maxOutputTokens = 6000): Promise<string | null> {
  const keys = getGeminiKeys();
  if (!keys.length) return null;

  const configured = (process.env.GEMINI_MODEL?.replace(/^google\//, "").trim() || "gemini-3.1-flash-lite");
  const models = [...new Set([configured, "gemini-3.5-flash-lite"])];

  for (const key of keys) {
    const client = new GoogleGenerativeAI(key);
    for (const modelId of models) {
      try {
        const model = client.getGenerativeModel({
          model: modelId,
          generationConfig: {
            temperature: 0.2,
            topP: 0.9,
            topK: 40,
            maxOutputTokens,
            responseMimeType: "application/json",
          },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) return text;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Gemini translation attempt failed on ${modelId}: ${message}`);
      }
    }
  }

  return null;
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

type ArticleRow = {
  id: string;
  title_ar: string | null;
  summary_ar: string | null;
  content_ar: string | null;
  title_en: string | null;
  summary_en: string | null;
  content_en: string | null;
  metadata: Record<string, unknown> | null;
};

async function supabase<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

function hashSource(article: ArticleRow): string {
  return createHash("sha256")
    .update(JSON.stringify({
      title_ar: article.title_ar ?? "",
      summary_ar: article.summary_ar ?? "",
      content_ar: article.content_ar ?? "",
    }))
    .digest("hex");
}

function parseJson(text: string): {
  title_en: string;
  summary_en: string;
  content_en: string;
} {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Gemini did not return a JSON object.");
  const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  const title_en = typeof parsed.title_en === "string" ? parsed.title_en.trim() : "";
  const summary_en = typeof parsed.summary_en === "string" ? parsed.summary_en.trim() : "";
  const content_en = typeof parsed.content_en === "string" ? parsed.content_en.trim() : "";
  if (!title_en || !summary_en || !content_en) {
    throw new Error("Gemini returned an incomplete English article.");
  }
  return { title_en, summary_en, content_en };
}

function buildPrompt(article: ArticleRow): string {
  return `Translate this Islamic editorial article from Arabic to natural, publication-quality English.

Rules:
1. Preserve meaning exactly. Do not add facts, opinions, citations, rulings, or claims not present in the Arabic source.
2. Preserve Quran quotations, hadith quotations, Arabic devotional phrases, URLs, references, numbers, names, and book titles exactly when they are already present. Do not invent English religious quotations.
3. Translate only the editorial prose around source quotations.
4. Keep the same paragraph structure and intent.
5. Return ONLY valid JSON with keys title_en, summary_en, content_en.
6. Do not wrap the JSON in markdown fences.

TITLE_AR:
${article.title_ar ?? ""}

SUMMARY_AR:
${article.summary_ar ?? ""}

CONTENT_AR:
${article.content_ar ?? ""}`;
}

async function main() {
  const rows = await supabase<ArticleRow[]>(
    "/rest/v1/articles?select=id,title_ar,summary_ar,content_ar,title_en,summary_en,content_en,metadata&published=eq.true&or=(title_en.is.null,summary_en.is.null,content_en.is.null)&order=created_at.asc&limit=" + batchSize,
  );

  console.log(`Found ${rows.length} published articles missing English fields.`);

  let generated = 0;
  for (const article of rows) {
    const sourceHash = hashSource(article);
    const [existing] = await supabase<Array<{ id: string; status: string }>>(
      `/rest/v1/content_translation_queue?select=id,status&content_type=eq.article&content_id=eq.${encodeURIComponent(article.id)}&target_locale=eq.en&source_hash=eq.${sourceHash}&limit=1`,
    );

    if (existing && ["generated", "approved", "published"].includes(existing.status)) {
      continue;
    }

    if (existing) {
      await supabase(
        `/rest/v1/content_translation_queue?id=eq.${encodeURIComponent(existing.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "processing",
            provider: "google-gemini",
            model: process.env.GEMINI_MODEL ?? "configured",
            attempt_count: 1,
            error_message: null,
          }),
        },
      );
    } else {
      await supabase("/rest/v1/content_translation_queue", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          content_type: "article",
          content_id: article.id,
          source_locale: "ar",
          target_locale: "en",
          source_hash: sourceHash,
          source_payload: {
            title_ar: article.title_ar ?? "",
            summary_ar: article.summary_ar ?? "",
            content_ar: article.content_ar ?? "",
          },
          status: "processing",
          provider: "google-gemini",
          model: process.env.GEMINI_MODEL ?? "configured",
          attempt_count: 1,
        }),
      });
    }

    try {
      const raw = await generateGeminiTextForJob(buildPrompt(article), 6000);
      if (!raw) throw new Error("Gemini returned no content.");
      const translation = parseJson(raw);

      const nextMetadata = {
        ...(article.metadata ?? {}),
        translation: {
          provider: "google-gemini",
          status: "ai_assisted",
          source_locale: "ar",
          target_locale: "en",
          source_hash: sourceHash,
          translated_at: new Date().toISOString(),
        },
      };

      await supabase(
        `/rest/v1/articles?id=eq.${encodeURIComponent(article.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title_en: translation.title_en,
            summary_en: translation.summary_en,
            content_en: translation.content_en,
            metadata: nextMetadata,
            updated_at: new Date().toISOString(),
          }),
        },
      );

      const [queueRow] = await supabase<Array<{ id: string }>>(
        `/rest/v1/content_translation_queue?select=id&content_type=eq.article&content_id=eq.${encodeURIComponent(article.id)}&target_locale=eq.en&source_hash=eq.${sourceHash}&limit=1`,
      );

      if (queueRow) {
        await supabase(
          `/rest/v1/content_translation_queue?id=eq.${encodeURIComponent(queueRow.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              status: "generated",
              draft_payload: translation,
              processed_at: new Date().toISOString(),
              error_message: null,
            }),
          },
        );
      }

      generated += 1;
      console.log(`Generated English translation: ${article.id}`);
    } catch (error) {
      console.error(`Translation failed for ${article.id}:`, error);
      const [queueRow] = await supabase<Array<{ id: string }>>(
        `/rest/v1/content_translation_queue?select=id&content_type=eq.article&content_id=eq.${encodeURIComponent(article.id)}&target_locale=eq.en&source_hash=eq.${sourceHash}&limit=1`,
      );
      if (queueRow) {
        await supabase(
          `/rest/v1/content_translation_queue?id=eq.${encodeURIComponent(queueRow.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              status: "failed",
              error_message: error instanceof Error ? error.message : String(error),
              processed_at: new Date().toISOString(),
            }),
          },
        );
      }
    }
  }

  console.log(`English article translation batch complete: ${generated}/${rows.length} generated.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});