import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dispatchSocialWorkerSafely } from "../../src/features/social/services/social-worker-dispatch";
import { resolve } from "node:path";
import { canAttemptSocialPlatform, getEnabledSocialPlatforms, getManualReconciliationPlatforms, getRetryableSocialPlatforms, getUnavailableSocialPlatforms, isAmbiguousProviderOutcome, isAuthBlocked, isPermanentSocialFailure, mergeAuthBlockedPlatforms, normalizeSocialPlatformResults, parseRequestedSocialPlatforms } from "../../src/features/social/services/platform-availability";
import { DEFAULT_SOCIAL_PUBLISH_AFTER, buildFacebookQueueRecoveryFilter, buildFacebookQueueRecoveryPatch, resolveSocialPublishCutoff } from "../../src/features/social/services/facebook-queue-recovery-policy";
import { buildYouTubeQueueRecoveryFilter, buildYouTubeQueueRecoveryPatch } from "../../src/features/social/services/youtube-queue-recovery-policy";
import { hasFacebookPagePublishingTask } from "../../src/features/social/services/facebook-oauth-policy";
import { buildSocialPublishInFlightMetadata, buildStaleSocialPublishRecoveryMetadata, clearRevalidatedSocialApprovalDeferrals, clearSocialPublishInFlightMetadata } from "../../src/features/social/services/social-publish-recovery-policy";
import {
  FacebookPageNotConnectedError,
  getFacebookPageCredentials,
  getOptionalFacebookPageCredentials,
  isMissingFacebookReelsCooldownColumnError,
  readStoredFacebookCredential,
  type StoredFacebookCredential,
} from "../../src/features/social/services/facebook-credentials";


let safeDispatchCalls = 0;
const successfulDispatch = await dispatchSocialWorkerSafely(async () => {
  safeDispatchCalls += 1;
  return { workflowFile: "publish-social.yml" };
});
assert.deepEqual(successfulDispatch, {
  workerDispatched: true,
  worker: { workflowFile: "publish-social.yml" },
  error: null,
});
const failedDispatchError = new Error("GitHub dispatch unavailable");
const failedDispatch = await dispatchSocialWorkerSafely(async () => {
  safeDispatchCalls += 1;
  throw failedDispatchError;
});
assert.equal(failedDispatch.workerDispatched, false);
assert.equal(failedDispatch.worker, null);
assert.equal(failedDispatch.error, failedDispatchError);
assert.equal(safeDispatchCalls, 2, "dispatch outcomes must be tested with injected functions, never the production GitHub workflow");

const facebookRecoveryCandidate = {
  id: "queue-row-123",
  status: "partial",
  updated_at: "2026-11-12T06:00:00.000Z",
  created_at: "2026-11-12T05:00:00.000Z",
};
assert.equal(
  buildFacebookQueueRecoveryFilter(facebookRecoveryCandidate),
  "id=eq.queue-row-123&status=eq.partial&updated_at=eq.2026-11-12T06%3A00%3A00.000Z&created_at=eq.2026-11-12T05%3A00%3A00.000Z&metadata->>authBlocked=eq.true",
  "Facebook reauthorization recovery must compare the exact row version and still require the auth-block marker",
);
assert.equal(
  buildFacebookQueueRecoveryFilter({ ...facebookRecoveryCandidate, updated_at: null }),
  null,
  "a recovery candidate without an updated_at version must fail closed",
);
assert.equal(
  buildFacebookQueueRecoveryFilter({ ...facebookRecoveryCandidate, created_at: "2026-11-06T19:59:59.000Z" }),
  null,
  "historical Facebook auth-blocked rows before the publishing cutoff must remain outside automatic recovery",
);
assert.equal(
  buildFacebookQueueRecoveryFilter({ ...facebookRecoveryCandidate, created_at: null }),
  null,
  "a recovery candidate without a creation timestamp must fail closed",
);
assert.equal(
  resolveSocialPublishCutoff(DEFAULT_SOCIAL_PUBLISH_AFTER),
  "2026-11-06T20:00:00.000Z",
  "the shared social publishing cutoff must normalize to a stable UTC timestamp",
);
assert.throws(
  () => resolveSocialPublishCutoff("not-a-date"),
  /Invalid SOCIAL_PUBLISH_AFTER cutoff/,
  "an invalid publishing cutoff must fail closed",
);
assert.equal(
  buildFacebookQueueRecoveryFilter({ ...facebookRecoveryCandidate, status: "processing" }),
  null,
  "Facebook reauthorization must never rewrite a row already claimed by a publisher",
);

const both = getEnabledSocialPlatforms({ SOCIAL_PUBLISH_FACEBOOK_ENABLED: "true", SOCIAL_PUBLISH_YOUTUBE_ENABLED: "true" });
assert.deepEqual(both, ["facebook", "facebook_reels", "youtube"]);
assert.deepEqual(parseRequestedSocialPlatforms(undefined), { ok: true, platforms: [] }, "an omitted platform filter intentionally means all eligible targets");
assert.deepEqual(parseRequestedSocialPlatforms([]), { ok: true, platforms: [] }, "an explicit empty platform filter preserves the existing all-target UI behavior");
assert.deepEqual(parseRequestedSocialPlatforms(["youtube", "facebook", "youtube"]), { ok: true, platforms: ["youtube", "facebook"] }, "valid platform filters are deduplicated without widening");
assert.equal(parseRequestedSocialPlatforms(["instagram"]).ok, false, "unsupported platform values must not widen a delete/retry action to every platform");
assert.equal(parseRequestedSocialPlatforms("youtube").ok, false, "non-array platform input must be rejected");
assert.equal(parseRequestedSocialPlatforms(["youtube", null]).ok, false, "mixed valid/invalid platform input must be rejected atomically");

const facebookOnly = getEnabledSocialPlatforms({ SOCIAL_PUBLISH_FACEBOOK_ENABLED: "true", SOCIAL_PUBLISH_YOUTUBE_ENABLED: "false" });
assert.deepEqual(facebookOnly, ["facebook", "facebook_reels"]);
assert.deepEqual(getUnavailableSocialPlatforms(["facebook", "youtube"], facebookOnly), ["youtube"]);

