import assert from "node:assert/strict";
import { shouldRetryPublishedVideoCleanup } from "../../src/features/social/services/published-video-cleanup";

assert.equal(shouldRetryPublishedVideoCleanup(null), true, "missing metadata must be reconciled");
assert.equal(shouldRetryPublishedVideoCleanup({}), true, "unmarked legacy rows must be reconciled");
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: false }), true);
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true }), false, "already deferred rows must not be rewritten on every poll");
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true, videoCleanupPending: false }), false);
assert.equal(shouldRetryPublishedVideoCleanup({ stagingCleanupDeferred: true, videoCleanupPending: true }), true, "explicitly pending cleanup must be retried");

console.log("Published video cleanup idempotency checks passed.");
