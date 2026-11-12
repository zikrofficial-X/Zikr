import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDuplicateVideoOwnerRecoveryFilter, buildDuplicateVideoOwnerVideoUrlFilter, canRecoverDuplicateVideoRender } from "../../src/features/videos/services/duplicate-video-recovery";
import type { DuplicateVideoHashOwner } from "../../src/features/videos/services/duplicate-video-recovery";
import { calculateDailyVideoQuotaState } from "../../src/features/videos/services/video-automation-quota";
import { buildMissingMediaQueueRecoveryPatch } from "../../src/features/social/services/platform-availability";

const owner: DuplicateVideoHashOwner = {
  status: "completed",
  video_url: null,
  content_hash: "content-hash-1",
  source_hash: "source-hash-1",
  template_version: "renderer-v4",
  category: "hadith",
};
const candidate = {
  category: "hadith",
  contentHash: "content-hash-1",
  sourceHash: "source-hash-1",
  templateVersion: "renderer-v4",
};

assert.equal(
  buildDuplicateVideoOwnerVideoUrlFilter(null),
  "or=(video_url.is.null,video_url.eq.)",
  "requests without a current media pointer may be claimed only while the pointer remains empty",
);
const staleCloudinaryUrl = "https://res.cloudinary.com/example/video/upload/v123/auto-stale.mp4";
assert.equal(
  buildDuplicateVideoOwnerVideoUrlFilter(staleCloudinaryUrl),
  "or=(video_url.is.null,video_url.eq.,video_url.eq." + encodeURIComponent(staleCloudinaryUrl) + ")",
  "recovery must compare-and-set the exact stale generated Cloudinary pointer",
);
assert.equal(
  buildDuplicateVideoOwnerVideoUrlFilter("https://not-cloudinary.test/video.mp4"),
  "or=(video_url.is.null,video_url.eq.)",
  "unexpected non-Cloudinary URLs must never be included in recovery updates",
);

const duplicateOwnerRevision = "2026-11-11T22:40:00.000Z";
assert.equal(
  buildDuplicateVideoOwnerRecoveryFilter(staleCloudinaryUrl, duplicateOwnerRevision),
  "status=eq.completed&updated_at=eq.2026-11-11T22%3A40%3A00.000Z&or=(video_url.is.null,video_url.eq.,video_url.eq." +
    encodeURIComponent(staleCloudinaryUrl) + ")",
  "canonical recovery must compare-and-set both the exact row revision and the previously stored generated media URL",
);
assert.equal(
  buildDuplicateVideoOwnerRecoveryFilter(null, null),
  null,
  "canonical recovery must fail closed when the selected row revision is missing",
);
assert.equal(
  buildDuplicateVideoOwnerRecoveryFilter(null, "not-a-date"),
  null,
  "canonical recovery must fail closed when the selected row revision is invalid",
);

assert.equal(
  canRecoverDuplicateVideoRender({ owner, candidate, qaApproved: true, siteRecord: null }),
  true,
  "a completed canonical request with no catalog row can reuse a verified render",
);
assert.equal(
  canRecoverDuplicateVideoRender({
    owner,
    candidate,
    qaApproved: true,
    siteRecord: {
      published: false,
      metadata: { mediaState: "purged", mediaPurgedFromPublished: true, generatedVideoUrl: null, videoUrl: null },
    },
  }),
  true,
  "an explicitly purged unpublished catalog row can be restored",
);

assert.equal(
  canRecoverDuplicateVideoRender({
    owner: { ...owner, video_url: "https://res.cloudinary.com/example/video/upload/auto-stale.mp4" },
    candidate,
    qaApproved: true,
    siteRecord: {
      published: false,
      metadata: { mediaState: "purged", mediaPurgedFromPublished: true, generatedVideoUrl: null, videoUrl: null },
    },
  }),
  true,
  "a stale generation URL may be replaced only when the matching catalog row is explicitly purged and unpublished",
);

const reject = (overrides: {
  owner?: Partial<DuplicateVideoHashOwner>;
  candidate?: Partial<typeof candidate>;
  qaApproved?: boolean;
  siteRecord?: { published: boolean | null; metadata: Record<string, unknown> | null } | null;
}, message: string) => {
  assert.equal(
    canRecoverDuplicateVideoRender({
      owner: { ...owner, ...overrides.owner },
      candidate: { ...candidate, ...overrides.candidate },
      qaApproved: overrides.qaApproved ?? true,
      siteRecord: overrides.siteRecord === undefined ? null : overrides.siteRecord,
    }),
    false,
    message,
  );
};