assert.equal(hasFacebookPagePublishingTask(undefined), false, "missing Meta Page task data must fail closed");
assert.equal(hasFacebookPagePublishingTask(null), false, "null Meta Page task data must fail closed");
assert.equal(hasFacebookPagePublishingTask([]), false, "an empty Meta Page task list must not authorize publishing");
assert.equal(hasFacebookPagePublishingTask(["ANALYZE", "MODERATE"]), false, "read/analytics-only Page tasks must not authorize publishing");
assert.equal(hasFacebookPagePublishingTask(["CREATE_CONTENT"]), true, "classic Page roles with CREATE_CONTENT may publish");
assert.equal(hasFacebookPagePublishingTask(["PROFILE_PLUS_CREATE_CONTENT"]), true, "New Pages Experience PROFILE_PLUS_CREATE_CONTENT may publish");
assert.equal(hasFacebookPagePublishingTask(["PROFILE_PLUS_FULL_CONTROL"]), true, "New Pages Experience full-control roles may publish");
assert.equal(hasFacebookPagePublishingTask(["MANAGE"]), false, "task-management access alone must not be treated as content publishing access");


const youtubeOnly = getEnabledSocialPlatforms({ SOCIAL_PUBLISH_FACEBOOK_ENABLED: "false", SOCIAL_PUBLISH_YOUTUBE_ENABLED: "true" });
assert.deepEqual(youtubeOnly, ["youtube"]);
assert.deepEqual(getUnavailableSocialPlatforms(["facebook_reels", "youtube"], youtubeOnly), ["facebook_reels"]);

assert.deepEqual(getEnabledSocialPlatforms({}), [], "missing flags must fail closed");
const sourceMediaMissingMetadata = {
  sourceMediaMissing: true,
  authBlocked: true,
  authBlockedPlatforms: ["facebook_reels"],
  permanentFailure: true,
  permanentFailurePlatforms: ["facebook_reels"],
};
assert.equal(canAttemptSocialPlatform({ platform: "facebook_reels", enabledPlatforms: both, metadata: sourceMediaMissingMetadata, maxAttempts: 5 }), false, "missing source media must block every automatic platform attempt");
assert.deepEqual(getRetryableSocialPlatforms(["facebook_reels", "youtube"], sourceMediaMissingMetadata), [], "manual retry policy must not release a missing-media row");
assert.equal(buildFacebookQueueRecoveryPatch(sourceMediaMissingMetadata, ["facebook_reels"], "2026-11-10T12:00:00.000Z"), null, "Facebook reauthorization must not release a missing-media row");
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


const legacyAmbiguousOutcome = {
  platformResults: {
    youtube: { platform: "youtube", ok: false, error: "HTTP 503 temporary provider issue" },
  },
};
assert.deepEqual(
  getManualReconciliationPlatforms(legacyAmbiguousOutcome),
  ["youtube"],
  "legacy 5xx results without the newer reconciliation flag must still be treated as ambiguous",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: legacyAmbiguousOutcome, maxAttempts: 5 }),
  false,
  "the background worker must not automatically retry a legacy ambiguous provider result",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["youtube"], legacyAmbiguousOutcome),
  [],
  "admin retry must require explicit no-remote-publication confirmation for legacy ambiguous results",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["youtube"], legacyAmbiguousOutcome, true),
  ["youtube"],
  "the explicit no-remote-publication confirmation may release only the selected ambiguous platform",
);
const explicitManualHold = {
  manualReconciliationPlatforms: ["youtube", "legacy-provider", "youtube"],
};
assert.deepEqual(
  getManualReconciliationPlatforms(explicitManualHold),
  ["youtube"],
  "persisted manual reconciliation metadata must remain authoritative even when a platform result is absent",
);
assert.equal(
  canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: explicitManualHold, maxAttempts: 5 }),
  false,
  "the background worker must honor an explicit persisted manual hold without relying on platformResults",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["youtube"], explicitManualHold),
  [],
  "admin retry must not silently release an explicit manual hold",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["youtube"], explicitManualHold, true),
  ["youtube"],
  "only an explicit no-remote-publication confirmation may release a persisted manual hold",
);
assert.equal(isAmbiguousProviderOutcome("TypeError: fetch failed"), true, "a fetch transport failure is ambiguous");
assert.equal(isAmbiguousProviderOutcome("ECONNRESET"), true, "a reset provider connection is ambiguous");

const attemptStartedAt = "2026-11-11T10:00:00.000Z";
const inFlightMetadata = buildSocialPublishInFlightMetadata(
  { attempts: 2, platformResults: { facebook: { ok: true, remoteId: "fb-confirmed-1" } } },
  ["youtube"],
  attemptStartedAt,
);
assert.deepEqual(inFlightMetadata.inFlightPlatforms, ["youtube"]);
assert.equal(inFlightMetadata.inFlightStartedAt, attemptStartedAt);

const interruptedRecovery = buildStaleSocialPublishRecoveryMetadata(
  inFlightMetadata,
  ["facebook", "youtube"],
  "2026-11-11T10:25:00.000Z",
);
assert.deepEqual(interruptedRecovery.manualReconciliationPlatforms, ["youtube"]);
assert.equal(interruptedRecovery.hasPriorSuccess, true);
const interruptedResults = interruptedRecovery.metadata.platformResults as Record<string, { ok?: boolean; remoteId?: string; requiresReconciliation?: boolean }>;
assert.equal(interruptedResults.facebook?.remoteId, "fb-confirmed-1", "a confirmed prior delivery must remain intact");
assert.equal(interruptedResults.youtube?.requiresReconciliation, true, "an interrupted provider request must be held for manual reconciliation");
assert.deepEqual(getManualReconciliationPlatforms(interruptedRecovery.metadata), ["youtube"]);
assert.deepEqual(interruptedRecovery.metadata.inFlightPlatforms, []);
assert.equal(interruptedRecovery.metadata.inFlightStartedAt, null);
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: interruptedRecovery.metadata, maxAttempts: 5 }), false, "an interrupted provider request must never be retried automatically");
assert.equal(canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata: interruptedRecovery.metadata, maxAttempts: 5 }), false, "confirmed delivery must remain protected from duplicate publication");

