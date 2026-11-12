import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const worker = readFileSync(join(root, "scripts/run-background-jobs.ts"), "utf8");
const queue = readFileSync(join(root, "scripts/jobs/template-video-automation.ts"), "utf8");
const claim = readFileSync(join(root, "src/features/videos/services/video-queue-claim.ts"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`[video-queue-priority] FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`[video-queue-priority] PASS: ${message}`);
  }
}

const seedStart = worker.indexOf("seedAutomatedVideoRequests(settings.batchSize)");
const seedEnd = seedStart >= 0 ? worker.indexOf(";", seedStart) : -1;
const drainCall = worker.indexOf("const result = await drainQueue(settings.batchSize);");
assert(seedStart >= 0 && seedEnd > seedStart && drainCall > seedEnd, "seed scheduled requests before draining queue backlog");
assert(
  worker.includes("isVideoGenerationPaused() ? 0 : await seedAutomatedVideoRequests(settings.batchSize)"),
  "video purge lock is checked before scheduled requests are seeded",
);

assert(
  worker.includes("const priorityDay = Math.floor(Date.now() / 86_400_000);"),
  "worker computes the same UTC day-index format as the seeder",
);
assert(
  worker.includes("processTemplateVideoQueue(waveSize, priorityDay)"),
  "worker passes the current UTC day to the prioritized queue processor",
);
assert(
  worker.includes("const wave = [await processTemplateVideoQueue(waveSize, priorityDay)];"),
  "each bounded batch is selected in one worker invocation, avoiding duplicate concurrent reads",
);

assert(
  queue.includes("export async function processTemplateVideoQueue(limit = BATCH_SIZE, priorityDay?: number)"),
  "queue processor supports an optional daily priority key",
);
assert(
  queue.includes("calculateDailyVideoQuotaState(todaysRows ?? [])"),
  "daily video quota excludes terminal failed/cancelled requests while retaining their slot keys",
);
assert(
  queue.includes("const slot = dailyQuota.nextSlot + i;"),
  "replacement video requests use a fresh automation slot after terminal rows",
);
const priorityQuery = queue.indexOf("automation_key=like.*:${priorityDay}:*");
const fallbackQuery = queue.indexOf("const backlog =", priorityQuery);
assert(priorityQuery >= 0 && fallbackQuery > priorityQuery, "today's automation keys are selected before legacy backlog");
assert(
  queue.indexOf("rows = [...new Map((prioritized ?? []).map((request) => [request.id, request])).values()]") > priorityQuery,
  "priority candidates are deduplicated before filling the batch",
);
const claimGuard = queue.indexOf("if (!claimed?.[0]) continue;");
const claimedCounter = queue.indexOf("processed += 1;", claimGuard);
assert(claimGuard >= 0 && claimedCounter > claimGuard, "processed count increments only after a successful atomic claim");
assert(
  queue.includes("return { processed, succeeded, failed, skipped };"),
  "processed count reflects actual claimed rows rather than fetched candidates",
);
assert(
  queue.includes("select=id,generation_attempts,updated_at"),
  "stale recovery reads the exact row version before attempting a claim",
);
assert(
  queue.includes("buildStaleVideoRequestRecoveryFilter(request.id, request.updated_at, staleBefore)"),
  "stale recovery update is fenced by the selected updated_at value",
);
assert(
  queue.includes("buildVideoRequestClaimFilter(request, claimNow)"),
  "pending/retry claims recheck the selected row version and retry due time atomically",
);
assert(
  queue.includes("buildProcessingVideoRequestLeaseFilter(request.id, claimUpdatedAt)"),
  "pause-lock release cannot overwrite a request changed after the worker claim",
);
assert(
  queue.includes("pause-lock release lost ownership") && queue.includes("skipped += 1;"),
  "a superseded pause-lock release is skipped without failing or overwriting the newer owner",
);
const workerStart = queue.indexOf("export async function processTemplateVideoQueue");
const postClaimWorker = workerStart >= 0 ? queue.slice(workerStart) : "";
const hasRollingVideoLease =
  /let\s+leaseUpdatedAt\s*=\s*claimUpdatedAt\s*;/.test(postClaimWorker) &&
  /const\s+patchProcessingRequestWithLease\s*=\s*async/.test(postClaimWorker) &&
  /buildProcessingVideoRequestLeaseFilter\s*\(\s*request\.id\s*,\s*leaseUpdatedAt\s*,\s*leaseVideoUrl\s*\)/.test(postClaimWorker);
assert(hasRollingVideoLease, "post-claim writes use a rolling exact-row-version lease");
const hasLeaseFencedTransitions =
  /await\s+patchProcessingRequestWithLease\s*\(\s*\{\s*content_hash:\s*rendered\.contentHash\s*\}\s*\)/.test(postClaimWorker) &&
  /await\s+patchProcessingRequestWithLease\s*\(\s*\{\s*status:\s*["']completed["']\s*,/.test(postClaimWorker) &&
  /await\s+patchProcessingRequestWithLease\s*\(\s*\{\s*status:\s*terminalStatus\s*,/.test(postClaimWorker);
assert(hasLeaseFencedTransitions, "hash claim, completion and failure updates are fenced by the processing lease");

const catalogRegistrationStart = queue.indexOf("async function registerGeneratedVideoOnSite");
const catalogRegistrationEnd = queue.indexOf("type MissingMediaSocialQueueRow", catalogRegistrationStart);
const catalogRegistration = queue.slice(catalogRegistrationStart, catalogRegistrationEnd).replace(/\s+/g, " ");
assert(
  catalogRegistration.includes("&select=id,published,updated_at,metadata&limit=1") &&
    catalogRegistration.includes('metadata.mediaState !== "purged"') &&
    catalogRegistration.includes("metadata.mediaPurgedFromPublished !== true") &&
    catalogRegistration.includes("buildUnpublishedVideoCatalogUpdateFilter(videoId, existingVideo?.updated_at)") &&
    catalogRegistration.includes('Prefer: "return=representation"') &&
    catalogRegistration.includes("if (!updatedVideoRows?.[0]?.id)"),
  "generated-video catalog recovery rechecks purged state and compare-and-sets the exact catalog row revision",
);
const normalizedPostClaimWorker = postClaimWorker.replace(/\s+/g, " ");
assert(
  normalizedPostClaimWorker.includes("await withLeaseHeartbeat((signal) => registerGeneratedVideoOnSite(request, rendered, {}, signal))") &&
    normalizedPostClaimWorker.includes("await withLeaseHeartbeat((signal) => registerGeneratedVideoOnSite( recoveredRequest, rendered, { recoverPurgedRecord: true }, signal, ))"),
  "normal and duplicate generated-video catalog registration run under the processing lease heartbeat",
);

assert(
  !postClaimWorker.includes("/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}"),
  "no post-claim ID-only PATCH can overwrite a newer worker",
);
assert(
  postClaimWorker.includes("error instanceof VideoRequestLeaseLostError"),
  "a worker that loses its lease is skipped without rewriting the newer owner",
);
assert(
  postClaimWorker.includes("withVideoRequestLeaseHeartbeat") &&
    postClaimWorker.includes("getVideoRequestLeaseHeartbeatIntervalMs(engineConfig().staleAfterMinutes)") &&
    postClaimWorker.includes("renew: () => patchProcessingRequestWithLease({})"),
  "long-running provider renders renew the exact processing lease before stale recovery can requeue them",
);
assert(
  claim.includes("updated_at=eq.") && claim.includes("next_retry_at=lte."),
  "video queue filters include optimistic row-version and retry-due predicates",
);

assert(
  queue.includes("recoverPendingVideoSocialQueueEnqueues(") &&
    queue.includes("content->>socialQueueEnqueueStatus=eq.pending") &&
    queue.includes("content->>socialQueueEnqueueStatus=eq.processing") &&
    queue.includes("buildVideoSocialQueueRecoveryClaimFilter(request, staleBefore)") &&
    queue.includes("buildVideoSocialQueueRecoveryLeaseFilter("),
  "failed or interrupted social enqueue handoffs are retried under an exact-row-version lease",
);
const socialQueueHandoffContract =
  /let\s+socialQueueResult:\s*["']queued["']\s*\|\s*["']not_required["']\s*;/.test(postClaimWorker) &&
  /socialQueueEnqueueStatus:\s*socialQueueResult/.test(postClaimWorker) &&
  /catch\s*\(socialError\)[\s\S]*?socialQueueEnqueueStatus:\s*["']pending["'][\s\S]*?continue\s*;/.test(postClaimWorker);
assert(
  socialQueueHandoffContract,
  "video completion cannot hide a failed social queue handoff",
);
assert(
  claim.includes("video_url=eq.") && claim.includes("content->>socialQueueEnqueueStatus=eq.processing"),
  "social queue recovery leases are fenced by the exact generated media URL and processing marker",
);

if (process.exitCode) {
  console.error("[video-queue-priority] Regression check failed.");
  process.exit(process.exitCode);
}
console.log("[video-queue-priority] All checks passed.");
