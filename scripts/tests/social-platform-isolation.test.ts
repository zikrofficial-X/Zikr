import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canAttemptSocialPlatform, getEnabledSocialPlatforms, getManualReconciliationPlatforms, getRetryableSocialPlatforms, getUnavailableSocialPlatforms, isAmbiguousProviderOutcome, normalizeSocialPlatformResults } from "../../src/features/social/services/platform-availability";
import { buildFacebookQueueRecoveryPatch } from "../../src/features/social/services/facebook-queue-recovery-policy";

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

assert.equal(isAmbiguousProviderOutcome("Facebook Reel upload timed out"), true, "provider timeouts have an uncertain remote outcome");
assert.equal(isAmbiguousProviderOutcome("fetch failed: UND_ERR_SOCKET / ECONNRESET"), true, "connection resets must be held for reconciliation");
assert.equal(isAmbiguousProviderOutcome("HTTP 503 provider unavailable"), true, "provider 5xx responses must not be retried blindly");
assert.equal(isAmbiguousProviderOutcome("HTTP 429 rate limit"), false, "rate limits remain safely deferrable");
assert.equal(isAmbiguousProviderOutcome("HTTP 422 invalid media"), false, "confirmed media validation failures remain permanent failures");

const ambiguousOutcome = {
  platformResults: {
    youtube: { platform: "youtube", ok: false, requiresReconciliation: true, error: "YouTube upload timed out; remote outcome unknown" },
  },
};
assert.deepEqual(getManualReconciliationPlatforms(ambiguousOutcome), ["youtube"]);
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: ambiguousOutcome, maxAttempts: 5 }), false, "uncertain provider outcomes must not be retried automatically");
assert.equal(canAttemptSocialPlatform({ platform: "facebook_reels", enabledPlatforms: both, metadata: ambiguousOutcome, maxAttempts: 5 }), true, "an uncertain YouTube result must not block an independent Facebook target");

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
assert.equal(
  canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { permanentFailure: true }, maxAttempts: 5 }),
  false,
  "legacy global permanent-failure metadata must fail closed when no per-platform list exists",
);

const mixedRetryMetadata = {
  authBlocked: true,
  permanentFailure: true,
  permanentFailurePlatforms: ["facebook_reels"],
  platformResults: {
    facebook: { ok: false, error: "Facebook OAuthException: access token expired" },
    facebook_reels: { ok: false, error: "HTTP 422 invalid media" },
    youtube: { ok: false, requiresReconciliation: true, error: "YouTube upload timed out; remote outcome unknown" },
  },
};
assert.deepEqual(
  getRetryableSocialPlatforms(["facebook", "facebook_reels", "youtube"], mixedRetryMetadata, false),
  [],
  "normal retry must hold auth-blocked, permanent 422, and ambiguous provider outcomes",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["facebook", "facebook_reels", "youtube"], mixedRetryMetadata, true),
  ["youtube"],
  "explicit no-remote-publication confirmation may release only the ambiguous YouTube target, never permanent Facebook failures",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["facebook", "facebook_reels"], { authBlocked: true }, false),
  [],
  "legacy global Facebook auth blocks must remain held when no Facebook result ledger exists",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["youtube"], { authBlocked: true }, false),
  ["youtube"],
  "legacy Facebook auth blocks must not block an independent YouTube retry",
);


const legacyArrayResults = {
  platformResults: [
    { platform: "youtube", ok: true, remoteId: "youtube-legacy-remote" },
    { platform: "facebook_reels", ok: false, error: "Facebook OAuthException: access token expired" },
  ],
  authBlocked: true,
  authBlockedPlatforms: ["facebook_reels"],
  permanentFailure: true,
  permanentFailurePlatforms: ["facebook"],
};
assert.deepEqual(
  normalizeSocialPlatformResults(legacyArrayResults.platformResults),
  {
    youtube: { platform: "youtube", ok: true, remoteId: "youtube-legacy-remote" },
    facebook_reels: { platform: "facebook_reels", ok: false, error: "Facebook OAuthException: access token expired" },
  },
  "legacy array-shaped platform results must normalize without losing remote IDs",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: legacyArrayResults, maxAttempts: 5 }),
  false,
  "legacy array-shaped successful provider IDs must prevent duplicate publication",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "facebook_reels", enabledPlatforms: both, metadata: legacyArrayResults, maxAttempts: 5 }),
  false,
  "explicit per-platform auth blocks must survive when results use the legacy array shape",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata: legacyArrayResults, maxAttempts: 5 }),
  false,
  "explicit permanent-failure platforms must remain blocked independently",
);


