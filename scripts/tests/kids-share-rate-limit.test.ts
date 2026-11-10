import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/kids/track-share/route.ts", "utf8");
const limiter = readFileSync("src/features/kids/services/share-rate-limit.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql",
  "utf8",
);

assert.match(route, /consumeKidsShareRateLimit\(getClientAddress\(request\)\)/);
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
assert.match(migration, /revoke execute on function public\.increment_kids_content_shares\(text\) from anon, authenticated/i);

console.log("Kids share rate-limit and active-state contracts passed.");
