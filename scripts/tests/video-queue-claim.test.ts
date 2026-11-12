import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  buildProcessingVideoRequestLeaseFilter,
  buildUnpublishedVideoCatalogUpdateFilter,
  buildStaleVideoRequestRecoveryFilter,
  buildVideoRequestClaimFilter,
  buildVideoSocialQueueRecoveryClaimFilter,
  buildVideoSocialQueueRecoveryLeaseFilter,
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

const generatedVideoUrl = "https://res.cloudinary.com/example/video/upload/v1/auto-request-4.mp4";

test("processing video lease follows its exact persisted Cloudinary URL", () => {
  assert.equal(
    buildProcessingVideoRequestLeaseFilter("request-4", updatedAt, generatedVideoUrl),
    "id=eq.request-4&status=eq.processing&video_url=eq." +
      encodeURIComponent(generatedVideoUrl) +
      "&updated_at=eq.2026-11-11T22%3A40%3A00.000Z",
  );
  assert.equal(
    buildProcessingVideoRequestLeaseFilter("request-4", updatedAt, new URL(["https:", "", "invalid-host", "video.mp4"].join("/")).toString()),
    null,
    "a non-Cloudinary URL must not become a processing lease",
  );
});

test("pending social queue handoffs can be claimed immediately by exact row version", () => {
  assert.equal(
    buildVideoSocialQueueRecoveryClaimFilter({
      id: "request/4",
      status: "processing",
      video_url: generatedVideoUrl,
      updated_at: updatedAt,
      content: { socialQueueEnqueueStatus: "pending" },
    }, "2026-11-11T23:00:00.000Z"),
    "id=eq.request%2F4&status=eq.processing&video_url=eq." +
      encodeURIComponent(generatedVideoUrl) +
      "&updated_at=eq.2026-11-11T22%3A40%3A00.000Z&content->>socialQueueEnqueueStatus=eq.pending",
  );
});

test("stale social queue handoffs are recoverable but live leases are not", () => {
  const staleBefore = "2026-11-11T23:00:00.000Z";
  const candidate = {
    id: "request-5",
    status: "processing",
    video_url: generatedVideoUrl,
    updated_at: updatedAt,
    content: { socialQueueEnqueueStatus: "processing" },
  };
  assert.ok(buildVideoSocialQueueRecoveryClaimFilter(candidate, staleBefore));
  assert.equal(
    buildVideoSocialQueueRecoveryClaimFilter({
      ...candidate,
      updated_at: "2026-11-11T23:00:01.000Z",
    }, staleBefore),
    null,
    "a non-stale processing lease must remain owned by the current worker",
  );
  assert.equal(
    buildVideoSocialQueueRecoveryClaimFilter({
      ...candidate,
      updated_at: "not-a-date",
    }, staleBefore),
    null,
  );
  assert.equal(
    buildVideoSocialQueueRecoveryClaimFilter({
      ...candidate,
      content: { socialQueueEnqueueStatus: "queued" },
    }, staleBefore),
    null,
  );
});

test("retry_wait handoffs are adopted by the recovery worker without rerendering", () => {
  assert.equal(
    buildVideoSocialQueueRecoveryClaimFilter({
      id: "request-7",
      status: "retry_wait",
      video_url: generatedVideoUrl,
      updated_at: "2026-11-11T22:59:59.000Z",
      content: { socialQueueEnqueueStatus: "processing" },
    }, "2026-11-11T23:00:00.000Z"),
    "id=eq.request-7&status=eq.retry_wait&video_url=eq." +
      encodeURIComponent(generatedVideoUrl) +
      "&updated_at=eq.2026-11-11T22%3A59%3A59.000Z&content->>socialQueueEnqueueStatus=eq.processing",
  );
});