const legacyGlobalAuthWithYoutubeResult = {
  authBlocked: true,
  platformResults: {
    youtube: { platform: "youtube", ok: false, error: "temporary provider failure" },
  },
};
assert.equal(
  canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata: legacyGlobalAuthWithYoutubeResult, maxAttempts: 5 }),
  false,
  "a legacy global Facebook auth flag must still block Facebook when only a YouTube result exists",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "facebook_reels", enabledPlatforms: both, metadata: legacyGlobalAuthWithYoutubeResult, maxAttempts: 5 }),
  false,
  "a legacy global Facebook auth flag must hold both Facebook targets when no Facebook result exists",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: legacyGlobalAuthWithYoutubeResult, maxAttempts: 5 }),
  true,
  "a legacy global Facebook auth flag must not block an independent YouTube retry",
);

const explicitBlocksWithoutResults = {
  authBlocked: false,
  authBlockedPlatforms: ["facebook_reels"],
  permanentFailurePlatforms: ["facebook"],
};
assert.equal(
  canAttemptSocialPlatform({ platform: "facebook_reels", enabledPlatforms: both, metadata: explicitBlocksWithoutResults, maxAttempts: 5 }),
  false,
  "per-platform auth block lists must be honored even when platformResults is absent",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata: explicitBlocksWithoutResults, maxAttempts: 5 }),
  false,
  "per-platform permanent-failure lists must be honored even when platformResults is absent",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: explicitBlocksWithoutResults, maxAttempts: 5 }),
  true,
  "a Facebook-only block must not prevent an independent YouTube target",
);

const adminSocialRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/social/route.ts"),
  "utf8",
);
assert.match(adminSocialRoute, /normalizeSocialPlatformResults\(item\.metadata\?\.platformResults\)/);
assert.match(adminSocialRoute, /getRetryableSocialPlatforms\(item\.target_platforms, item\.metadata, allowAmbiguous\)/);
assert.match(adminSocialRoute, /authBlockedPlatforms\(item\.metadata, item\.target_platforms\)/);
assert.match(adminSocialRoute, /authBlocked: remainingAuthBlockedPlatforms\.length > 0/);

console.log("Social platform isolation and independent readiness tests passed.");

const legacyFacebookAuthBlock = { authBlocked: true, attempts: 5 };
assert.equal(canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata: legacyFacebookAuthBlock, maxAttempts: 5 }), false, "legacy Facebook auth block must continue holding Facebook");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: legacyFacebookAuthBlock, maxAttempts: 5 }), true, "legacy Facebook auth block must not block YouTube");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformResults: { facebook: { ok: false, error: "Facebook access token expired" } }, platformAttempts: { facebook: 5 } }, maxAttempts: 5 }), true, "a Facebook-only result must not block a fresh YouTube target");


const facebookRecovery = buildFacebookQueueRecoveryPatch(
  {
    authBlocked: true,
    authBlockedPlatforms: ["facebook"],
    permanentFailure: true,
    permanentFailurePlatforms: ["facebook_reels"],
    attempts: 7,
    platformResults: {
      facebook: { ok: false, error: "Facebook access token expired" },
      facebook_reels: { ok: false, error: "HTTP 422 media source unavailable" },
      youtube: { ok: true, remoteId: "youtube-remote-1" },
    },
    platformAttempts: { facebook: 4, facebook_reels: 4, youtube: 1 },
  },
  ["facebook", "facebook_reels", "youtube"],
  "2026-11-10T10:00:00.000Z",
);
assert.ok(facebookRecovery, "an auth-blocked Facebook target must produce a recovery patch");
assert.equal(facebookRecovery.metadata.authBlocked, false);
assert.deepEqual(facebookRecovery.metadata.authBlockedPlatforms, []);
assert.equal(facebookRecovery.metadata.permanentFailure, true);
assert.deepEqual(facebookRecovery.metadata.permanentFailurePlatforms, ["facebook_reels"]);
assert.equal(
  (facebookRecovery.metadata.platformResults as Record<string, unknown>).facebook,
  undefined,
  "only the reauthorized Facebook target result is cleared",
);
assert.deepEqual(
  (facebookRecovery.metadata.platformResults as Record<string, unknown>).facebook_reels,
  { ok: false, error: "HTTP 422 media source unavailable" },
  "a separate permanent Reels failure must not be reset by Facebook Page reauthorization",
);
assert.deepEqual(
  (facebookRecovery.metadata.platformResults as Record<string, unknown>).youtube,
  { ok: true, remoteId: "youtube-remote-1" },
  "a successful YouTube result must remain untouched",
);
assert.deepEqual(facebookRecovery.metadata.platformAttempts, { facebook: 0, facebook_reels: 4, youtube: 1 });
assert.equal(facebookRecovery.metadata.attempts, 7, "reauthorization must not reset the overall retry history");

