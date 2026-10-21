import assert from "node:assert/strict";
import {
  FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS,
  extractFacebookReelsRateLimitUntil,
  isFacebookReelsRateLimitResponseError,
  resolveFacebookReelsRateLimitUntil,
} from "../../src/features/social/services/facebook-reels-rate-limit";

const now = Date.parse("2026-10-21T09:30:00.000Z");
const metaRateLimit = new Error(
  "Facebook Reel start failed (HTTP 400): temporary restriction [type=OAuthException, code=368, subcode=1390008, trace=TRACE_ID]",
);
const expectedUntil = new Date(now + FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS).toISOString();

assert.equal(isFacebookReelsRateLimitResponseError(metaRateLimit), true);
assert.equal(resolveFacebookReelsRateLimitUntil(metaRateLimit, now), expectedUntil);

const deferred = new Error(
  \`Facebook Reels publishing paused by Meta rate-limit protection until \${expectedUntil} (code=368). [facebook_reels_rate_limited_until=\${expectedUntil}]\`,
);
assert.equal(extractFacebookReelsRateLimitUntil(deferred), expectedUntil);
assert.equal(isFacebookReelsRateLimitResponseError(deferred), false);
assert.equal(resolveFacebookReelsRateLimitUntil(deferred, now), expectedUntil);
assert.equal(isFacebookReelsRateLimitResponseError(new Error("HTTP 403: permission denied")), false);
assert.equal(resolveFacebookReelsRateLimitUntil(new Error("HTTP 403: permission denied"), now), null);

console.log("Facebook Reels rate-limit cooldown tests passed.");
