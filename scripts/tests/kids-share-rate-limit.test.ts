import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTrustedClientAddress } from "../../src/features/kids/services/client-address";

const route = readFileSync("src/app/api/kids/track-share/route.ts", "utf8");
const limiter = readFileSync("src/features/kids/services/share-rate-limit.ts", "utf8");
const shareComponent = readFileSync("src/features/kids/components/kids-share.tsx", "utf8");
const migration = readFileSync(
  "supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql",
  "utf8",
);

assert.match(route, /consumeKidsShareRateLimit\(getClientAddress\(request\)\)/);
assert.equal(getTrustedClientAddress("198.51.100.2", "spoofed,203.0.113.9"), "198.51.100.2", "the proxy-provided real IP must take precedence over forwarded values");
assert.equal(getTrustedClientAddress(null, "spoofed, 203.0.113.9"), "203.0.113.9", "the last forwarded hop must be used so a client-supplied first value cannot bypass rate limiting");
assert.equal(getTrustedClientAddress(null, "  "), "unknown", "missing client address headers must use a stable fail-closed bucket");

assert.ok(shareComponent.includes("fetch('/api/kids/track-share'"), "the Kids share UI must call the rate-limited tracking endpoint");
for (const platform of ["facebook", "whatsapp", "twitter", "copy-link"]) {
  assert.ok(shareComponent.includes(`trackShare('${platform}')`), `the ${platform} share action must update the server-side share counter`);
}
assert.ok(shareComponent.includes("keepalive: true"), "share tracking should survive the browser opening an external share window");
assert.ok(shareComponent.includes("const getShareUrl = () =>"), "the share URL must be resolved only in the click handler to avoid server/client origin hydration mismatch");
assert.match(route, /readBoundedJsonBody\(request, MAX_REQUEST_BODY_BYTES\)/, "public share tracking must enforce a streamed request-size limit");
assert.doesNotMatch(route, /request\.json\(\)/, "public share tracking must not buffer an unbounded JSON body");
assert.ok(
  route.indexOf("consumeKidsShareRateLimit") < route.indexOf("readBoundedJsonBody"),
  "the shared limiter must run before parsing untrusted request bodies",
);
assert.doesNotMatch(route, /rateLimitBuckets|RATE_LIMIT_WINDOW_MS/, "share throttling must not depend on per-instance memory");
assert.match(route, /status: 429/, "exhausted shared quotas must return HTTP 429");
assert.match(route, /status: 503/, "a failed shared limiter must fail closed");
assert.match(limiter, /consume_admin_rate_limit/, "Kids share requests must use the shared database RPC");
assert.match(limiter, /getContactRateLimitActorId/, "the caller identifier must be stored as an opaque HMAC-derived UUID");
assert.match(limiter, /public_kids_content_share/);
assert.match(
  migration,
  /kids_content\.published is true\s+and kids_content\.is_active is true/i,
  "inactive Kids content must not accept share-counter updates",
);
assert.match(
  migration,
  /coalesce\(kids_content\.shares,\s*0\)\s*\+\s*1/i,
  "share increments must preserve the existing null-safe counter behavior",
);
assert.match(migration, /revoke execute on function public\.increment_kids_content_shares\(text\) from anon, authenticated/i);

console.log("Kids share rate-limit and active-state contracts passed.");
