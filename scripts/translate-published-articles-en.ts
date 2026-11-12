import { createHash } from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { resolveStaleTranslationQueueRecovery } from "../src/features/articles/services/translation-queue-recovery";

function requireEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required before translation queue recovery or claims.`);
  }
  return value;
}

const supabaseUrl = requireEnvironmentValue("SUPABASE_URL");
const serviceRoleKey = requireEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY");
const geminiApiKey = requireEnvironmentValue("GEMINI_API_KEY");
function parseBatchSize(raw: string | undefined): number {
  const value = raw?.trim() ? Number(raw) : 5;
  if (!Number.isInteger(value)) {
    throw new Error("TRANSLATION_BATCH_SIZE must be a whole number between 1 and 10.");
  }
  return Math.max(1, Math.min(10, value));
}

const batchSize = parseBatchSize(process.env.TRANSLATION_BATCH_SIZE);

async function generateGeminiTextForJob(prompt: string, maxOutputTokens = 6000): Promise<string | null> {
  const configured = (process.env.GEMINI_MODEL?.replace(/^google\//, "").trim() || "gemini-3.1-flash-lite");
  const client = new GoogleGenerativeAI(geminiApiKey);
  const model = client.getGenerativeModel({
    model: configured,
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  });
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim() || null;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /\b429\b|\b500\b|\b502\b|\b503\b|\b504\b|unavailable|high demand|overloaded/i.test(message);
      if (!retryable || attempt === 2) throw error;
      const delayMs = 3000 * 2 ** attempt;
      console.warn(`Gemini request temporarily unavailable; retrying in ${delayMs}ms (attempt ${attempt + 2}/3).`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}


type ArticleRow = {
  id: string;
  title_ar: string | null;
  summary_ar: string | null;
  content_ar: string | null;
  title_en: string | null;
  summary_en: string | null;
  content_en: string | null;
  updated_at: string | null;
};

async function supabase<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }

  const raw = await response.text();
  return (raw.trim() ? JSON.parse(raw) : {}) as T;
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

type TranslationQueueRow = {
  id: string;
  status: string;
  attempt_count: number | null;
  updated_at: string;
  available_at: string;
};

type TranslationQueueClaim = {
  id: string;
  updatedAt: string;
  attemptCount: number;
};

const TRANSLATION_QUEUE_LEASE_MS = 60 * 60_000;

async function claimTranslationQueueRow(
  article: ArticleRow,
  sourceHash: string,
): Promise<TranslationQueueClaim | null> {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const [existing] = await supabase<TranslationQueueRow[]>(
    `/rest/v1/content_translation_queue?select=id,status,attempt_count,updated_at,available_at&content_type=eq.article&content_id=eq.${encodeURIComponent(article.id)}&target_locale=eq.en&source_hash=eq.${sourceHash}&limit=1`,
  );

  const sourcePayload = {
    title_ar: article.title_ar ?? "",
    summary_ar: article.summary_ar ?? "",
    content_ar: article.content_ar ?? "",
  };
  const provider = "google-gemini";
  const model = process.env.GEMINI_MODEL ?? "configured";

  if (existing) {
    if (["generated", "approved", "published"].includes(existing.status)) return null;
    if (!["queued", "failed", "processing"].includes(existing.status)) return null;

    const updatedAtMs = Date.parse(existing.updated_at);
    if (!Number.isFinite(updatedAtMs)) return null;
    if (existing.status === "processing" && nowMs - updatedAtMs < TRANSLATION_QUEUE_LEASE_MS) {
      return null;
    }

    const availableAtMs = Date.parse(existing.available_at);
    if (
      existing.status !== "processing" &&
      (!Number.isFinite(availableAtMs) || availableAtMs > nowMs)
    ) {
      return null;
    }

    const attemptCount = Math.max(0, Number(existing.attempt_count) || 0) + 1;
    const [claimed] = await supabase<Array<{ id: string; updated_at: string }>>(
      `/rest/v1/content_translation_queue?id=eq.${encodeURIComponent(existing.id)}&status=eq.${encodeURIComponent(existing.status)}&updated_at=eq.${encodeURIComponent(existing.updated_at)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "processing",
          provider,
          model,
          source_payload: sourcePayload,
          attempt_count: attemptCount,
          error_message: null,
          processed_at: null,
          available_at: nowIso,
          updated_at: nowIso,
        }),
      },
    );
    return claimed?.id && claimed.updated_at
      ? { id: claimed.id, updatedAt: claimed.updated_at, attemptCount }
      : null;
  }

  // A unique-key conflict means another runner inserted the same source job.
  // Ignore the duplicate insert and let the owner of that row finish its claim.
  const [created] = await supabase<Array<{ id: string; updated_at: string }>>(
    "/rest/v1/content_translation_queue?on_conflict=content_type,content_id,target_locale,source_hash",
    {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({
        content_type: "article",
        content_id: article.id,
        source_locale: "ar",
        target_locale: "en",
        source_hash: sourceHash,
        source_payload: sourcePayload,
        status: "processing",
        provider,
        model,
        attempt_count: 1,
        available_at: nowIso,
      }),
    },
  );
  return created?.id && created.updated_at
    ? { id: created.id, updatedAt: created.updated_at, attemptCount: 1 }
    : null;
}