reject({ qaApproved: false }, "failed automated QA must never restore or publish a duplicate render");
reject({ owner: { status: "processing" } }, "an active duplicate owner must not be overwritten");
reject({ owner: { video_url: "https://res.cloudinary.com/example/video/upload/auto-existing.mp4" } }, "an owner with existing media must not be overwritten");
reject({ candidate: { contentHash: "different" } }, "a different final content hash must fail closed");
reject({ candidate: { sourceHash: "different" } }, "a different source hash must fail closed");
reject({ candidate: { templateVersion: "renderer-v5" } }, "a different renderer version must fail closed");
reject({ candidate: { category: "quran" } }, "a different content category must fail closed");
reject({
  siteRecord: { published: true, metadata: { mediaState: "purged" } },
}, "a published catalog record must never be replaced");
reject({
  siteRecord: { published: null, metadata: { mediaState: "purged" } },
}, "an unknown publication state must fail closed");
reject({
  siteRecord: { published: false, metadata: { mediaState: "unpublished" } },
}, "an intentionally unpublished record must not be republished");
reject({
  siteRecord: {
    published: false,
    metadata: { mediaState: "purged", mediaPurgedFromPublished: false, generatedVideoUrl: null, videoUrl: null },
  },
}, "a purged row that was intentionally unpublished before purge must not be republished");
reject({
  siteRecord: {
    published: false,
    metadata: { mediaState: "purged", generatedVideoUrl: null, videoUrl: null },
  },
}, "a purged row without prior-publication evidence must fail closed");
reject({
  owner: { video_url: "https://not-cloudinary.test/video.mp4" },
  siteRecord: {
    published: false,
    metadata: { mediaState: "purged", mediaPurgedFromPublished: true, generatedVideoUrl: null, videoUrl: null },
  },
}, "a non-Cloudinary URL must never be overwritten by generated-media recovery");
reject({
  siteRecord: { published: false, metadata: { mediaState: "purged", videoUrl: "https://not-cloudinary.test/video.mp4" } },
}, "a catalog record retaining a media URL must not be treated as purged");

const quotaState = calculateDailyVideoQuotaState([
  { status: "completed", automation_key: "quran:20607:0" },
  { status: "pending", automation_key: "hadith:20607:1" },
  { status: "cancelled", automation_key: "story:20607:2" },
  { status: "failed", automation_key: "dua:20607:3" },
  { status: "retry_wait", automation_key: "adhkar:20607:4" },
  { status: "processing", automation_key: "kids:20607:5" },
]);
assert.deepEqual(
  quotaState,
  { reservedCount: 4, nextSlot: 6 },
  "only active/retryable/completed requests satisfy the daily target while cancelled/failed slot keys remain unavailable",
);
assert.deepEqual(
  calculateDailyVideoQuotaState([
    { status: "cancelled", automation_key: "quran:20607:0" },
    { status: "failed", automation_key: "hadith:20607:1" },
  ]),
  { reservedCount: 0, nextSlot: 2 },
  "terminal duplicate/failure rows must be replaced using a fresh slot rather than consuming the daily quota",
);

const worker = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");
const videoAutomationService = readFileSync("src/features/videos/services/video-automation.ts", "utf8");
const videoRetryRoute = readFileSync("src/app/api/admin/videos/[id]/retry/route.ts", "utf8");
assert.match(videoRetryRoute, /currentRows\[0\]\.status !== 'failed'/, "only failed video requests may be retried");
assert.match(videoRetryRoute, /updateVideoRequestStatus\(id, 'pending', undefined, 'failed'\)/, "retry must use a failed-state compare-and-set");
assert.match(videoAutomationService, /status=eq\.\$\{encodeURIComponent\(expectedStatus\)\}/);
assert.match(videoAutomationService, /updated_at=eq\.\$\{encodeURIComponent\(expectedUpdatedAt\)\}/, "retry compare-and-set must include the exact updated_at revision");
assert.match(videoAutomationService, /return Array\.isArray\(updated\) && updated\.length > 0/);


