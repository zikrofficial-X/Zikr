import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildYouTubeQueueRecoveryFilter,
  buildYouTubeQueueRecoveryPatch,
} from "../../src/features/social/services/youtube-queue-recovery-policy";

const publishAfter = "2026-11-01T00:00:00.000Z";
const candidate = {
  id: "queue id/1",
  status: "failed",
  updated_at: "2026-11-13T10:00:00.000Z",
  created_at: "2026-11-12T10:00:00.000Z",
};

assert.equal(
  buildYouTubeQueueRecoveryFilter(candidate, publishAfter),
  "id=eq.queue%20id%2F1&status=eq.failed&updated_at=eq.2026-11-13T10%3A00%3A00.000Z&created_at=eq.2026-11-12T10%3A00%3A00.000Z",
  "recovery must compare the exact queue row revision and preserve the configured cutoff",
);
for (const invalid of [
  { ...candidate, id: " " },
  { ...candidate, status: "queued" },
  { ...candidate, updated_at: null },
  { ...candidate, updated_at: "not-a-date" },
  { ...candidate, created_at: null },
  { ...candidate, created_at: "not-a-date" },
  { ...candidate, created_at: "2026-10-31T23:59:59.999Z" },
]) {
  assert.equal(buildYouTubeQueueRecoveryFilter(invalid, publishAfter), null);
}
assert.throws(
  () => buildYouTubeQueueRecoveryFilter(candidate, "not-a-cutoff"),
  /Invalid SOCIAL_PUBLISH_AFTER cutoff/,
  "an invalid cutoff must fail closed rather than widening recovery",
);

const now = "2026-11-13T11:00:00.000Z";
const updatedAt = "2026-11-13T11:00:00.001Z";
const metadata = {
  authBlocked: true,
  authBlockedPlatforms: ["youtube", "facebook"],
  platformResults: {
    youtube: { ok: false, error: "invalid_grant" },
    facebook: { ok: true, remoteId: "facebook-post-1" },
  },
  platformAttempts: { youtube: 4, facebook: 2 },
  permanentFailure: true,
  permanentFailurePlatforms: ["youtube", "facebook"],
  nextRetryAt: "2026-11-13T09:00:00.000Z",
};
const patch = buildYouTubeQueueRecoveryPatch(metadata, ["youtube", "facebook"], now, updatedAt);
assert.ok(patch, "an explicitly auth-blocked YouTube target may be released after owner verification");
assert.equal(patch.status, "queued");
assert.equal(patch.scheduled_at, now);
assert.equal(patch.published_at, null);
assert.equal(patch.error_message, null);
assert.equal(patch.updated_at, updatedAt);
assert.deepEqual(patch.metadata.authBlockedPlatforms, ["facebook"]);
assert.equal(patch.metadata.authBlocked, true, "a separate Facebook auth block must remain intact");
assert.deepEqual(patch.metadata.permanentFailurePlatforms, ["facebook"]);
assert.equal(patch.metadata.permanentFailure, true, "a separate Facebook permanent failure must remain intact");
assert.deepEqual(patch.metadata.platformResults, {
  facebook: { ok: true, remoteId: "facebook-post-1" },
});
assert.deepEqual(patch.metadata.platformAttempts, { youtube: 0, facebook: 2 });
assert.equal(patch.metadata.nextRetryAt, null);
assert.equal(patch.metadata.reauthorizedAt, now);

const legacyFacebookBlock = buildYouTubeQueueRecoveryPatch(
  {
    authBlocked: true,
    platformResults: { youtube: { ok: false, error: "invalid_grant" } },
  },
  ["youtube", "facebook"],
  now,
  updatedAt,
);
assert.ok(legacyFacebookBlock);
assert.equal(legacyFacebookBlock.metadata.authBlocked, true);
assert.deepEqual(legacyFacebookBlock.metadata.authBlockedPlatforms, []);