async function updateTranslationQueueClaim(
  claim: TranslationQueueClaim,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const [updated] = await supabase<Array<{ id: string }>>(
    `/rest/v1/content_translation_queue?id=eq.${encodeURIComponent(claim.id)}&status=eq.processing&updated_at=eq.${encodeURIComponent(claim.updatedAt)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    },
  );
  return Boolean(updated?.id);
}

type StaleTranslationQueueRow = {
  id: string;
  content_id: string;
  source_hash: string;
  updated_at: string;
};

async function recoverStaleTranslationQueueRows(): Promise<void> {
  const staleBefore = new Date(Date.now() - TRANSLATION_QUEUE_LEASE_MS).toISOString();
  const staleRows = await supabase<StaleTranslationQueueRow[]>(
    `/rest/v1/content_translation_queue?select=id,content_id,source_hash,updated_at&content_type=eq.article&target_locale=eq.en&status=eq.processing&updated_at=lt.${encodeURIComponent(staleBefore)}&order=updated_at.asc&limit=${batchSize}`,
  );
  let recovered = 0;
  let deferred = 0;

  for (const queueRow of staleRows ?? []) {
    if (
      !queueRow.id ||
      !queueRow.content_id ||
      !queueRow.updated_at ||
      !Number.isFinite(Date.parse(queueRow.updated_at))
    ) {
      continue;
    }

    let article: (ArticleRow & { published: boolean }) | null = null;
    try {
      const [found] = await supabase<Array<ArticleRow & { published: boolean }>>(
        `/rest/v1/articles?select=id,title_ar,summary_ar,content_ar,title_en,summary_en,content_en,updated_at,published&id=eq.${encodeURIComponent(queueRow.content_id)}&limit=1`,
      );
      article = found ?? null;
    } catch (error) {
      console.warn(
        `Could not inspect stale translation ${queueRow.content_id}; leaving its lease unchanged for a later recovery:`,
        error,
      );
      continue;
    }

    const decision = resolveStaleTranslationQueueRecovery({
      article,
      sourceHashMatches: article !== null && hashSource(article) === queueRow.source_hash,
    });
    const now = new Date();
    const nowIso = now.toISOString();
    const patch = decision.status === "generated"
      ? {
          status: "generated",
          draft_payload: decision.draftPayload,
          processed_at: nowIso,
          error_message: null,
          available_at: nowIso,
          updated_at: nowIso,
        }
      : {
          status: "failed",
          processed_at: nowIso,
          error_message: decision.errorMessage,
          available_at: new Date(now.getTime() + 15 * 60_000).toISOString(),
          updated_at: nowIso,
        };

    try {
      const [updated] = await supabase<Array<{ id: string }>>(
        `/rest/v1/content_translation_queue?id=eq.${encodeURIComponent(queueRow.id)}&status=eq.processing&updated_at=eq.${encodeURIComponent(queueRow.updated_at)}`,
        {
          method: "PATCH",
          body: JSON.stringify(patch),
        },
      );
      if (!updated?.id) {
        console.warn(`Preserved a newer translation queue state for ${queueRow.content_id}.`);
        continue;
      }
      if (decision.status === "generated") {
        recovered += 1;
        console.info(`Recovered completed translation queue state for ${queueRow.content_id}.`);
      } else {
        deferred += 1;
        console.warn(`Deferred stale translation queue row ${queueRow.content_id}: ${decision.errorMessage}`);
      }
    } catch (error) {
      console.error(`Could not reconcile stale translation queue row ${queueRow.content_id}:`, error);
    }
  }

  if (recovered > 0 || deferred > 0) {
    console.info(
      `[translation] Stale queue reconciliation: ${recovered} completed, ${deferred} deferred for retry or review.`,
    );
  }
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
  await recoverStaleTranslationQueueRows();

  const rows = await supabase<ArticleRow[]>(
    "/rest/v1/articles?select=id,title_ar,summary_ar,content_ar,title_en,summary_en,content_en,updated_at&published=eq.true&or=(title_en.is.null,title_en.eq.,summary_en.is.null,summary_en.eq.,content_en.is.null,content_en.eq.)&order=created_at.asc&limit=" + batchSize,
  );

  console.log(`Found ${rows.length} published articles missing English fields.`);

  let generated = 0;
  let failed = 0;
  for (const article of rows) {
    if (!article.updated_at || !Number.isFinite(Date.parse(article.updated_at))) {
      console.warn(`Skipped ${article.id}; article source has no valid updated_at version for safe translation.`);
      continue;
    }

    const sourceHash = hashSource(article);
    const queueClaim = await claimTranslationQueueRow(article, sourceHash);
    if (!queueClaim) {
      console.log(`Skipped ${article.id}; an active or newer translation queue claim owns this source.`);
      continue;
    }

    try {
      const raw = await generateGeminiTextForJob(buildPrompt(article), 6000);
      if (!raw) throw new Error("Gemini returned no content.");
      const translation = parseJson(raw);

      const fieldsToPatch: Array<"title_en" | "summary_en" | "content_en"> = [];
      if (!article.title_en?.trim()) fieldsToPatch.push("title_en");
      if (!article.summary_en?.trim()) fieldsToPatch.push("summary_en");
      if (!article.content_en?.trim()) fieldsToPatch.push("content_en");

      if (fieldsToPatch.length === 0) {
        const finalized = await updateTranslationQueueClaim(queueClaim, {
          status: "failed",
          error_message: "English fields were completed while this translation was running.",
          processed_at: new Date().toISOString(),
          available_at: new Date(Date.now() + 15 * 60_000).toISOString(),
        });
        if (!finalized) console.warn(`Preserved a newer translation queue state for ${article.id}.`);
        continue;
      }

      const emptyFieldFilters = fieldsToPatch
        .map((field) => `or(${field}.is.null,${field}.eq.)`)
        .join(",");
      const articleFilter =
        `/rest/v1/articles?id=eq.${encodeURIComponent(article.id)}&updated_at=eq.${encodeURIComponent(article.updated_at)}&and=(${emptyFieldFilters})`;
      const articlePatch = Object.fromEntries(
        fieldsToPatch.map((field) => [field, translation[field]]),
      );
      const [updatedArticle] = await supabase<Array<{ id: string }>>(
        articleFilter,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...articlePatch,
            updated_at: new Date().toISOString(),
          }),
        },
      );

      if (!updatedArticle?.id) {
        const finalized = await updateTranslationQueueClaim(queueClaim, {
          status: "failed",
          error_message: "Source article or English fields changed during translation; retry against the current source.",
          processed_at: new Date().toISOString(),
          available_at: new Date(Date.now() + 15 * 60_000).toISOString(),
        });
        if (!finalized) console.warn(`Preserved a newer translation queue state for ${article.id}.`);
        console.warn(`Skipped ${article.id}; the source version changed while Gemini was processing.`);
        continue;
      }

      const finalized = await updateTranslationQueueClaim(queueClaim, {
        status: "generated",
        draft_payload: translation,
        processed_at: new Date().toISOString(),
        error_message: null,
        available_at: new Date().toISOString(),
      });
      if (!finalized) {
        console.warn(`Article ${article.id} was updated, but a newer translation queue state was preserved.`);
        continue;
      }

      generated += 1;
      console.log(`Generated English translation: ${article.id}`);
    } catch (error) {
      failed += 1;
      console.error(`Translation failed for ${article.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const retryDelayMs = Math.min(6 * 60 * 60_000, 15 * 60_000 * 2 ** Math.max(0, queueClaim.attemptCount - 1));
      const finalized = await updateTranslationQueueClaim(queueClaim, {
        status: "failed",
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
        available_at: new Date(Date.now() + retryDelayMs).toISOString(),
      });
      if (!finalized) console.warn(`Preserved a newer translation queue state after failure for ${article.id}.`);
      if (/\b429\b|resource_exhausted|quota|rate.?limit/i.test(errorMessage)) {
        console.error("Gemini quota or rate limit reached; stopping this batch to avoid further calls.");
        break;
      }
    }
  }

  console.log(`English article translation batch complete: ${generated}/${rows.length} generated.`);
  if (failed > 0) {
    throw new Error(`${failed} article translation(s) failed; inspect the logged item errors before retrying.`);
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
