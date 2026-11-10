import assert from "node:assert/strict";
import {
  getPublishedVideoStagingCleanupEligibleAt,
  PUBLISHED_VIDEO_CLEANUP_POSTGREST_FILTER,
  shouldRetryPublishedVideoCleanup,
} from "../../src/features/social/services/published-video-cleanup";

assert.equal(shouldRetryPublishedVideoCleanup(null), true, "missing metadata must be reconciled");
assert.equal(shouldRetryPublishedVideoCleanup({}), true, "unmarked legacy rows must be reconciled");
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: false }), true);
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true }), false, "already deferred rows must not be rewritten on every poll");
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true, videoCleanupPending: false }), false);
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true, videoCleanupPending: true }), true, "explicitly pending cleanup must be retried");

console.log("Published video cleanup idempotency checks passed.");


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
