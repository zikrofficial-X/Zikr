import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProcessingVideoRequestLeaseFilter,
  buildStaleVideoRequestRecoveryFilter,
  buildVideoRequestClaimFilter,
} from "../../src/features/videos/services/video-queue-claim";

const now = "2026-11-11T22:59:00.000Z";
const updatedAt = "2026-11-11T22:40:00.000Z";

test("pending video claim is fenced by the exact selected row version", () => {
  assert.equal(
    buildVideoRequestClaimFilter({
      id: "request/1",
      status: "pending",
      updated_at: updatedAt,
      next_retry_at: "2026-11-12T01:00:00.000Z",
    }, now),
    "id=eq.request%2F1&status=eq.pending&updated_at=eq.2026-11-11T22%3A40%3A00.000Z",
  );
});

test("retry_wait claim rechecks that next_retry_at is due in the atomic update", () => {
  assert.equal(
    buildVideoRequestClaimFilter({
      id: "retry-1",
      status: "retry_wait",
      updated_at: updatedAt,
      next_retry_at: "2026-11-11T22:58:00.000Z",
    }, now),
    "id=eq.retry-1&status=eq.retry_wait&updated_at=eq.2026-11-11T22%3A40%3A00.000Z&next_retry_at=lte.2026-11-11T22%3A59%3A00.000Z",
  );
});

test("future or missing retry time cannot be claimed", () => {
  assert.equal(
    buildVideoRequestClaimFilter({
      id: "retry-future",
      status: "retry_wait",
      updated_at: updatedAt,
      next_retry_at: "2026-11-11T23:00:00.000Z",
    }, now),
    null,
  );
  assert.equal(
    buildVideoRequestClaimFilter({
      id: "retry-missing",
      status: "retry_wait",
      updated_at: updatedAt,
      next_retry_at: null,
    }, now),
    null,
  );
});

test("claim refuses missing or invalid row versions and unexpected statuses", () => {
  assert.equal(buildVideoRequestClaimFilter({ id: "missing", status: "pending" }, now), null);
  assert.equal(buildVideoRequestClaimFilter({ id: "invalid", status: "pending", updated_at: "not-a-date" }, now), null);
  assert.equal(buildVideoRequestClaimFilter({ id: "processing", status: "processing", updated_at: updatedAt }, now), null);
});

test("stale recovery is fenced by the exact timestamp that was selected as stale", () => {
  const staleBefore = "2026-11-11T22:30:00.000Z";
  assert.equal(
    buildStaleVideoRequestRecoveryFilter("stale/1", "2026-11-11T22:29:00.000Z", staleBefore),
    "id=eq.stale%2F1&status=eq.processing&video_url=is.null&updated_at=eq.2026-11-11T22%3A29%3A00.000Z",
  );
  assert.equal(
    buildStaleVideoRequestRecoveryFilter("fresh", "2026-11-11T22:31:00.000Z", staleBefore),
    null,
  );
  assert.equal(buildStaleVideoRequestRecoveryFilter("missing", null, staleBefore), null);
});

test("pause-lock release is fenced by the exact processing lease", () => {
  assert.equal(
    buildProcessingVideoRequestLeaseFilter("request-2", updatedAt),
    "id=eq.request-2&status=eq.processing&video_url=is.null&updated_at=eq.2026-11-11T22%3A40%3A00.000Z",
  );
  assert.equal(buildProcessingVideoRequestLeaseFilter("request-2", null), null);
});

test("a stale worker lease cannot update after recovery and a newer claim", () => {
  const oldLease = buildProcessingVideoRequestLeaseFilter("request-3", updatedAt);
  const recoveredAt = "2026-11-11T23:10:00.000Z";
  const newClaim = buildVideoRequestClaimFilter({
    id: "request-3",
    status: "retry_wait",
    updated_at: recoveredAt,
    next_retry_at: "2026-11-11T23:11:00.000Z",
  }, "2026-11-11T23:12:00.000Z");
  const newLease = buildProcessingVideoRequestLeaseFilter("request-3", "2026-11-11T23:12:00.000Z");

  assert.match(oldLease ?? "", /status=eq\.processing/);
  assert.match(oldLease ?? "", /updated_at=eq\.2026-11-11T22%3A40%3A00\.000Z/);
  assert.match(newClaim ?? "", /status=eq\.retry_wait/);
  assert.match(newLease ?? "", /updated_at=eq\.2026-11-11T23%3A12%3A00\.000Z/);
  assert.notEqual(oldLease, newLease);
});