const legacyFacebookRecovery = buildFacebookQueueRecoveryPatch(
  { authBlocked: true, platformAttempts: { facebook: 5, facebook_reels: 5 } },
  ["facebook", "facebook_reels"],
  "2026-11-10T10:00:00.000Z",
);
assert.deepEqual(
  legacyFacebookRecovery?.metadata.platformAttempts,
  { facebook: 0, facebook_reels: 0 },
  "legacy global Facebook auth blocks with no Facebook result ledger must still release both Facebook targets",
);

const legacyGlobalWithPermanentReels = buildFacebookQueueRecoveryPatch(
  {
    authBlocked: true,
    permanentFailure: true,
    permanentFailurePlatforms: ["facebook_reels"],
    platformAttempts: { facebook: 5, facebook_reels: 5 },
  },
  ["facebook", "facebook_reels"],
  "2026-11-10T10:00:00.000Z",
);
assert.deepEqual(
  legacyGlobalWithPermanentReels?.metadata.platformAttempts,
  { facebook: 0, facebook_reels: 5 },
  "a legacy global auth flag must not reset a separately declared permanent Reels failure when the result ledger is absent",
);
assert.deepEqual(
  legacyGlobalWithPermanentReels?.metadata.permanentFailurePlatforms,
  ["facebook_reels"],
  "the legacy recovery fallback must preserve explicit permanent failure targets",
);
assert.equal(
  legacyGlobalWithPermanentReels?.metadata.permanentFailure,
  true,
  "global permanent failure must remain set while any declared permanent target remains",
);

const legacyMixedFacebookRecovery = buildFacebookQueueRecoveryPatch(
  {
    authBlocked: true,
    platformResults: {
      facebook: { ok: false, error: "Facebook OAuthException: access token expired" },
      facebook_reels: { ok: false, error: "HTTP 422 invalid media" },
      youtube: { ok: true, remoteId: "youtube-remote-2" },
    },
    platformAttempts: { facebook: 4, facebook_reels: 4, youtube: 1 },
    permanentFailure: true,
    permanentFailurePlatforms: ["facebook_reels"],
  },
  ["facebook", "facebook_reels", "youtube"],
  "2026-11-10T10:00:00.000Z",
);
assert.ok(legacyMixedFacebookRecovery, "a legacy global flag with an explicit Facebook OAuth result must release that target");
assert.equal(
  (legacyMixedFacebookRecovery.metadata.platformResults as Record<string, unknown>).facebook,
  undefined,
  "the confirmed Facebook auth failure must be cleared",
);
assert.deepEqual(
  (legacyMixedFacebookRecovery.metadata.platformResults as Record<string, unknown>).facebook_reels,
  { ok: false, error: "HTTP 422 invalid media" },
  "a separate permanent Facebook Reels failure must not be cleared by legacy global auth recovery",
);
assert.deepEqual(
  legacyMixedFacebookRecovery.metadata.platformAttempts,
  { facebook: 0, facebook_reels: 4, youtube: 1 },
  "only the confirmed auth-blocked platform attempt counter may reset",
);
assert.deepEqual(
  legacyMixedFacebookRecovery.metadata.permanentFailurePlatforms,
  ["facebook_reels"],
  "non-auth permanent failure metadata must survive legacy global auth recovery",
);
assert.deepEqual(
  (legacyMixedFacebookRecovery.metadata.platformResults as Record<string, unknown>).youtube,
  { ok: true, remoteId: "youtube-remote-2" },
  "a successful YouTube remote ID must remain untouched during Facebook recovery",
);

assert.equal(
  buildFacebookQueueRecoveryPatch(
    {
      authBlocked: true,
      platformResults: {
        facebook_reels: { ok: false, error: "HTTP 422 invalid media" },
      },
    },
    ["facebook_reels"],
    "2026-11-10T10:00:00.000Z",
  ),
  null,
  "a global auth flag must not override a recorded non-auth Facebook failure",
);
