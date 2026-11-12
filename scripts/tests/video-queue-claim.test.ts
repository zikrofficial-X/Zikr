import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  buildProcessingVideoRequestLeaseFilter,
  buildStaleVideoRequestRecoveryFilter,
  buildVideoRequestClaimFilter,
} from "../../src/features/videos/services/video-queue-claim";
import {
  getVideoRequestLeaseHeartbeatIntervalMs,
  withVideoRequestLeaseHeartbeat,
} from "../../src/features/videos/services/video-lease-heartbeat";

const videoWorkerSource = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");

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

test("Video Factory verifier accepts the lease-fenced hash claim before site registration", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-video-factory.mjs"], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join("\n") ||
      "Video Factory verifier must accept the current lease-based worker contract",
  );
});

test("lease heartbeat interval stays inside one third of the stale-recovery window", () => {
  assert.equal(getVideoRequestLeaseHeartbeatIntervalMs(5), 100_000);
  assert.equal(getVideoRequestLeaseHeartbeatIntervalMs(30), 600_000);
});

test("long-running render renews its exact processing lease while the provider is active", async () => {
  let renewals = 0;
  let finishOperation: ((value: string) => void) | undefined;
  const operation = new Promise<string>((resolve) => {
    finishOperation = resolve;
  });
  const task = withVideoRequestLeaseHeartbeat({
    intervalMs: 5,
    renew: async () => { renewals += 1; },
    isLeaseLost: (error) => error instanceof Error && error.message === "lease lost",
  }, () => operation);

  await new Promise((resolve) => setTimeout(resolve, 25));
  finishOperation?.("rendered");
  assert.equal(await task, "rendered");
  assert.ok(renewals >= 1, "the provider operation must renew its lease before it can become stale");
});

test("lease loss aborts an in-flight worker operation immediately", async () => {
  const leaseLost = new Error("lease lost");
  let observedSignal: AbortSignal | undefined;
  const task = withVideoRequestLeaseHeartbeat({
    intervalMs: 5,
    renew: async () => { throw leaseLost; },
    isLeaseLost: (error) => error === leaseLost,
  }, async (signal) => {
    observedSignal = signal;
    await new Promise<never>((_resolve, reject) => {
      const abort = () => reject(signal.reason);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  });
  const rejected = assert.rejects(task, leaseLost);
  await new Promise((resolve) => setTimeout(resolve, 25));
  await rejected;
  assert.ok(observedSignal?.aborted, "lease loss must abort the active operation immediately");
});

test("a lost processing lease prevents a completed render from advancing to publication", async () => {
  const leaseLost = new Error("lease lost");
  const task = withVideoRequestLeaseHeartbeat({
    intervalMs: 5,
    renew: async () => { throw leaseLost; },
    isLeaseLost: (error) => error === leaseLost,
  }, () => new Promise<string>((resolve) => setTimeout(() => resolve("rendered"), 25)));

  await assert.rejects(task, leaseLost);
});

test("the video worker wraps rendering in the lease heartbeat before claiming the content hash", () => {
  const renderPosition = videoWorkerSource.indexOf("const rendered = await withLeaseHeartbeat((signal) => renderVideo(request, signal));");
  const hashClaimPosition = videoWorkerSource.indexOf(
    "await patchProcessingRequestWithLease({ content_hash: rendered.contentHash });",
  );
  assert.ok(renderPosition >= 0 && hashClaimPosition > renderPosition);
  assert.match(videoWorkerSource, /renew: \(\) => patchProcessingRequestWithLease\(\{\}\)/);
  assert.match(videoWorkerSource, /isLeaseLost: \(error\) => error instanceof VideoRequestLeaseLostError/);
});

test("post-render catalog and social queue work renews the processing lease", () => {
  assert.ok(videoWorkerSource.includes("const withLeaseHeartbeat = <T>(operation: (signal: AbortSignal) => Promise<T>)"));
  assert.ok(videoWorkerSource.includes("renew: () => patchProcessingRequestWithLease({})"));

  const siteRegistrationCall = "await withLeaseHeartbeat((signal) => registerGeneratedVideoOnSite(";
  assert.equal(
    videoWorkerSource.split(siteRegistrationCall).length - 1,
    2,
    "both canonical recovery and normal site registration must keep the lease alive",
  );
  assert.ok(
    videoWorkerSource.includes("await withLeaseHeartbeat((signal) => queueSocialItems(request, rendered.videoUrl, signal))"),
    "social queue insertion must keep the processing lease alive until durable",
  );
  const recoveryHeartbeatPosition = videoWorkerSource.indexOf("socialQueueRecovery = await withLeaseHeartbeat(");
  const recoveryOperationPosition = videoWorkerSource.indexOf(
    "restoreMissingMediaSocialQueueItems(",
    recoveryHeartbeatPosition,
  );
  assert.ok(
    recoveryHeartbeatPosition >= 0 && recoveryOperationPosition > recoveryHeartbeatPosition,
    "recovered social queue rows must also be protected by the active lease",
  );
});
