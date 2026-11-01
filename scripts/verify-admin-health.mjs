import { readFileSync } from "node:fs";

const server = readFileSync("src/lib/supabase/server.ts", "utf8");
const platform = readFileSync("src/features/admin/services/platform.ts", "utf8");
const page = readFileSync("src/app/admin/health/page.tsx", "utf8");

if (!server.includes("filter?: { column: string; value: string }")) {
  throw new Error("Admin count helper must support exact status-filtered counts");
}
if (!server.includes("Prefer: \"count=exact\"") || !server.includes("query.set(filter.column, `eq.${filter.value}`)")) {
  throw new Error("Filtered admin counts must preserve the exact Content-Range total");
}
if (!server.includes("Invalid table name") || !server.includes("Invalid filter column")) {
  throw new Error("Admin count query identifiers must be validated");
}
const health = platform.slice(
  platform.indexOf("export async function getAdminHealth"),
  platform.indexOf("export async function getAdminSettings"),
);
if (!health.includes("getExactStatusCounts")) {
  throw new Error("Admin health must count all queue rows by exact status");
}
if (health.includes("limit=500")) {
  throw new Error("Admin health must not truncate queue counts to an arbitrary 500-row sample");
}
if (!health.includes("queuesAvailable: { social: social.available, video: video.available }")) {
  throw new Error("Admin health must distinguish unavailable queue counts from real zeros");
}
if (!page.includes("health.queuesAvailable.social && health.queuesAvailable.video")) {
  throw new Error("Admin health attention metric must require both queue sources to be readable");
}
if (!page.includes('queueAttention === null ? "غير متاح" : queueAttention')) {
  throw new Error("Admin health must render unavailable queue attention as unknown, not zero");
}

console.log("Admin health accuracy contract passed.");