for (const blockedMetadata of [
  { sourceMediaMissing: true, authBlockedPlatforms: ["youtube"], platformResults: { youtube: { ok: false, error: "invalid_grant" } } },
  { kidsSourceApprovalBlocked: true, authBlockedPlatforms: ["youtube"], platformResults: { youtube: { ok: false, error: "invalid_grant" } } },
  { writtenArticlePublicationBlocked: true, authBlockedPlatforms: ["youtube"], platformResults: { youtube: { ok: false, error: "invalid_grant" } } },
  { manualReconciliationPlatforms: ["youtube"], authBlockedPlatforms: ["youtube"], platformResults: { youtube: { ok: false, error: "invalid_grant" } } },
  { authBlockedPlatforms: ["youtube"], platformResults: { youtube: { ok: true, remoteId: "youtube-video-1" } } },
  { authBlockedPlatforms: ["youtube"], platformResults: { youtube: { ok: false, error: "fetch failed" } } },
  { authBlockedPlatforms: ["facebook"], platformResults: { youtube: { ok: false, error: "network timeout" } } },
]) {
  assert.equal(
    buildYouTubeQueueRecoveryPatch(blockedMetadata, ["youtube", "facebook"], now, updatedAt),
    null,
    "recovery must not release missing-media, editorial, ambiguous, successful, or unrelated-platform outcomes",
  );
}
assert.equal(
  buildYouTubeQueueRecoveryPatch(metadata, ["facebook"], now, updatedAt),
  null,
  "a Facebook-only row must never be requeued by the YouTube recovery path",
);
assert.equal(
  buildYouTubeQueueRecoveryPatch(metadata, ["youtube"], "invalid-date", updatedAt),
  null,
  "invalid scheduling timestamps must fail closed",
);
assert.equal(
  buildYouTubeQueueRecoveryPatch(metadata, ["youtube"], now, "invalid-date"),
  null,
  "invalid CAS row-version timestamps must fail closed",
);

const recoveryService = readFileSync("src/features/social/services/youtube-queue-recovery.ts", "utf8");
const inventoryLoop = recoveryService.indexOf("while (true)");
const mutationLoop = recoveryService.indexOf("for (const item of inventory)");
assert.ok(inventoryLoop >= 0 && mutationLoop > inventoryLoop, "the complete bounded inventory must be read before any queue row is changed");
assert.match(recoveryService, /if \(scanned > maxRows\) \{[\s\S]*?no rows were changed/);
assert.match(recoveryService, /buildNextRowVersionUpdatedAt\(item\.updated_at \?\? ""/);
assert.match(recoveryService, /buildYouTubeQueueRecoveryFilter\(item, publishAfter\)/);
assert.match(recoveryService, /if \(!filter\) continue/);

const adminRoute = readFileSync("src/app/api/admin/social/route.ts", "utf8");
assert.match(
  adminRoute,
  /\["retry", "retry_all_failed", "run_worker", "publish_now", "delete_published", "adopt_server_facebook_token", "release_auth_blocked_queue"\][\s\S]*?requireAdminStepUpApi\("social\.publish"/,
  "YouTube queue recovery must remain behind the social.publish MFA step-up gate",
);
const releaseStart = adminRoute.indexOf('if (action === "release_auth_blocked_queue")');
const releaseEnd = adminRoute.indexOf("\n    if (action ===", releaseStart + 10);
const releaseBranch = adminRoute.slice(releaseStart, releaseEnd > releaseStart ? releaseEnd : undefined);
assert.match(releaseBranch, /if \(body\.confirmed !== true\)/);
assert.match(releaseBranch, /getEnabledSocialPlatforms\(env\)\.includes\("youtube"\)/);
assert.match(releaseBranch, /getYouTubeUploadRefreshToken\(\)/);
assert.match(releaseBranch, /health\.status !== "connected"/);
assert.ok(
  releaseBranch.indexOf("if (body.confirmed !== true)") < releaseBranch.indexOf("unblockYouTubeAuthBlockedQueue()"),
  "explicit confirmation must be checked before the recovery service can write",
);

console.log("YouTube auth-blocked queue recovery policy and admin safety contracts passed.");