const partialMarkerRecovery = buildStaleSocialPublishRecoveryMetadata(
  { inFlightStartedAt: attemptStartedAt },
  ["facebook", "youtube"],
  "2026-11-11T10:25:00.000Z",
);
assert.deepEqual(
  partialMarkerRecovery.manualReconciliationPlatforms,
  ["facebook", "youtube"],
  "a partial marker without a target list must conservatively hold every known target",
);

const completedMetadata = clearSocialPublishInFlightMetadata(
  inFlightMetadata,
  ["youtube"],
  attemptStartedAt,
  "2026-11-11T10:01:00.000Z",
);
assert.equal("inFlightPlatforms" in completedMetadata, false, "completed attempts must clear the in-flight target marker");
assert.equal("inFlightStartedAt" in completedMetadata, false, "completed attempts must clear the in-flight timestamp");
assert.deepEqual(completedMetadata.lastAttemptPlatforms, ["youtube"]);

const revalidatedPublisherSource = readFileSync(
  resolve(process.cwd(), "src/features/social/services/social-publishing.ts"),
  "utf8",
);

const inFlightMarkerPosition = revalidatedPublisherSource.indexOf("const inFlightMetadata = buildSocialPublishInFlightMetadata");
const providerCallPosition = revalidatedPublisherSource.indexOf("const results = await Promise.all(runnablePlatforms.map");
assert.ok(inFlightMarkerPosition >= 0 && providerCallPosition > inFlightMarkerPosition, "the durable in-flight marker must be written before any provider call");
assert.match(revalidatedPublisherSource, /buildStaleSocialPublishRecoveryMetadata/, "stale recovery must convert interrupted calls into manual reconciliation");
assert.match(revalidatedPublisherSource, /Failed to recover stale social publish items; refusing to continue with an incomplete queue state/, "stale recovery failures must fail the job instead of silently skipping ambiguous rows");
assert.match(
  revalidatedPublisherSource,
  /resolveSocialPublishCutoff\(process\.env\.SOCIAL_PUBLISH_AFTER\)/,
  "queue selection and stale recovery must use the same validated publishing cutoff as Facebook auth-block recovery",
);


const metadata = {
  platformResults: {
    facebook: { platform: "facebook", ok: false, error: "Facebook OAuthException: access token expired" },
    youtube: { platform: "youtube", ok: false, error: "HTTP 429 rate limit" },
  },
  platformAttempts: { facebook: 1, youtube: 1 },
  authBlocked: true,
};
assert.equal(canAttemptSocialPlatform({ platform: "facebook", enabledPlatforms: both, metadata, maxAttempts: 5 }), false, "Facebook auth failure must block only Facebook");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata, maxAttempts: 5 }), true, "Facebook auth failure must not block YouTube retry");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: facebookOnly, metadata, maxAttempts: 5 }), false, "disabled channel must not be attempted");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformAttempts: { youtube: 5 } }, maxAttempts: 5 }), false, "retry ceiling is tracked per platform");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformResults: { youtube: { ok: true, remoteId: "yt-1" } } }, maxAttempts: 5 }), false, "successful channel must never be republished");
assert.equal(canAttemptSocialPlatform({ platform: "youtube", enabledPlatforms: both, metadata: { platformResults: { youtube: { ok: false, error: "missing OAuth configuration" } } }, maxAttempts: 5 }), false, "YouTube OAuth failures remain held until upload reauthorization and explicit release");
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
assert.equal(
  canAttemptSocialPlatform({
    platform: "youtube",
    enabledPlatforms: both,
    metadata: { approvalDeferredPlatforms: ["youtube"] },
    maxAttempts: 5,
  }),
  false,
  "the background publisher must respect editorial and scholarly approval deferrals",
);
assert.deepEqual(
  getRetryableSocialPlatforms(
    ["youtube"],
    {
      approvalDeferredPlatforms: ["youtube"],
      platformResults: { youtube: { ok: false, error: "Editorial approval is required" } },
    },
    true,
  ),
  [],
  "even explicit no-remote-publication confirmation must not bypass editorial or scholarly approval deferrals",
);

const approvalAfterRevalidation = clearRevalidatedSocialApprovalDeferrals({
  approvalBlocked: true,
  approvalDeferredPlatforms: ["youtube", "facebook", "legacy-provider"],
  kidsSourceApprovalBlocked: true,
  kidsSourceApprovalPending: true,
  writtenArticlePublicationBlocked: true,
  writtenArticlePublicationPending: true,
  unrelatedAuditMarker: "preserve",
}, ["youtube"]);
assert.deepEqual(
  approvalAfterRevalidation.approvalDeferredPlatforms,
  ["facebook", "legacy-provider"],
  "fresh revalidation must clear only the supported target holds that were actually rechecked",
);
assert.equal(approvalAfterRevalidation.approvalBlocked, false);
assert.equal(approvalAfterRevalidation.kidsSourceApprovalBlocked, false);
assert.equal(approvalAfterRevalidation.kidsSourceApprovalPending, false);
assert.equal(approvalAfterRevalidation.writtenArticlePublicationBlocked, false);
assert.equal(approvalAfterRevalidation.writtenArticlePublicationPending, false);
assert.equal(approvalAfterRevalidation.unrelatedAuditMarker, "preserve");
assert.equal(
  canAttemptSocialPlatform({
    platform: "youtube",
    enabledPlatforms: both,
    metadata: approvalAfterRevalidation,
    maxAttempts: 5,
  }),
  true,
  "a YouTube target must become retryable only after its current approval state has been revalidated",
);
assert.equal(
  canAttemptSocialPlatform({
    platform: "facebook",
    enabledPlatforms: both,
    metadata: approvalAfterRevalidation,
    maxAttempts: 5,
  }),
  false,
  "a target whose approval state was not revalidated must remain held",
);


