import assert from "node:assert/strict";
import {
  FACEBOOK_REELS_MIN_POST_INTERVAL_MS,
  FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS,
  extractFacebookReelsNextAllowedAt,
  isFacebookReelsRateLimitResponseError,
  resolveFacebookReelsNextAllowedAt,
} from "../../src/features/social/services/facebook-reels-rate-limit";

const now = Date.parse("2026-10-21T09:30:00.000Z");
const metaRateLimit = new Error(
  "Facebook Reel start failed (HTTP 400): temporary restriction [type=OAuthException, code=368, subcode=1390008, trace=TRACE_ID]",
);
const expectedUntil = new Date(now + FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS).toISOString();

assert.equal(isFacebookReelsRateLimitResponseError(metaRateLimit), true);
assert.equal(resolveFacebookReelsNextAllowedAt(metaRateLimit, now), expectedUntil);
assert.equal(FACEBOOK_REELS_MIN_POST_INTERVAL_MS, 12 * 60 * 1000);

const deferred = new Error(
  "Facebook Reels publishing paused by provider cooldown until " + expectedUntil + ". [facebook_reels_next_allowed_at=" + expectedUntil + "]",
);
assert.equal(extractFacebookReelsNextAllowedAt(deferred), expectedUntil);
assert.equal(isFacebookReelsRateLimitResponseError(deferred), false);
assert.equal(resolveFacebookReelsNextAllowedAt(deferred, now), expectedUntil);
assert.equal(isFacebookReelsRateLimitResponseError(new Error("HTTP 403: permission denied")), false);
assert.equal(resolveFacebookReelsNextAllowedAt(new Error("HTTP 403: permission denied"), now), null);

console.log("Facebook Reels rate-limit cooldown tests passed.");