import { readFileSync } from "node:fs";

const server = readFileSync("src/lib/supabase/server.ts", "utf8");
const apiHealth = readFileSync("src/lib/services/api-health.ts", "utf8");

const platform = readFileSync("src/features/admin/services/platform.ts", "utf8");
if (!apiHealth.includes("const connected = await assertSupabaseConnection()") ||
    !apiHealth.includes("createSupabaseHealthCheck(connected)")) {
  throw new Error("Admin health must surface a failed Supabase data-plane probe instead of reporting unconditional success");
}

const page = readFileSync("src/app/admin/health/page.tsx", "utf8");

if (!server.includes("filter?: { column: string; value: string }")) {
  throw new Error("Admin count helper must support exact status-filtered counts");
}
if (!server.includes('method: "HEAD"')) {
  throw new Error("Admin health exact counts must not fetch table row contents");
}
if (!server.includes('"Range-Unit": "items"') || !server.includes('Range: "0-0"')) {
  throw new Error("Admin health exact counts must use an explicit bounded PostgREST item range");
}
if (!server.includes('Prefer: "count=exact"') || !server.includes("query.set(filter.column, `eq.${filter.value}`)")) {
  throw new Error("Filtered admin counts must preserve the exact Content-Range total");
}
if (!server.includes("Invalid table name") || !server.includes("Invalid filter column")) {
  throw new Error("Admin count query identifiers must be validated");
}

const snapshot = platform.slice(
  platform.indexOf("export async function getAdminSnapshot"),
  platform.indexOf("const OVERVIEW_TABLES"),
);
if (!snapshot.includes('getExactStatusCounts("video_generation_requests"')) {
  throw new Error("Admin dashboard must use exact internal generation queue counts");
}
if (snapshot.includes("social_publish_queue") || snapshot.includes("طابور النشر الاجتماعي")) {
  throw new Error("Admin dashboard must not query or surface the retired external social queue");
}
if (snapshot.includes("/rest/v1/video_generation_requests?select=status")) {
  throw new Error("Admin dashboard must not estimate video queue totals from a 500-row sample");
}

const health = platform.slice(
  platform.indexOf("export async function getAdminHealth"),
  platform.indexOf("export async function getAdminSettings"),
);
if (!health.includes('getExactStatusCounts("video_generation_requests"')) {
  throw new Error("Admin health must count internal video queue rows by exact status");
}
if (health.includes("social_publish_queue") || health.includes("queuesAvailable: { social")) {
  throw new Error("Admin health must not read or display retired social queue status");
}
if (!health.includes("queuesAvailable: { video: video.available }")) {
  throw new Error("Admin health must distinguish unavailable video queue counts from real zeros");
}
if (!platform.includes("getAdminGitHubHealth") || !platform.includes("/commits/main/status") || !platform.includes("/actions/runs?branch=main")) {
  throw new Error("Admin health must expose read-only GitHub commit and workflow status");
}
if (!platform.includes("GITHUB_WORKFLOW_PATHS") || !platform.includes("storage-retention.yml") || !platform.includes(".github/workflows/publish-social.yml")) {
  throw new Error("Admin health must inventory active production workflows only, including approval-gated social delivery");
}

if (!page.includes("حالة النشر والتكاملات") || !page.includes("health.github.statuses") || !page.includes("health.github.workflows")) {
  throw new Error("Admin health page must render deployment and automation health");
}
if (!page.includes("health.queuesAvailable.video") || page.includes("health.queuesAvailable.social")) {
  throw new Error("Admin health must report only internal video queue availability");
}
if (!page.includes('queueAttention === null ? "غير متاح" : queueAttention')) {
  throw new Error("Admin health must render unavailable queue attention as unknown, not zero");
}
if (!page.includes("getAdminSettings") || !page.includes("video_automation_ai_enabled") || !page.includes("video_automation_enabled")) {
  throw new Error("Admin health must read canonical internal worker settings from admin_settings");
}
if (!page.includes("video_automation_auto_publish") || !page.includes("socialAutoPublishEnabled")) {
  throw new Error("Admin health must expose the canonical social auto-publish setting from admin_settings");
}
if (!page.includes("النشر داخل الموقع") || !page.includes("النشر الاجتماعي الخارجي") ||
    !page.includes("فحوص الجودة الآلية") || !page.includes("صلاحيات القنوات") ||
    !page.includes("لا توجد خطوة موافقة بشرية") || page.includes("موافقة مسؤول الفيديو")) {
  throw new Error("Admin health must explain automatic publishing after source-locked QA without manual approval");
}
if (page.includes("getVideoEngineConfig()") || page.includes("engine.autoPublishEnabled")) {
  throw new Error("Admin health must not infer GitHub worker state from the Vercel process environment");
}

console.log("Admin health automated video QA publishing contract passed.");
