import assert from "node:assert/strict";
import { canAttemptSocialPlatform, getEnabledSocialPlatforms, getUnavailableSocialPlatforms } from "../../src/features/social/services/platform-availability";

const both = getEnabledSocialPlatforms({ SOCIAL_PUBLISH_FACEBOOK_ENABLED: "true", SOCIAL_PUBLISH_YOUTUBE_ENABLED: "true" });
assert.deepEqual(both, ["facebook", "facebook_reels", "youtube"]);

const facebookOnly = getEnabledSocialPlatforms({ SOCIAL_PUBLISH_FACEBOOK_ENABLED: "true", SOCIAL_PUBLISH_YOUTUBE_ENABLED: "false" });
assert.deepEqual(facebookOnly, ["facebook", "facebook_reels"]);
assert.deepEqual(getUnavailableSocialPlatforms(["facebook", "youtube"], facebookOnly), ["youtube"]);

const youtubeOnly = getEnabledSocialPlatforms({ SOCIAL_PUBLISH_FACEBOOK_ENABLED: "false", SOCIAL_PUBLISH_YOUTUBE_ENABLED: "true" });
assert.deepEqual(youtubeOnly, ["youtube"]);
assert.deepEqual(getUnavailableSocialPlatforms(["facebook_reels", "youtube"], youtubeOnly), ["facebook_reels"]);

assert.deepEqual(getEnabledSocialPlatforms({}), [], "missing flags must fail closed");
assert.deepEqual(getEnabledSocialPlatforms({ SOCIAL_PUBLISH_FACEBOOK_ENABLED: "true" }), ["facebook", "facebook_reels"], "one configured channel must not require the other");

const metadata = {
  platformResults: {
    facebook: { platform: "facebook", ok: false, error: "Facebook OAuthException: access token expired" },
    youtube: { platform: "youtube", ok: false, error: "HTTP 503 temporary provider issue" },
  },
  platformAttempts: { facebook: 1, youtube: 1 },
  authBlocked: true,
};
assert.equal(canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata, maxAttempts: 5 }), false, "Facebook auth failure must block only Facebook");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata, maxAttempts: 5 }), true, "Facebook auth failure must not block YouTube retry");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: facebookOnly, metadata, maxAttempts: 5 }), false, "disabled channel must not be attempted");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformAttempts: { youtube: 5 } }, maxAttempts: 5 }), false, "retry ceiling is tracked per platform");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformResults: { youtube: { ok: true, remoteId: "yt-1" } } }, maxAttempts: 5 }), false, "successful channel must never be republished");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformResults: { youtube: { ok: false, error: "missing OAuth configuration" } } }, maxAttempts: 5 }), false, "permanent platform failure is isolated");
const missingMediaFailure = {
  platformResults: {
    facebook_reels: {
      platform: "facebook_reels",
      ok: false,
      error: "Facebook Reel upload failed (HTTP 422): Meta upload response did not confirm success",
    },
  },
  platformAttempts: { facebook_reels: 4 },
};
assert.equal(
  canAttemptSocialPlatform({ platform: "facebook_reels", enabledPlatforms: both, metadata: missingMediaFailure, maxAttempts: 5 }),
  false,
  "HTTP 422 media validation failures must not be retried against the same source asset",
);

console.log("Social platform isolation and independent readiness tests passed.");

const legacyFacebookAuthBlock = { authBlocked: true, attempts: 5 };
assert.equal(canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata: legacyFacebookAuthBlock, maxAttempts: 5 }), false, "legacy Facebook auth block must continue holding Facebook");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: legacyFacebookAuthBlock, maxAttempts: 5 }), true, "legacy Facebook auth block must not block YouTube");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformResults: { facebook: { ok: false, error: "Facebook access token expired" } }, platformAttempts: { facebook: 5 } }, maxAttempts: 5 }), true, "a Facebook-only result must not block a fresh YouTube target");