test("social queue recovery lease is fenced by the exact URL, marker, and row version", () => {
  assert.equal(
    buildVideoSocialQueueRecoveryLeaseFilter("request-6", generatedVideoUrl, updatedAt),
    "id=eq.request-6&status=eq.processing&video_url=eq." +
      encodeURIComponent(generatedVideoUrl) +
      "&updated_at=eq.2026-11-11T22%3A40%3A00.000Z&content->>socialQueueEnqueueStatus=eq.processing",
  );
  assert.equal(buildVideoSocialQueueRecoveryLeaseFilter("request-6", null, updatedAt), null);
  assert.equal(buildVideoSocialQueueRecoveryLeaseFilter("request-6", generatedVideoUrl, null), null);
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
    videoWorkerSource.includes("withLeaseHeartbeat(\n          (signal) => queueSocialItems(request, rendered.videoUrl, signal),\n        )"),
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

test("failed social enqueue remains recoverable and cannot complete the video request", () => {
  const queueCall = videoWorkerSource.indexOf("queueSocialItems(request, rendered.videoUrl, signal)");
  const failureHandler = videoWorkerSource.indexOf("catch (socialError)", queueCall);
  const pendingMarker = videoWorkerSource.indexOf('socialQueueEnqueueStatus: "pending"', failureHandler);
  const continuePosition = videoWorkerSource.indexOf("continue;", pendingMarker);
  const completionPosition = videoWorkerSource.indexOf(
    'status: "completed"',
    continuePosition,
  );
  assert.ok(queueCall >= 0 && failureHandler > queueCall);
  assert.ok(pendingMarker > failureHandler, "enqueue failure must persist a pending recovery marker");
  assert.ok(continuePosition > pendingMarker, "enqueue failure must leave the generation row processing");
  assert.ok(completionPosition > continuePosition, "the completed transition must only occur after the failure branch continues");
  assert.ok(videoWorkerSource.includes("recoverPendingVideoSocialQueueEnqueues("));
  assert.ok(videoWorkerSource.includes("content->>socialQueueEnqueueStatus=eq.pending"));
  assert.ok(videoWorkerSource.includes("content->>socialQueueEnqueueStatus=eq.processing"));
  assert.ok(videoWorkerSource.includes("buildVideoSocialQueueRecoveryClaimFilter(request, staleBefore)"));
  assert.ok(videoWorkerSource.includes("buildVideoSocialQueueRecoveryLeaseFilter("));
  assert.ok(videoWorkerSource.includes("status=in.(processing,retry_wait)"));
  assert.ok(videoWorkerSource.includes("catch (handoffPersistError)"));
  assert.ok(videoWorkerSource.includes("catch (completionError)"));
});

test("video social queue expansion preserves active publisher leases and compare-and-sets mutable rows", () => {
  const processingBranch = videoWorkerSource.match(
    /if\s*\(\s*existing\.status\s*===\s*["']processing["']\s*\)\s*\{([\s\S]*?)\n\s*\}/,
  )?.[1] ?? "";
  assert.match(processingBranch, /newlyEnabledTargets\.length\s*>\s*0/);
  assert.match(processingBranch, /queueSupplementalTargets\(newlyEnabledTargets\)/);
  assert.match(processingBranch, /return\s+["']queued["']/);
  assert.match(videoWorkerSource, /buildVideoSocialQueueUpdateFilter\s*\(\s*existing\.id,\s*existing\.status,\s*existing\.updated_at\s*\)/);
  assert.match(videoWorkerSource, /const\s+latest\s*=\s*await\s+findSocialQueueByAutomationKey\(socialKey,\s*signal\)/);
  assert.match(videoWorkerSource, /queueSupplementalTargets\(latestNewTargets\)/);
  assert.match(
    videoWorkerSource,
    /await\s+withLeaseHeartbeat\s*\(\s*\(signal\)\s*=>\s*queueSocialItems\s*\(\s*request,\s*rendered\.videoUrl,\s*signal\s*\)\s*,?\s*\)/,
  );
});

test("Video queue priority verifier accepts rolling leases and recoverable social handoffs", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-video-queue-priority.mjs"], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join("\n") ||
      "Video queue priority verifier must accept the current lease-fenced worker contract",
  );
});

test("unpublished video catalog updates use the exact selected row revision", () => {
  assert.equal(
    buildUnpublishedVideoCatalogUpdateFilter("video/1", updatedAt),
    "id=eq.video%2F1&published=eq.false&updated_at=eq.2026-11-11T22%3A40%3A00.000Z",
  );
  assert.equal(
    buildUnpublishedVideoCatalogUpdateFilter("video-2", null),
    "id=eq.video-2&published=eq.false&updated_at=is.null",
  );
  assert.equal(buildUnpublishedVideoCatalogUpdateFilter("video-3", undefined), null);
  assert.equal(buildUnpublishedVideoCatalogUpdateFilter("video-4", "not-a-date"), null);
});

test("purged catalog recovery rechecks media state and compare-and-sets the catalog row", () => {
  const start = videoWorkerSource.indexOf("async function registerGeneratedVideoOnSite");
  const end = videoWorkerSource.indexOf("type MissingMediaSocialQueueRow", start);
  const registration = videoWorkerSource.slice(start, end);
  assert.ok(registration.includes("&select=id,published,updated_at,metadata&limit=1"));
  assert.ok(registration.includes('metadata.mediaState !== "purged"'));
  assert.ok(registration.includes("metadata.mediaPurgedFromPublished !== true"));
  assert.ok(registration.includes("buildUnpublishedVideoCatalogUpdateFilter(videoId, existingVideo?.updated_at)"));
  assert.ok(registration.includes('Prefer: "return=representation"'));
  assert.ok(registration.includes("if (!updatedVideoRows?.[0]?.id)"));

  const normalizedWorker = videoWorkerSource.replace(/\s+/g, " ");
  assert.ok(normalizedWorker.includes("await withLeaseHeartbeat((signal) => registerGeneratedVideoOnSite(request, rendered, {}, signal))"));
  assert.ok(normalizedWorker.includes("await withLeaseHeartbeat((signal) => registerGeneratedVideoOnSite( recoveredRequest, rendered, { recoverPurgedRecord: true }, signal, ))"));
});
