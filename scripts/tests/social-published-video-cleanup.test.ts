import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";
import { buildNextRowVersionUpdatedAt } from "../../src/lib/supabase/row-version";
import {
  getPublishedVideoStagingCleanupEligibleAt,
  PUBLISHED_VIDEO_CLEANUP_POSTGREST_FILTER,
  shouldRetryPublishedVideoCleanup,
} from "../../src/features/social/services/published-video-cleanup";
import {
  buildNextSocialQueueMetadataUpdatedAt,
  buildSocialQueueMetadataCasFilter,
  mergeSocialQueueMetadata,
  patchSocialQueueMetadataWithCas,
} from "../../src/features/social/services/social-queue-metadata";

assert.equal(shouldRetryPublishedVideoCleanup(null), true, "missing metadata must be reconciled");
assert.equal(shouldRetryPublishedVideoCleanup({}), true, "unmarked legacy rows must be reconciled");
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: false }), true);
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true }), false, "already deferred rows must not be rewritten on every poll");
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true, videoCleanupPending: false }), false);
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true, videoCleanupPending: true }), true, "explicitly pending cleanup must be retried");


assert.equal(
  buildSocialQueueMetadataCasFilter(
    "queue id/1",
    "published",
    "2026-11-12T18:00:00.000Z",
    "https://cdn.example.test/video path.mp4",
  ),
  "id=eq.queue%20id%2F1&status=eq.published&video_url=eq.https%3A%2F%2Fcdn.example.test%2Fvideo%20path.mp4&updated_at=eq.2026-11-12T18%3A00%3A00.000Z",
  "metadata updates must compare the published row, exact media URL and exact updated_at revision",
);
assert.throws(
  () => buildSocialQueueMetadataCasFilter(" ", "published", "2026-11-12T18:00:00.000Z"),
  /queue item ID/,
);
assert.throws(
  () => buildSocialQueueMetadataCasFilter("queue-1", "published", "not-a-date"),
  /valid updated_at timestamp/,
);
const sameMillisecond = new Date("2026-11-12T18:00:00.000Z");
assert.equal(
  buildNextSocialQueueMetadataUpdatedAt("2026-11-12T18:00:00.000Z", sameMillisecond),
  "2026-11-12T18:00:00.001Z",
  "metadata CAS revisions must advance even when two writes share the same millisecond",
);
assert.equal(
  buildNextSocialQueueMetadataUpdatedAt("2026-11-12T18:00:00.001Z", sameMillisecond),
  "2026-11-12T18:00:00.002Z",
  "a stale clock must still produce a revision newer than the observed row",
);
assert.equal(
  buildNextSocialQueueMetadataUpdatedAt("2026-11-12T17:59:59.999Z", sameMillisecond),
  "2026-11-12T18:00:00.000Z",
  "a later wall clock may advance the revision normally",
);
assert.equal(
  buildNextSocialQueueMetadataUpdatedAt(null, sameMillisecond),
  "2026-11-12T18:00:00.000Z",
  "new rows without a previous revision use the current timestamp",
);
assert.throws(
  () => buildNextSocialQueueMetadataUpdatedAt("not-a-date", sameMillisecond),
  /valid previous updated_at timestamp/,
);

assert.equal(
  buildNextRowVersionUpdatedAt("2026-11-12T18:00:00.000Z", sameMillisecond),
  "2026-11-12T18:00:00.001Z",
  "every CAS writer must advance its row version when the clock is in the same millisecond",
);
assert.equal(
  buildNextRowVersionUpdatedAt("2026-11-12T18:00:00.001Z", sameMillisecond),
  "2026-11-12T18:00:00.002Z",
  "a stale wall clock must still produce a strictly newer row version",
);
const socialPublishingSource = readFileSync("src/features/social/services/social-publishing.ts", "utf8");
assert.equal(
  (socialPublishingSource.match(/buildNextRowVersionUpdatedAt\\(row\\.updated_at\\)/g) ?? []).length,
  2,
  "both video catalog metadata writers must advance the row version before their CAS update",
);
assert.match(
  socialPublishingSource,
  /buildNextRowVersionUpdatedAt\\(request\\.updated_at\\)/,
  "published-video staging metadata must advance the generation request row version",
);
assert.match(
  socialPublishingSource,
  /updated_at: inFlightUpdatedAt/,
  "the social publisher in-flight marker must advance the processing row version",
);
assert.deepEqual(
  mergeSocialQueueMetadata(
    {
      platformDeletions: { youtube: { status: "deleted" } },
      platformInsights: { views: 12 },
    },
    {
      platformDeletions: { facebook: { status: "deleted" } },
      stagingCleanupDeferred: true,
    },
  ),
  {
    platformDeletions: {
      youtube: { status: "deleted" },
      facebook: { status: "deleted" },
    },
    platformInsights: { views: 12 },
    stagingCleanupDeferred: true,
  },
  "nested platform deletion state and unrelated insights must survive concurrent metadata patches",
);
assert.deepEqual(
  mergeSocialQueueMetadata(
    { platformDeletions: { facebook: { status: "deleted", remoteId: "fb-1" } } },
    { platformDeletions: { facebook: { status: "failed", error: "stale failure" } } },
  ),
  { platformDeletions: { facebook: { status: "deleted", remoteId: "fb-1" } } },
  "a stale failure must not replace a confirmed remote deletion",
);