const recoveredFailed = buildMissingMediaQueueRecoveryPatch({
  item: {
    status: "failed",
    target_platforms: ["facebook_reels"],
    metadata: {
      sourceMediaMissing: true,
      permanentFailure: true,
      permanentFailurePlatforms: ["facebook_reels"],
      platformResults: {
        facebook_reels: {
          ok: false,
          error: "Facebook Reel upload failed (HTTP 422): Meta upload response did not confirm success",
        },
      },
      platformAttempts: { facebook_reels: 5 },
    },
  },
  videoUrl: "https://res.cloudinary.com/example/video/upload/v1/auto-recovered.mp4",
  now: "2026-11-10T14:00:00.000Z",
});
assert.ok(recoveredFailed, "a verified replacement asset may release a source-media-only 422 hold");
assert.equal(recoveredFailed.status, "queued");
assert.equal(recoveredFailed.video_url, "https://res.cloudinary.com/example/video/upload/v1/auto-recovered.mp4");
assert.equal(recoveredFailed.metadata.sourceMediaMissing, false);
assert.equal(recoveredFailed.metadata.permanentFailure, false);
assert.deepEqual(recoveredFailed.metadata.permanentFailurePlatforms, []);
assert.equal((recoveredFailed.metadata.platformResults as Record<string, unknown>).facebook_reels, undefined);
assert.equal((recoveredFailed.metadata.platformAttempts as Record<string, unknown>).facebook_reels, 0);

const recoveredPartial = buildMissingMediaQueueRecoveryPatch({
  item: {
    status: "partial",
    target_platforms: ["youtube", "facebook_reels"],
    metadata: {
      sourceMediaMissing: true,
      permanentFailure: true,
      permanentFailurePlatforms: ["facebook_reels"],
      platformResults: {
        youtube: { ok: true, remoteId: "already-published-youtube-id" },
        facebook_reels: { ok: false, error: "Facebook Reels cooldown is over" },
      },
      platformAttempts: { youtube: 1, facebook_reels: 4 },
    },
  },
  videoUrl: "https://res.cloudinary.com/example/video/upload/v1/auto-recovered.mp4",
  now: "2026-11-10T14:00:00.000Z",
});
assert.ok(recoveredPartial, "a cooldown-held partial item may be released after verified media recovery");
const partialResults = recoveredPartial.metadata.platformResults as Record<string, { remoteId?: string }>;
assert.equal(partialResults.youtube?.remoteId, "already-published-youtube-id", "existing YouTube delivery IDs must be preserved");
assert.equal(partialResults.facebook_reels, undefined, "only the failed Facebook Reels result may be retried");

const heldBase = {
  status: "failed",
  target_platforms: ["facebook_reels"],
  metadata: {
    sourceMediaMissing: true,
    permanentFailure: true,
    permanentFailurePlatforms: ["facebook_reels"],
    platformResults: { facebook_reels: { ok: false, error: "HTTP 422 source media unavailable" } },
  },
};
assert.equal(buildMissingMediaQueueRecoveryPatch({
  item: { ...heldBase, metadata: { ...heldBase.metadata, authBlocked: true } },
  videoUrl: "https://res.cloudinary.com/example/video/upload/v1/auto-recovered.mp4",
  now: "2026-11-10T14:00:00.000Z",
}), null, "auth-blocked queue rows must remain held");
assert.equal(buildMissingMediaQueueRecoveryPatch({
  item: { ...heldBase, metadata: { ...heldBase.metadata, platformResults: { facebook_reels: { ok: false, error: "HTTP 500 timeout", requiresReconciliation: true } } } },
  videoUrl: "https://res.cloudinary.com/example/video/upload/v1/auto-recovered.mp4",
  now: "2026-11-10T14:00:00.000Z",
}), null, "ambiguous provider outcomes must remain held for manual reconciliation");
assert.equal(buildMissingMediaQueueRecoveryPatch({
  item: { ...heldBase, metadata: { ...heldBase.metadata, platformResults: { facebook_reels: { ok: false, error: "caption rejected" } } } },
  videoUrl: "https://res.cloudinary.com/example/video/upload/v1/auto-recovered.mp4",
  now: "2026-11-10T14:00:00.000Z",
}), null, "unrelated permanent provider failures must not be cleared by media recovery");
assert.equal(buildMissingMediaQueueRecoveryPatch({
  item: { ...heldBase, metadata: { ...heldBase.metadata, sourceMediaMissing: false } },
  videoUrl: "https://res.cloudinary.com/example/video/upload/v1/auto-recovered.mp4",
  now: "2026-11-10T14:00:00.000Z",
}), null, "ordinary queue rows must not be changed by missing-media recovery");