const socialWorkerStart = revalidatedPublisherSource.indexOf("export async function processSocialPublishItem(");
const videoApprovalCheck = revalidatedPublisherSource.indexOf("if (!(await hasVideoApprovalForQueueItem(item)))", socialWorkerStart);
const sourceApprovalCheck = revalidatedPublisherSource.indexOf("const sourceApproval = await checkWrittenPostSourceApproval(item);", videoApprovalCheck);
const clearApprovalHolds = revalidatedPublisherSource.indexOf("clearRevalidatedSocialApprovalDeferrals(item.metadata, platforms)", sourceApprovalCheck);
const runnablePlatformsCheck = revalidatedPublisherSource.indexOf("const runnablePlatforms =", clearApprovalHolds);
assert.ok(
  socialWorkerStart >= 0 &&
  videoApprovalCheck > socialWorkerStart &&
  sourceApprovalCheck > videoApprovalCheck &&
  clearApprovalHolds > sourceApprovalCheck &&
  runnablePlatformsCheck > clearApprovalHolds,
  "the worker may clear old approval holds only after QA/source revalidation and before selecting runnable targets",
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

const facebookOAuthCallbackSource = readFileSync(resolve(process.cwd(), "src/app/api/admin/social/facebook/callback/route.ts"), "utf8");
assert.match(facebookOAuthCallbackSource, /findFacebookPageAcrossPages/, "Facebook OAuth must inspect paginated Page results");
assert.match(facebookOAuthCallbackSource, /limit", "100"/, "Facebook OAuth must request the maximum Page-list page size");
assert.match(facebookOAuthCallbackSource, /searchParams\.set\("after", after\)/, "Facebook OAuth must follow Meta cursor pagination");
assert.match(facebookOAuthCallbackSource, /page_lookup_incomplete/, "Facebook OAuth must not misreport a bounded incomplete scan as a missing Page");
assert.match(facebookOAuthCallbackSource, /hasFacebookPagePublishingTask\(selectedPage\.tasks\)/, "OAuth must validate a publish-capable Page task before storing credentials");

const socialPublishQueueSource = readFileSync(
  resolve("src/features/social/services/social-publishing.ts"),
  "utf8",
);
assert.match(socialPublishQueueSource, /select=id,metadata,target_platforms,updated_at/);
assert.match(socialPublishQueueSource, /requireSocialQueueRows<SocialPublishQueueItem>\(stale, "stale social publish query"\)/);
assert.match(socialPublishQueueSource, /buildStaleSocialPublishRecoveryFilter\(item\.id, staleBefore, item\.updated_at\)/);
const adminSocialRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/social/route.ts"),
  "utf8",
);
assert.match(adminSocialRoute, /normalizeSocialPlatformResults\(item\.metadata\?\.platformResults\)/);
assert.match(adminSocialRoute, /parseRequestedSocialPlatforms\(body\.platforms\)/, "admin social actions must reject invalid platform filters instead of silently broadening scope");
const adminSocialClient = readFileSync(
  resolve(process.cwd(), "src/app/admin/social/social-client.tsx"),
  "utf8",
);
assert.match(adminSocialRoute, /deleteLocalMemory === true[\s\S]*?status: 400/, "the API must reject the unimplemented destructive local-memory flag");
assert.doesNotMatch(adminSocialClient, /deleteLocalMemory|localMemoryDeleted|localMemoryFailed/, "the admin UI must not advertise or report local media deletion that the API does not perform");
assert.match(adminSocialClient, /نسخة الفيديو داخل ZIKR لا تُحذف من هذا الإجراء/, "the admin UI must clearly state that only remote social posts are deleted");

assert.match(adminSocialRoute, /getRetryableSocialPlatforms\(item\.target_platforms, item\.metadata, allowAmbiguous\)/);
assert.ok(adminSocialRoute.includes("approvalDeferredPlatforms: preservedApprovalDeferredPlatforms"), "admin retries must preserve all outstanding approval gates.");
assert.match(adminSocialRoute, /authBlockedPlatforms\(item\.metadata, item\.target_platforms\)/);
assert.match(adminSocialRoute, /authBlocked: remainingAuthBlockedPlatforms\.length > 0/);
assert.match(adminSocialRoute, /item\.metadata\?\.sourceMediaMissing === true/);
assert.match(adminSocialRoute, /sourceMediaMissingSkipped/);
assert.match(adminSocialRoute, /async function dispatchQueuedSocialWorker[\s\S]*?dispatchSocialWorkerSafely\(triggerSocialWorker\)/);
for (const action of ["publish_now", "retry_all_failed", "retry"]) {
  const start = adminSocialRoute.indexOf(`if (action === "${action}")`);
  const next = adminSocialRoute.indexOf("\n    if (action ===", start + 1);
  const block = start >= 0 ? adminSocialRoute.slice(start, next > start ? next : undefined) : "";
  assert.ok(block.includes("dispatchQueuedSocialWorker"), `${action} must not turn a saved queue mutation into an HTTP 500 when worker dispatch fails`);
  assert.ok(block.includes("workerDispatchFailed"), `${action} must report the dispatch fallback state`);
}
assert.ok(adminSocialClient.includes("payload.workerDispatchFailed") && adminSocialClient.includes("تحقّق من تفعيل الناشر المجدول"), "the admin UI must not claim an unverified scheduled workflow will run");
const releaseStart = adminSocialRoute.indexOf('if (action === "release_auth_blocked_queue")');
const releaseEnd = adminSocialRoute.indexOf('if (action === "run_worker")', releaseStart + 1);
const releaseBlock = adminSocialRoute.slice(releaseStart, releaseEnd);
assert.match(releaseBlock, /queueUpdateFailed[\s\S]*status:\s*503/);
assert.match(releaseBlock, /workerDispatchFailed:\s*released > 0 && !workerDispatched/);
assert.ok(adminSocialClient.includes("payload.released") && adminSocialClient.includes("payload.queueUpdateFailed"), "the dedicated release handler must consume the API's release count and reject unconfirmed queue updates");
const runActionStart = adminSocialClient.indexOf("const runAction = useCallback");
const runActionEnd = adminSocialClient.indexOf("const deletePublished", runActionStart + 1);
const runActionBlock = adminSocialClient.slice(runActionStart, runActionEnd);
assert.ok(runActionStart >= 0 && runActionEnd > runActionStart, "the generic queue action handler must remain discoverable for its contract checks");
assert.doesNotMatch(runActionBlock, /release_auth_blocked_queue|payload\.released/, "the generic retry/delete/publish handler must not handle the separate auth-block release action");
assert.match(runActionBlock, /async \(action: "retry" \| "retry_all_failed" \| "delete" \| "delete_failed" \| "publish_now"\)/, "the generic handler's action union must match the actions it actually dispatches");
assert.match(adminSocialClient, /const releaseAuthBlockedQueue = useCallback[\s\S]*?action: "release_auth_blocked_queue"[\s\S]*?payload\.released/, "auth-block release must stay in its dedicated handler");

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


// Facebook credential reads may use the legacy projection only when the additive
// Reels cooldown column is specifically missing. Transient failures must propagate.
const missingFacebookCooldownColumn = new Error(
  'Supabase REST 400: {"code":"42703","message":"column social_platform_credentials.facebook_reels_next_allowed_at does not exist"}',
);
const transientFacebookCredentialRead = new Error("Supabase REST 503: upstream unavailable");
const legacyFacebookCredential: Omit<StoredFacebookCredential, "facebook_reels_next_allowed_at"> = {
  platform: "facebook",
  page_id: "page-test-123",
  page_name: "ZIKR test page",
  page_access_token: "unit-test-token",
  is_enabled: true,
  token_type: "page",
  expires_at: null,
  granted_permissions: ["pages_manage_posts", "pages_read_engagement", "pages_show_list", "read_insights"],
  connection_status: "connected",
  last_validated_at: null,
  last_error_code: null,
  last_error_message: null,
  connected_at: null,
  updated_at: "2026-11-12T06:00:00.000Z",
};

assert.equal(isMissingFacebookReelsCooldownColumnError(missingFacebookCooldownColumn), true);
assert.equal(
  isMissingFacebookReelsCooldownColumnError(new Error("PGRST204: Could not find the 'facebook_reels_next_allowed_at' column in the schema cache")),
  true,
);
assert.equal(
  isMissingFacebookReelsCooldownColumnError(
    new Error("column social_platform_credentials.facebook_reels_next_allowed_at does not exist"),
  ),
  true,
  "a plain PostgreSQL missing-column message must also permit the legacy projection",
);
assert.equal(isMissingFacebookReelsCooldownColumnError(transientFacebookCredentialRead), false);

let legacyReadCalls = 0;
const legacyFacebookRead = async <T>(path: string): Promise<T> => {
  legacyReadCalls += 1;
  if (path.includes("facebook_reels_next_allowed_at")) throw missingFacebookCooldownColumn;
  return [legacyFacebookCredential] as T;
};
assert.deepEqual(
  await readStoredFacebookCredential(legacyFacebookRead),
  { ...legacyFacebookCredential, facebook_reels_next_allowed_at: null },
  "a confirmed missing additive column may use the legacy projection",
);
assert.equal(legacyReadCalls, 2, "the legacy projection must run only after the missing-column error");

let transientReadCalls = 0;
await assert.rejects(
  readStoredFacebookCredential(async <T>(): Promise<T> => {
    transientReadCalls += 1;
    throw transientFacebookCredentialRead;
  }),
  /upstream unavailable/,
  "transient credential-store failures must propagate instead of looking like a missing Page",
);
assert.equal(transientReadCalls, 1, "transient errors must not trigger the legacy-column fallback");

let fallbackReadCalls = 0;
await assert.rejects(
  readStoredFacebookCredential(async <T>(): Promise<T> => {
    fallbackReadCalls += 1;
    if (fallbackReadCalls === 1) throw missingFacebookCooldownColumn;
    throw new Error("Supabase REST 503: legacy projection unavailable");
  }),
  /legacy projection unavailable/,
  "a failed legacy projection must remain an error rather than returning an empty credential",
);
assert.equal(fallbackReadCalls, 2);

assert.equal(
  await getOptionalFacebookPageCredentials(async () => null),
  null,
  "a successful empty credential lookup means Facebook is genuinely not connected",
);
await assert.rejects(
  getFacebookPageCredentials(async () => null),
  FacebookPageNotConnectedError,
);
await assert.rejects(
  getOptionalFacebookPageCredentials(async () => { throw transientFacebookCredentialRead; }),
  /upstream unavailable/,
  "the optional getter must suppress only the explicit not-connected state",
);
const expiredFacebookCredential = {
  ...legacyFacebookCredential,
  expires_at: "2020-01-01T00:00:00.000Z",
  facebook_reels_next_allowed_at: null,
} satisfies StoredFacebookCredential;
await assert.rejects(
  getOptionalFacebookPageCredentials(async () => expiredFacebookCredential),
  /access token has expired/,
  "an expired Page token must remain a recoverable enqueue error, not become not_required",
);

const socialPublishWorkflowSource = readFileSync(
  resolve(process.cwd(), ".github/workflows/publish-social.yml"),
  "utf8",
);
assert.ok(
  socialPublishWorkflowSource.includes(`SOCIAL_PUBLISH_AFTER: "${DEFAULT_SOCIAL_PUBLISH_AFTER}"`),
  "the production publisher workflow and queue recovery must share the same historical-row cutoff",
);
const facebookCredentialsSource = readFileSync(
  resolve(process.cwd(), "src/features/social/services/facebook-credentials.ts"),
  "utf8",
);
assert.match(facebookCredentialsSource, /select=id,target_platforms,metadata,status,updated_at,created_at/);
assert.match(facebookCredentialsSource, /created_at=gte/);
assert.match(facebookCredentialsSource, /buildFacebookQueueRecoveryFilter\(item, publishAfter\)/);
assert.match(facebookCredentialsSource, /if \(!patch \|\| !filter\) continue/);

const templateVideoWorker = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");
assert.ok(
  templateVideoWorker.includes("getOptionalFacebookPageCredentials()"),
  "video enqueue must distinguish a missing Facebook connection from credential-store or authorization failures",
);
assert.doesNotMatch(
  templateVideoWorker,
  /getFacebookPageCredentials\(\)\.catch\(\(\) => null\)/,
  "video enqueue must not swallow Facebook credential failures",
);


const facebookOAuthConnectSource = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/social/facebook/connect/route.ts"),
  "utf8",
);
assert.match(
  facebookOAuthConnectSource,
  /requireAdminStepUpApi\("social\.publish"/,
  "Facebook OAuth connect must require social.publish MFA step-up before starting a publishing-capable flow",
);
assert.match(
  facebookOAuthConnectSource,
  /"nextPath"\s+in\s+publishStepUp/,
  "Facebook OAuth connect must narrow the MFA result union before reading its optional nextPath",
);
assert.match(
  facebookOAuthCallbackSource,
  /await saveFacebookPageCredential\(/,
  "Facebook OAuth callback must persist the verified Page credential",
);
assert.doesNotMatch(
  facebookOAuthCallbackSource,
  /unblockFacebookAuthBlockedQueue/,
  "Facebook OAuth callback must not silently resume previously blocked posts; queue release requires the separate confirmed social.publish action",
);
const adminSocialRouteSource = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/social/route.ts"),
  "utf8",
);
const adoptionActionStart = adminSocialRouteSource.indexOf('if (action === "adopt_server_facebook_token")');
const adoptionActionEnd = adminSocialRouteSource.indexOf('if (action === "release_auth_blocked_queue")', adoptionActionStart);
const adoptionActionBlock = adoptionActionStart >= 0 && adoptionActionEnd > adoptionActionStart
  ? adminSocialRouteSource.slice(adoptionActionStart, adoptionActionEnd)
  : "";
assert.ok(adoptionActionStart >= 0 && adoptionActionEnd > adoptionActionStart, "server token adoption must remain a distinct action");
assert.match(adoptionActionBlock, /adoptServerConfiguredFacebookPageToken\(\)/, "server token adoption must validate and store the server-only token");
assert.doesNotMatch(
  adoptionActionBlock,
  /unblockFacebookAuthBlockedQueue|triggerSocialWorker/,
  "server token adoption must not resume or dispatch queued posts; only the separate confirmed action may do that",
);
const socialPublishGateStart = adminSocialRouteSource.indexOf('if (["retry"');
const socialPublishGateEnd = adminSocialRouteSource.indexOf("const ids", socialPublishGateStart);
const socialPublishGate = socialPublishGateStart >= 0 && socialPublishGateEnd > socialPublishGateStart
  ? adminSocialRouteSource.slice(socialPublishGateStart, socialPublishGateEnd)
  : "";
assert.match(socialPublishGate, /release_auth_blocked_queue/, "queue release must be in the social.publish step-up action set");
assert.match(socialPublishGate, /requireAdminStepUpApi\("social\.publish"/, "queue release must require MFA step-up");
const releaseActionStart = adminSocialRouteSource.indexOf('if (action === "release_auth_blocked_queue")');
const releaseActionEnd = adminSocialRouteSource.indexOf('if (action === "run_worker")', releaseActionStart);
const releaseActionBlock = releaseActionStart >= 0 && releaseActionEnd > releaseActionStart
  ? adminSocialRouteSource.slice(releaseActionStart, releaseActionEnd)
  : "";
assert.ok(releaseActionStart >= 0 && releaseActionEnd > releaseActionStart, "an explicit queue-release action must exist");
assert.match(releaseActionBlock, /body\.confirmed !== true/, "queue release must require explicit confirmation");
assert.match(releaseActionBlock, /health\.facebookConnectionStatus !== "connected"/, "queue release must verify a connected Facebook Page");
assert.match(releaseActionBlock, /health\.facebookEnabled !== true/, "queue release must verify Facebook publishing is enabled");
assert.match(releaseActionBlock, /unblockFacebookAuthBlockedQueue\(\)/, "only the explicit action may release auth-blocked queue rows");
assert.match(releaseActionBlock, /permission: "social\.publish"/, "queue release must be audited as social.publish");

assert.equal(
  isAmbiguousProviderOutcome("YouTube publisher completed without returning a remote post/video ID."),
  true,
  "a provider success without a remote ID is ambiguous and must require reconciliation instead of automatic republishing",
);
for (const blockedSourceMetadata of [
  { writtenArticlePublicationBlocked: true },
  { kidsSourceApprovalBlocked: true },
]) {
  assert.equal(
    canAttemptSocialPlatform({
      platform: "facebook",
      enabledPlatforms: both,
      metadata: blockedSourceMetadata,
      maxAttempts: 5,
    }),
    false,
    "source approval blocks must keep failed social queue items out of automatic retry selection",
  );
  assert.deepEqual(
    getRetryableSocialPlatforms(["facebook"], blockedSourceMetadata),
    [],
    "source approval blocks must not be presented as automatically retryable",
  );
}
assert.deepEqual(
  getManualReconciliationPlatforms({
    kidsSourceApprovalBlocked: true,
    platformResults: {
      youtube: {
        ok: false,
        error: "HTTP 503: provider outcome is uncertain",
        requiresReconciliation: true,
      },
    },
  }),
  ["youtube"],
  "source approval holds must not hide independent provider reconciliation requirements",
);
assert.ok(
  adminSocialRouteSource.includes("const retryMetadata = {") &&
    adminSocialRouteSource.includes("{ ...item, metadata: retryMetadata }"),
  "an explicit admin retry must revalidate source-approval holds before selecting platforms",
);
assert.ok(
  adminSocialRouteSource.includes("writtenArticlePublicationBlocked: false") &&
    adminSocialRouteSource.includes("kidsSourceApprovalBlocked: false") &&
    adminSocialRouteSource.includes("manualReconciliationPlatforms: remainingManualReconciliationPlatforms"),
  "an explicit retry must clear only the selected resolved source/manual holds while preserving unrelated approval gates",
);


assert.equal(
  (adminSocialRouteSource.match(/const auditRecorded = await recordSocialAuditEvent\(/g) ?? []).length,
  10,
  "every social mutation/connection-test audit write must use the best-effort wrapper",
);
assert.match(
  adminSocialRouteSource,
  /async function recordSocialAuditEvent[\s\S]*?try[\s\S]*?await recordAdminAuditEvent\(event\)[\s\S]*?catch/,
  "audit logging failure must not turn an already-dispatched publish/delete into a retryable 500",
);
assert.match(
  adminSocialRouteSource,
  /return NextResponse\.json\(\{ ok: true, worker, auditRecorded \}\)/,
  "worker dispatch responses must report whether their audit record was saved",
);
const socialClientAuditSource = readFileSync(
  resolve(process.cwd(), "src/app/admin/social/social-client.tsx"),
  "utf8",
);
assert.ok(
  socialClientAuditSource.includes("payload.auditRecorded === false") &&
    socialClientAuditSource.includes("لا تعِد"),
  "the admin UI must warn about audit gaps and explicitly discourage repeating committed social actions",
);

const youtubeAuthError = "YouTube OAuth token refresh failed (HTTP 400): invalid_grant";
const mergedLegacyAuthBlocks = mergeAuthBlockedPlatforms(
  { authBlocked: true, authBlockedPlatforms: [], platformResults: {} },
  ["facebook", "youtube"],
  ["youtube"],
  [{ platform: "youtube", error: youtubeAuthError }],
);
assert.deepEqual(
  mergedLegacyAuthBlocks,
  ["facebook", "youtube"],
  "a YouTube attempt must not overwrite a legacy global Facebook auth block; both targets must become explicit",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["facebook", "youtube"], {
    authBlocked: true,
    authBlockedPlatforms: mergedLegacyAuthBlocks,
    platformResults: {},
  }),
  [],
  "a legacy Facebook block must remain held while the independent YouTube block is present",
);
const recoveredLegacyAuthBlocks = buildYouTubeQueueRecoveryPatch(
  {
    authBlocked: true,
    authBlockedPlatforms: mergedLegacyAuthBlocks,
    platformResults: {},
  },
  ["facebook", "youtube"],
  "2026-11-13T10:00:00.000Z",
);
assert.deepEqual(
  recoveredLegacyAuthBlocks?.metadata.authBlockedPlatforms,
  ["facebook"],
  "YouTube recovery must clear only the YouTube block and retain the legacy Facebook block",
);
assert.equal(recoveredLegacyAuthBlocks?.metadata.authBlocked, true);
assert.deepEqual(
  getRetryableSocialPlatforms(["facebook", "youtube"], recoveredLegacyAuthBlocks?.metadata ?? {}),
  ["youtube"],
  "after YouTube recovery, Facebook must remain held and only YouTube may retry",
);
assert.deepEqual(
  mergeAuthBlockedPlatforms(
    { authBlocked: true, authBlockedPlatforms: ["facebook"] },
    ["facebook", "youtube"],
    ["facebook"],
    [],
  ),
  [],
  "a freshly attempted Facebook target must clear its old auth block when it no longer returns an auth failure",
);
assert.equal(
  isAuthBlocked("facebook", "Facebook OAuthException: Error validating access token"),
  true,
  "Facebook access-token OAuth failures must remain auth-blocked",
);
assert.equal(isAuthBlocked("youtube", youtubeAuthError), true, "YouTube invalid_grant and OAuth refresh failures must be classified as auth blocks");
assert.equal(isPermanentSocialFailure(youtubeAuthError), false, "YouTube auth failures must not be mislabeled as permanent media/provider failures");
const youtubeInsufficientPermissionError = 'YouTube video upload failed (HTTP 403): {"error":{"errors":[{"reason":"insufficientPermissions"}]}}';
assert.equal(
  isAuthBlocked("youtube", youtubeInsufficientPermissionError),
  true,
  "Google's insufficientPermissions 403 must surface as a YouTube authorization block instead of a silent failed queue row",
);
assert.equal(
  isPermanentSocialFailure(youtubeInsufficientPermissionError),
  false,
  "a YouTube permission 403 must remain recoverable after upload-scope reauthorization",
);
assert.deepEqual(
  getRetryableSocialPlatforms(["youtube"], {
    platformResults: { youtube: { ok: false, error: youtubeInsufficientPermissionError } },
  }),
  [],
  "YouTube permission failures must remain held until explicit reauthorization and queue recovery",
);
assert.equal(
  isAuthBlocked("youtube", 'YouTube video upload failed (HTTP 403): {"error":{"errors":[{"reason":"quotaExceeded"}]}}'),
  false,
  "quota exhaustion must not be misclassified as an OAuth permission block",
);
assert.equal(isAuthBlocked("youtube", "HTTP 422 invalid media"), false, "confirmed media validation failures are not auth blocks");
const youtubeAuthMetadata = {
  authBlocked: true,
  authBlockedPlatforms: ["youtube", "facebook"],
  permanentFailure: true,
  permanentFailurePlatforms: ["youtube", "facebook_reels"],
  platformResults: {
    youtube: { ok: false, error: youtubeAuthError },
    facebook: { ok: true, remoteId: "fb-keep" },
  },
  platformAttempts: { youtube: 5, facebook: 1 },
};
assert.deepEqual(getRetryableSocialPlatforms(["youtube"], youtubeAuthMetadata), [], "a YouTube auth block must remain held until upload reauthorization");
const youtubeRecovery = buildYouTubeQueueRecoveryPatch(
  youtubeAuthMetadata,
  ["youtube", "facebook", "facebook_reels"],
  "2026-11-13T10:00:00.000Z",
  "2026-11-13T10:00:00.001Z",
);
assert.ok(youtubeRecovery, "a confirmed YouTube OAuth block must produce a recovery patch");
assert.equal(youtubeRecovery.status, "queued");
assert.equal(youtubeRecovery.metadata.authBlocked, true, "the independent Facebook auth block must remain held");
assert.deepEqual(youtubeRecovery.metadata.authBlockedPlatforms, ["facebook"]);
assert.equal(youtubeRecovery.metadata.permanentFailure, true, "the independent Reels permanent failure must remain held");
assert.deepEqual(youtubeRecovery.metadata.permanentFailurePlatforms, ["facebook_reels"]);
assert.deepEqual(youtubeRecovery.metadata.platformResults, { facebook: { ok: true, remoteId: "fb-keep" } }, "only the failed YouTube auth result is cleared");
assert.deepEqual(youtubeRecovery.metadata.platformAttempts, { youtube: 0, facebook: 1 });
assert.deepEqual(getRetryableSocialPlatforms(["youtube"], youtubeRecovery.metadata), ["youtube"], "YouTube becomes retryable only after explicit recovery");
assert.deepEqual(getRetryableSocialPlatforms(["facebook"], youtubeRecovery.metadata), [], "YouTube recovery must not release Facebook");
assert.deepEqual(getRetryableSocialPlatforms(["facebook_reels"], youtubeRecovery.metadata), [], "YouTube recovery must not clear a Reels permanent failure");
const malformedPermanentFailureRecovery = buildYouTubeQueueRecoveryPatch(
  {
    authBlockedPlatforms: ["youtube"],
    permanentFailurePlatforms: ["facebook_reels", null, 17],
    platformResults: { youtube: { ok: false, error: youtubeAuthError } },
  },
  ["youtube", "facebook_reels"],
  "2026-11-13T10:00:00.000Z",
);
assert.deepEqual(
  malformedPermanentFailureRecovery?.metadata.permanentFailurePlatforms,
  ["facebook_reels"],
  "untrusted non-string permanent-failure metadata must be ignored without clearing valid platform holds",
);
assert.equal(
  buildYouTubeQueueRecoveryPatch(
    { platformResults: { youtube: { ok: false, error: "HTTP 422 invalid media" } }, permanentFailurePlatforms: ["youtube"] },
    ["youtube"],
    "2026-11-13T10:00:00.000Z",
  ),
  null,
  "YouTube recovery must not clear confirmed permanent media failures",
);
assert.equal(
  buildYouTubeQueueRecoveryPatch(
    { platformResults: { youtube: { ok: false, requiresReconciliation: true, error: "OAuth upload timed out; remote outcome unknown" } } },
    ["youtube"],
    "2026-11-13T10:00:00.000Z",
  ),
  null,
  "YouTube recovery must never bypass ambiguous remote outcomes",
);
assert.equal(
  buildYouTubeQueueRecoveryPatch(
    {
      authBlocked: true,
      authBlockedPlatforms: ["youtube"],
      manualReconciliationPlatforms: ["youtube"],
      platformResults: { youtube: { ok: false, error: youtubeAuthError } },
    },
    ["youtube"],
    "2026-11-13T10:00:00.000Z",
  ),
  null,
  "YouTube auth recovery must not bypass a persisted manual-reconciliation hold when the result ledger is incomplete",
);
assert.equal(
  buildYouTubeQueueRecoveryPatch(
    { authBlocked: true, platformResults: { youtube: { ok: false, error: youtubeAuthError } }, sourceMediaMissing: true },
    ["youtube"],
    "2026-11-13T10:00:00.000Z",
  ),
  null,
  "YouTube recovery must never release a missing-media row",
);
assert.equal(
  buildYouTubeQueueRecoveryFilter({
    id: "youtube-queue-row",
    status: "partial",
    updated_at: "2026-11-12T06:00:00.000Z",
    created_at: "2026-11-12T05:00:00.000Z",
  }, "2026-11-06T20:00:00.000Z"),
  "id=eq.youtube-queue-row&status=eq.partial&updated_at=eq.2026-11-12T06%3A00%3A00.000Z&created_at=eq.2026-11-12T05%3A00%3A00.000Z",
  "YouTube queue recovery must use exact row-version and creation-time compare-and-swap guards",
);
assert.equal(
  buildYouTubeQueueRecoveryFilter({
    id: "old-youtube-queue-row",
    status: "failed",
    updated_at: "2026-11-05T06:00:00.000Z",
    created_at: "2026-11-05T05:00:00.000Z",
  }, "2026-11-06T20:00:00.000Z"),
  null,
  "historical YouTube auth failures before the publish cutoff must remain held",
);

const youtubeRecoveryServiceSource = readFileSync(
  resolve(process.cwd(), "src/features/social/services/youtube-queue-recovery.ts"),
  "utf8",
);
assert.match(youtubeRecoveryServiceSource, /status=in\.\(failed,partial\)/, "YouTube recovery must scan only failed or partial queue rows");
assert.match(youtubeRecoveryServiceSource, /created_at=gte\./, "YouTube recovery must respect the current publish cutoff");
assert.match(youtubeRecoveryServiceSource, /const pageSize = 250/, "YouTube recovery must page its bounded queue inventory");
assert.match(youtubeRecoveryServiceSource, /const maxRows = 5_000/, "YouTube recovery must stop before mutating an oversized queue inventory");
assert.match(youtubeRecoveryServiceSource, /const cursorFilter: string =/, "YouTube recovery must use a typed stable cursor filter");
assert.match(youtubeRecoveryServiceSource, /const rows: YouTubeAuthBlockedQueueRow\[\] = await/, "YouTube recovery must type its queue page rows explicitly");
assert.match(youtubeRecoveryServiceSource, /buildYouTubeQueueRecoveryFilter\(item, publishAfter\)/, "each recovery update must use the exact candidate row version and cutoff");
assert.match(revalidatedPublisherSource, /mergeAuthBlockedPlatforms\(/, "the publisher must preserve auth blocks for targets that were not attempted");
assert.match(revalidatedPublisherSource, /const hasAuthFailure = operationalFailures\.some\(failure =>[\s\S]*?isAuthBlocked\(failure\.platform, failure\.error\)/, "the publisher must classify authentication failures for every provider");
assert.match(revalidatedPublisherSource, /const hasNonAuthFailure = operationalFailures\.some\(failure => !isAuthBlocked\(failure\.platform, failure\.error\)\)/, "provider auth blocks must not be misclassified as retryable operational failures");
assert.match(revalidatedPublisherSource, /!isAuthBlocked\(failure\.platform, failure\.error\) &&/, "auth-blocked providers must not enter transient retry scheduling");
assert.doesNotMatch(revalidatedPublisherSource, /isFacebookAuthFailure/, "the publisher must not retain a stale Facebook-only classifier");
assert.match(adminSocialRouteSource, /unblockYouTubeAuthBlockedQueue\(\)/, "the admin route must call the dedicated YouTube recovery service");
assert.match(adminSocialRouteSource, /getYouTubeUploadRefreshToken\(\)/, "the admin route must verify an upload-scoped credential before release");
assert.match(adminSocialRouteSource, /body\.platform/, "the release action must distinguish Facebook and YouTube");
assert.match(socialClientAuditSource, /youtubeAuthBlocked/, "the admin UI must surface YouTube auth-blocked rows");
assert.match(socialClientAuditSource, /releaseAuthBlockedQueue\("youtube"\)/, "the admin UI must expose an explicit YouTube recovery action");

assert.match(revalidatedPublisherSource, /isAuthBlocked\(failure\.platform, failure\.error\)/, "the worker must classify YouTube OAuth failures as per-platform auth blocks");
