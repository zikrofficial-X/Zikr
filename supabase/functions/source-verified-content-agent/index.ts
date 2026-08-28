import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const PROJECT_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase Edge Function service credentials.");
}

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Source = {
  id: string;
  name: string;
  base_url: string;
  fetch_url: string | null;
  api_key_secret_name: string | null;
  source_type: "quran" | "hadith" | "dua" | "tafsir" | "article";
  parser_key: string;
};

type SourceItem = {
  externalId: string;
  title: string | null;
  body: string | null;
  sourceUrl: string;
  metadata: Record<string, unknown>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
  return result === 0;
}

async function isAuthorized(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!supplied) return false;
  const { data, error } = await supabase.rpc("get_push_scheduler_secret");
  if (error || typeof data !== "string" || !data) return false;
  return constantTimeEqual(supplied, data);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseItems(
  source: Source,
  payload: unknown,
  retrievedAt: string
): SourceItem[] {
  if (source.parser_key === "alquran_cloud") {
    const data = (payload as { data?: unknown }).data;
    if (!Array.isArray(data)) return [];
    return data.flatMap(entry => {
      if (!entry || typeof entry !== "object") return [];
      const row = entry as Record<string, unknown>;
      const number = row.number;
      if (typeof number !== "number" && typeof number !== "string") return [];
      const externalId = `surah:${number}`;
      const title = stringValue(row.name) ?? stringValue(row.englishName);
      return [
        {
          externalId,
          title,
          body: null,
          sourceUrl: `${source.base_url.replace(/\/$/, "")}/v1/surah/${number}`,
          metadata: {
            source: source.name,
            retrievedAt,
            rawType: "surah_catalog",
          },
        },
      ];
    });
  }

  // API responses from providers requiring credentials are intentionally not
  // interpreted by a generic parser. A provider-specific parser must be added
  // and reviewed before enabling that source.
  return [];
}

async function processSource(source: Source, now: string) {
  if (!source.fetch_url)
    return {
      fetched: 0,
      queued: 0,
      skipped: 1,
      failed: 0,
      reason: "missing_fetch_url",
    };
  const headers = new Headers({ Accept: "application/json" });
  if (source.api_key_secret_name) {
    const key = Deno.env.get(source.api_key_secret_name);
    if (!key)
      return {
        fetched: 0,
        queued: 0,
        skipped: 1,
        failed: 0,
        reason: "missing_source_secret",
      };
    headers.set("Authorization", `Bearer ${key}`);
  }

  const response = await fetch(source.fetch_url, { headers });
  if (!response.ok)
    throw new Error(`${source.name} returned HTTP ${response.status}`);
  const payload = await response.json();
  const items = parseItems(source, payload, now);
  let queued = 0;

  for (const item of items) {
    const contentHash = await sha256(
      `${source.id}:${item.externalId}:${item.sourceUrl}`
    );
    const { data: insertedRows, error } = await supabase
      .from("content_agent_queue")
      .upsert(
        {
          source_id: source.id,
          external_id: item.externalId,
          content_type: source.source_type,
          title: item.title,
          body: item.body,
          source_url: item.sourceUrl,
          source_retrieved_at: now,
          content_hash: contentHash,
          status: "pending",
          is_machine_generated: false,
          metadata: item.metadata,
          updated_at: now,
        },
        { onConflict: "source_id,external_id", ignoreDuplicates: true }
      )
      .select("id");
    if (error) throw error;
    queued += insertedRows?.length ?? 0;
  }

  return { fetched: items.length, queued, skipped: 0, failed: 0 };
}

function nextDailyRunAt(startedAt: string): string {
  const next = new Date(startedAt);
  next.setUTCHours(3, 0, 0, 0);
  if (next.getTime() <= Date.parse(startedAt)) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.toISOString();
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async request => {
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  if (!(await isAuthorized(request)))
    return json({ error: "Unauthorized" }, 401);

  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("content_agent_runs")
    .insert({ started_at: startedAt, status: "running" })
    .select("id")
    .single();
  if (runError) return json({ error: "Unable to create run record" }, 500);

  const summary = {
    fetched: 0,
    queued: 0,
    skipped: 0,
    failed: 0,
    sources: [] as Array<Record<string, unknown>>,
  };
  const { data: sources, error: sourceError } = await supabase
    .from("content_agent_sources")
    .select(
      "id,name,base_url,fetch_url,api_key_secret_name,source_type,parser_key"
    )
    .eq("enabled", true)
    .lte("next_run_at", startedAt)
    .limit(10);
  if (sourceError) {
    await supabase
      .from("content_agent_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "failed",
        failed_count: 1,
        details: { error: sourceError.message },
      })
      .eq("id", run.id);
    return json({ error: "Unable to load sources" }, 500);
  }

  for (const source of (sources ?? []) as Source[]) {
    try {
      const result = await processSource(source, startedAt);
      summary.fetched += result.fetched;
      summary.queued += result.queued;
      summary.skipped += result.skipped;
      summary.sources.push({ name: source.name, ...result });
      await supabase
        .from("content_agent_sources")
        .update({
          last_checked_at: startedAt,
          next_run_at: nextDailyRunAt(startedAt),
        })
        .eq("id", source.id);
    } catch (error) {
      summary.failed += 1;
      summary.sources.push({
        name: source.name,
        failed: 1,
        error: error instanceof Error ? error.message : "unknown error",
      });
      await supabase
        .from("content_agent_sources")
        .update({ last_checked_at: startedAt })
        .eq("id", source.id);
    }
  }

  const finalStatus =
    summary.failed > 0
      ? summary.queued > 0
        ? "partial"
        : "failed"
      : "succeeded";
  await supabase
    .from("content_agent_runs")
    .update({
      finished_at: new Date().toISOString(),
      status: finalStatus,
      fetched_count: summary.fetched,
      queued_count: summary.queued,
      skipped_count: summary.skipped,
      failed_count: summary.failed,
      details: summary,
    })
    .eq("id", run.id);
  return json({ ok: summary.failed === 0, runId: run.id, ...summary });
});