const duplicateSkipMarker = 'error_message: "Duplicate generated content; publication skipped"';
const duplicateSkipIndex = worker.indexOf(duplicateSkipMarker);
assert.notEqual(duplicateSkipIndex, -1, "duplicate generated renders must retain a distinct cancellation reason");
const duplicateSkipBlock = worker.slice(duplicateSkipIndex, worker.indexOf("continue;", duplicateSkipIndex));
assert.match(duplicateSkipBlock, /skipped\s*\+=\s*1/);
assert.doesNotMatch(duplicateSkipBlock, /failed\s*\+=\s*1/);
assert.match(worker, /return \{ processed, succeeded, failed, skipped \}/);
const runner = readFileSync("scripts/run-background-jobs.ts", "utf8");
assert.match(runner, /waveSkipped/);
assert.match(runner, /skipped \+= waveSkipped/);
assert.match(runner, /skipped: summary\.skipped/);

assert.match(worker, /automation_key=like\.\*:\$\{day\}:\*&select=id,status,automation_key&limit=1000/);

const dailyQuotaQueryPosition = worker.indexOf("automation_key=like.*:${day}:*&select=id,status,automation_key&limit=1000");
const dailyQuotaCapPosition = worker.indexOf("if ((todaysRows ?? []).length >= 1000)");
const dailyQuotaUsePosition = worker.indexOf("const dailyQuota = calculateDailyVideoQuotaState");
assert.ok(
  dailyQuotaQueryPosition >= 0 &&
    dailyQuotaQueryPosition < dailyQuotaCapPosition &&
    dailyQuotaCapPosition < dailyQuotaUsePosition,
  "daily quota seeding must fail closed before counting or allocating slots from a truncated 1,000-row history",
);

assert.match(worker, /calculateDailyVideoQuotaState\(todaysRows \?\? \[\]\)/);
assert.match(worker, /const slot = dailyQuota\.nextSlot \+ i/);
assert.ok(worker.includes("canRecoverDuplicateVideoRender"), "the video worker must use the recovery decision contract");
const duplicateRecoveryFilterCall = worker.indexOf("buildDuplicateVideoOwnerRecoveryFilter(");
const duplicateUrlArgument = worker.indexOf("duplicate.video_url", duplicateRecoveryFilterCall);
const duplicateRevisionArgument = worker.indexOf("duplicate.updated_at", duplicateUrlArgument);
assert.ok(
  duplicateRecoveryFilterCall >= 0 &&
    duplicateUrlArgument > duplicateRecoveryFilterCall &&
    duplicateRevisionArgument > duplicateUrlArgument,
  "canonical recovery must compare-and-set the selected row revision and exact previously stored Cloudinary URL",
);
assert.ok(worker.includes("updated_at, duration,source_hash") || worker.includes("updated_at,duration,source_hash"), "the duplicate owner query must fetch the row revision used by the compare-and-set filter");
assert.ok(worker.includes("&${duplicateRecoveryFilter}"), "canonical recovery must apply the completed-state, row-revision, and media-pointer guards together");
assert.ok(worker.includes("recoverPurgedRecord: true"), "purged canonical records must use the controlled recovery queue path");
assert.ok(worker.includes("restoreMissingMediaSocialQueueItems"), "restored canonical media must release only eligible held social queue rows");
const duplicateCancelIndex = worker.indexOf('await patchProcessingRequestWithLease({\n              status: "cancelled",\n              video_url: null');
const socialQueueReleaseIndex = worker.indexOf("socialQueueRecovery = await withLeaseHeartbeat(");
assert.ok(
  duplicateCancelIndex >= 0 && socialQueueReleaseIndex > duplicateCancelIndex,
  "the duplicate request must be cancelled before previously held social queue rows are released",
);
assert.ok(
  worker.includes('existingQueue.status === "published"'),
  "a previously published internal queue row must be re-queued only for explicit purged-record recovery",
);

console.log("Duplicate video render recovery contract tests passed.");