const queueId = "queue/1";
const videoUrl = "https://cdn.example.test/auto-video.mp4";
const firstRevision = "2026-11-12T18:00:00.000Z";
const secondRevision = "2026-11-12T18:00:01.000Z";
const calls: Array<{ path: string; init?: RequestInit }> = [];
const responses: unknown[] = [
  [{
    id: queueId,
    status: "published",
    video_url: videoUrl,
    metadata: { platformDeletions: { youtube: { status: "deleted" } }, platformInsights: { views: 12 } },
    updated_at: firstRevision,
  }],
  [],
  [{
    id: queueId,
    status: "published",
    video_url: videoUrl,
    metadata: {
      platformDeletions: { youtube: { status: "deleted" } },
      platformInsights: { views: 18 },
    },
    updated_at: secondRevision,
  }],
  [{ id: queueId }],
];
const mockRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  calls.push({ path, init });
  if (responses.length === 0) throw new Error("Unexpected mock Supabase request.");
  return responses.shift() as T;
};
const persisted = await patchSocialQueueMetadataWithCas(
  {
    id: queueId,
    expectedStatus: "published",
    expectedVideoUrl: videoUrl,
    patch: { platformDeletions: { facebook: { status: "deleted", remoteId: "fb-remote-1" } } },
  },
  mockRequest as typeof supabaseServerAdminRequest,
);
assert.equal(persisted, true, "metadata updates must retry after a lost CAS race");
assert.equal(calls.length, 4, "one conflict must cause a fresh read and one bounded retry");
assert.ok(calls[1].path.includes("updated_at=eq." + encodeURIComponent(firstRevision)));
assert.ok(calls[3].path.includes("updated_at=eq." + encodeURIComponent(secondRevision)));
const finalPayload = JSON.parse(String(calls[3].init?.body));
assert.deepEqual(finalPayload.metadata.platformDeletions, {
  youtube: { status: "deleted" },
  facebook: { status: "deleted", remoteId: "fb-remote-1" },
});
assert.deepEqual(finalPayload.metadata.platformInsights, { views: 18 });
assert.equal(
  await patchSocialQueueMetadataWithCas(
    { id: queueId, expectedStatus: "published", expectedVideoUrl: videoUrl, patch: { stagingCleanupDeferred: true } },
    (async <T>() => [] as T) as typeof supabaseServerAdminRequest,
  ),
  false,
  "a queue row that is no longer published or no longer matches its media URL must not be overwritten",
);




const allTargetsPublishedAt = "2026-11-10T10:00:00.000Z";
assert.equal(
  getPublishedVideoStagingCleanupEligibleAt(allTargetsPublishedAt),
  "2026-11-12T10:00:00.000Z",
  "the 48-hour staging retention window must begin at confirmed all-target publication",
);
assert.throws(
  () => getPublishedVideoStagingCleanupEligibleAt("not-a-timestamp"),
  /valid all-target publication timestamp/,
  "invalid publication timestamps must not create an immediate cleanup deadline",
);


assert.equal(
  PUBLISHED_VIDEO_CLEANUP_POSTGREST_FILTER,
  "or=(metadata->>stagingCleanupDeferred.neq.true,metadata->>stagingCleanupDeferred.is.null,metadata->>videoCleanupPending.eq.true)",
  "cleanup polling must filter retryable rows before applying its page limit so already-deferred rows cannot starve later items",
);

console.log("Published video cleanup idempotency checks passed.");
console.log("Published social queue metadata compare-and-set checks passed.");
