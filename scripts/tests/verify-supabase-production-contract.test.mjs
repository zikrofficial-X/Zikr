import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("scripts/verify-supabase-production.mjs", "utf8");
const ordinaryProbe = source.slice(source.indexOf("async function runCheck"), source.indexOf("let failed = false"));
const adminStart = source.indexOf("async function runAdminSchemaContractCheck");
assert.ok(adminStart >= 0, "the production health check must include the optional admin schema probe");
const adminProbe = source.slice(adminStart);

assert.match(source, /const timeoutMs = 15000/, "all production health checks must use the same bounded timeout");
assert.match(ordinaryProbe, /signal: controller\.signal/);
assert.match(ordinaryProbe, /clearTimeout\(timeout\)/);

assert.match(adminProbe, /const controller = new AbortController\(\)/,
  "the service-role schema probe must use an abort controller");
assert.match(adminProbe, /setTimeout\(\(\) => controller\.abort\(\), timeoutMs\)/,
  "the service-role schema probe must use the bounded health-check timeout");
assert.match(adminProbe, /signal: controller\.signal/,
  "the service-role schema probe must pass the timeout signal to fetch");
assert.match(adminProbe, /redirect: "error"/,
  "the service-role schema probe must not treat a followed redirect as a successful schema response");
assert.match(adminProbe, /finally \{\s*clearTimeout\(timeout\);\s*\}/,
  "the service-role schema probe must always clear its timeout");
assert.match(adminProbe, /admin_rate_limits\?select=actor_id&limit=0/,
  "the production schema probe must remain a zero-row, read-only query");
for (const path of [
  "site_audio_upload_intents?select=id&limit=0",
  "background_reminder_preferences?select=timezone&limit=0",
  "youtube_sync_state?select=playlists&limit=0",
  "social_publish_queue?select=target_platforms&limit=0",
]) {
  assert.ok(adminProbe.includes(path), "the production gate must verify " + path);
}
assert.match(adminProbe, /redirect: "error"/, "all new admin schema probes must reject redirects");
assert.doesNotMatch(adminProbe, /method:\s*["'](?:POST|PATCH|DELETE)["']/i,
  "the production health check must not mutate rate-limit rows");

console.log("Production Supabase schema health-check timeout contract passed.");
