import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDueSocialQueueClaimFilter, buildSocialPublishLeaseFilter, buildVideoSocialQueueUpdateFilter, mergeUniqueSocialPublishCandidates, requireSocialQueueRows, selectEligibleSocialPublishItems } from "../../src/features/social/services/social-queue-selection";
import { buildStaleSocialPublishRecoveryFilter } from "../../src/features/social/services/social-publish-recovery-policy";
import { buildNextRowVersionUpdatedAt } from "../../src/lib/supabase/row-version";

const videos = Array.from({ length: 74 }, (_, index) => ({
  id: `video-${index}`,
  content_type: "video",
  target_platforms: ["youtube", "facebook_reels"] as const,
  metadata: {
    platformResults: { facebook_reels: { ok: false, error: "Facebook Reel upload failed (HTTP 422)" } },
    platformAttempts: { facebook_reels: 4 },
  },
}));
const writtenPosts = [
  { id: "post-1", content_type: "written_post", target_platforms: ["facebook"] as const, metadata: null },
  { id: "post-2", content_type: "written_post", target_platforms: ["facebook"] as const, metadata: null },
  { id: "post-3", content_type: "written_post", target_platforms: ["facebook"] as const, metadata: null },
];
const candidates = [...videos, ...writtenPosts];
const enabledPlatforms = ["facebook", "facebook_reels", "youtube"] as const;

const missingSourceMedia = {
  id: "missing-source-media",
  content_type: "video",
  target_platforms: ["youtube", "facebook_reels"] as const,
  metadata: { sourceMediaMissing: true },
};
const missingMediaSelection = selectEligibleSocialPublishItems([missingSourceMedia], {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set([missingSourceMedia.id]),
  maxAttemptsFor: () => 5,
  limit: 1,
});
assert.deepEqual(missingMediaSelection, [], "source-media-missing videos must stay out of the worker queue even when QA approval exists");

const boundedHeldVideos = Array.from({ length: 125 }, (_, index) => ({
  id: `held-video-${index}`,
  content_type: "video",
  target_platforms: ["youtube", "facebook_reels"] as const,
  metadata: null,
}));
const separatelyFetchedWrittenPost = {
  id: "written-beyond-general-window",
  content_type: "written_post",
  target_platforms: ["facebook"] as const,
  metadata: null,
};
const mergedBeyondWindow = mergeUniqueSocialPublishCandidates(
  boundedHeldVideos,
  [separatelyFetchedWrittenPost],
);
const reservedBeyondWindow = selectEligibleSocialPublishItems(mergedBeyondWindow, {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set(),
  maxAttemptsFor: () => 5,
  limit: 1,
});
assert.deepEqual(
  reservedBeyondWindow.map((item) => item.id),
  ["written-beyond-general-window"],
  "a dedicated written-post query must prevent a held-video window from hiding later eligible posts",
);

const selectedPosts = selectEligibleSocialPublishItems(candidates, {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set(),
  maxAttemptsFor: () => 5,
  limit: 2,
});
assert.deepEqual(
  selectedPosts.map((item) => item.id),
  ["post-1", "post-2"],
  "unapproved videos must not starve later eligible written posts",
);

const approvedVideo = selectEligibleSocialPublishItems(videos, {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set(["video-0"]),
  maxAttemptsFor: () => 5,
  limit: 1,
});
assert.equal(approvedVideo[0]?.id, "video-0", "approved videos remain eligible when no written post competes");

const approvedVideoBacklog = videos.slice(0, 10);
const fairBatch = selectEligibleSocialPublishItems(
  [...approvedVideoBacklog, ...writtenPosts],
  {
    enabledPlatforms,
    approvedVideoQueueItemIds: new Set(approvedVideoBacklog.map((item) => item.id)),
    maxAttemptsFor: () => 5,
    limit: 5,
  },
);
assert.equal(
  fairBatch[0]?.id,
  "post-1",
  "one due written post must receive a reserved batch slot ahead of eligible YouTube/Reels retry candidates",
);
assert.equal(
  fairBatch.filter((item) => item.content_type === "written_post").length,
  1,
  "the fairness reserve must not consume the entire video batch",
);
assert.equal(fairBatch.length, 5, "the fairness reserve must preserve the configured batch limit");

const facebookOnly = selectEligibleSocialPublishItems(candidates, {
  enabledPlatforms: ["facebook"],
  approvedVideoQueueItemIds: new Set(),
  maxAttemptsFor: () => 5,
  limit: 10,
});
assert.deepEqual(
  facebookOnly.map((item) => item.id),
  ["post-1", "post-2", "post-3"],
  "disabled YouTube targets must be skipped without blocking Facebook posts",
);


assert.equal(
  buildDueSocialQueueClaimFilter("queue id/1", "queued", "2026-11-11T17:30:00.000Z", "2026-11-11T17:29:00.000Z"),
  "id=eq.queue%20id%2F1&status=eq.queued&updated_at=eq.2026-11-11T17%3A29%3A00.000Z&or=(scheduled_at.is.null,scheduled_at.lte.2026-11-11T17%3A30%3A00.000Z)",
  "the atomic claim must compare the exact row version and recheck scheduled_at before publishing a snapshot",
);
assert.throws(
  () => buildDueSocialQueueClaimFilter("queue-1", "published", "2026-11-11T17:30:00.000Z", "2026-11-11T17:29:00.000Z"),
  /retryable queue status/,
  "published rows must never be eligible for a new publisher claim",
);
assert.throws(
  () => buildDueSocialQueueClaimFilter("queue-1", "queued", "not-a-date", "2026-11-11T17:29:00.000Z"),
  /valid due-time and updated_at timestamps/,
  "a malformed due-time must not weaken the atomic queue claim",
);

assert.equal(
  buildSocialPublishLeaseFilter("queue id/1", "processing", "2026-11-11T17:30:00.000Z"),
  "id=eq.queue%20id%2F1&status=eq.processing&updated_at=eq.2026-11-11T17%3A30%3A00.000Z",
  "a publisher must advance a queue row only while its exact processing lease version is still current",
);
assert.throws(
  () => buildSocialPublishLeaseFilter("queue-1", "processing", "not-a-date"),
  /valid updated_at timestamp/,
  "publisher lease compare-and-set must fail closed when the claimed row version is invalid",
);
assert.throws(
  () => buildSocialPublishLeaseFilter(" ", "processing", "2026-11-11T17:30:00.000Z"),
  /queue item ID/,
  "publisher lease compare-and-set must reject an empty queue ID",
);

assert.equal(
  buildStaleSocialPublishRecoveryFilter("queue id/1", "2026-11-11T17:30:00.000Z"),
  "id=eq.queue%20id%2F1&status=eq.processing&updated_at=lt.2026-11-11T17%3A30%3A00.000Z",
  "stale recovery must recheck updated_at in the UPDATE to avoid overwriting a row refreshed by a live publisher",
);
assert.throws(
  () => buildStaleSocialPublishRecoveryFilter("queue-1", "not-a-date"),
  /valid cutoff timestamp/,
  "stale recovery must reject an invalid cutoff instead of weakening the compare-and-set",
);

const socialPublisher = readFileSync("src/features/social/services/social-publishing.ts", "utf8");
assert.match(
  socialPublisher,
  /buildStaleSocialPublishRecoveryFilter\(item\.id, staleBefore\)/,
  "stale recovery updates must include the same stale cutoff that selected the candidate",
);
assert.match(socialPublisher, /content_type=eq\.written_post/, "the worker must query written posts independently of the bounded general queue window");
assert.match(socialPublisher, /mergeUniqueSocialPublishCandidates/, "general and written candidates must be merged without duplicate queue IDs");
assert.match(socialPublisher, /Failed to fetch social publish queue candidates; refusing to report an empty successful batch/, "queue read failures must fail the job instead of appearing as an empty successful run");
assert.equal(
  (socialPublisher.match(/resolveSocialPublishCutoff\(process\.env\.SOCIAL_PUBLISH_AFTER\)/g) ?? []).length,
  2,
  "queue reads and stale recovery must both use the shared validated cutoff rather than silently returning an empty batch",
);
assert.match(socialPublisher, /buildDueSocialQueueClaimFilter\(item\.id, claimStatus, claimAt, item\.updated_at\)/, "the worker claim must compare the exact candidate row version and due time");
assert.match(socialPublisher, /buildSocialPublishLeaseFilter\(item\.id, claimLease\.status, claimLease\.updatedAt\)/, "the provider in-flight marker must compare the exact initial worker lease");
assert.match(socialPublisher, /const finalized = await markQueueItem\(item\.id, persistedStatus,[\s\S]*?\}, inFlightLease\);/, "provider results must only finalize while the same in-flight lease is current");
assert.match(socialPublisher, /Provider result arrived after the worker lease was recovered/, "a stale provider result must leave the newer recovery state untouched");
assert.match(socialPublisher, /expectedLease\s*\?\s*buildSocialPublishLeaseFilter\(itemId, expectedLease\.status, expectedLease\.updatedAt\)/, "status updates with a lease must use the versioned compare-and-set filter");

const markQueueItemStart = socialPublisher.indexOf("async function markQueueItem(");
const markQueueItemEnd = socialPublisher.indexOf("async function hasVideoApprovalForQueueItem", markQueueItemStart);
const markQueueItemSource = socialPublisher.slice(markQueueItemStart, markQueueItemEnd);
assert.match(markQueueItemSource, /buildNextRowVersionUpdatedAt\(expectedLease\.updatedAt, now\)/,
  "a leased queue transition must advance updated_at strictly beyond the lease it consumes");
assert.doesNotMatch(markQueueItemSource, /updated_at:\s*new Date\(\)\.toISOString\(\)/,
  "a same-millisecond queue transition must not leave an old publisher lease reusable");
assert.equal(
  (socialPublisher.match(/const claimUpdatedAt = buildNextRowVersionUpdatedAt\(item\.updated_at, claimNow\)/g) ?? []).length,
  2,
  "both batch and single-item publisher claims must advance the row-version token",
);
assert.equal(
  buildNextRowVersionUpdatedAt("2026-11-13T01:30:00.123Z", new Date("2026-11-13T01:30:00.123Z")),
  "2026-11-13T01:30:00.124Z",
  "a row updated in the same millisecond must still receive a strictly newer CAS token",
);
const adminRoute = readFileSync("src/app/api/admin/social/route.ts", "utf8");
assert.ok(adminRoute.includes('id=eq.${encodeURIComponent(item.id)}&status=eq.${encodeURIComponent(item.status)}'));
assert.ok(adminRoute.includes('Prefer: "return=representation"'));
assert.ok(adminRoute.includes("if (Array.isArray(updated) && updated[0]) affected += 1"));

console.log("Social queue starvation regression checks passed.");

assert.equal(
  buildVideoSocialQueueUpdateFilter("queue-1", "queued", "2026-11-11T22:40:00.000Z"),
  "id=eq.queue-1&status=eq.queued&updated_at=eq.2026-11-11T22%3A40%3A00.000Z",
  "video queue reconciliation must compare-and-set the exact social queue row revision",
);
assert.equal(
  buildVideoSocialQueueUpdateFilter("queue-1", "processing", "2026-11-11T22:40:00.000Z"),
  null,
  "a video worker must never rewrite an active social publisher lease",
);
assert.equal(
  buildVideoSocialQueueUpdateFilter("queue-1", "queued", null),
  null,
  "video queue reconciliation must fail closed when updated_at is unavailable",
);

const templateVideoWorker = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");
assert.ok(
  templateVideoWorker.includes("select=id,status,target_platforms,metadata,updated_at"),
  "video social queue lookup must read the revision used by compare-and-set",
);
assert.ok(
  templateVideoWorker.includes('if (existing.status === "processing")') &&
    templateVideoWorker.includes("if (newlyEnabledTargets.length > 0) await queueSupplementalTargets(newlyEnabledTargets)") &&
    templateVideoWorker.includes(":late:${target}") &&
    templateVideoWorker.includes("buildQueuePayload([target], supplementalKey)"),
  "newly enabled targets must use idempotent supplemental rows while the original social row is processing",
);
assert.ok(
  templateVideoWorker.includes("buildVideoSocialQueueUpdateFilter(existing.id, existing.status, existing.updated_at)"),
  "normal social target expansion must use an exact row-version filter",
);
assert.ok(
  templateVideoWorker.includes("buildVideoSocialQueueUpdateFilter(item.id, item.status, item.updated_at)"),
  "missing-media social recovery must also compare-and-set its queue row revision",
);

assert.ok(
  templateVideoWorker.includes("const latest = await findSocialQueueByAutomationKey(socialKey, signal)") &&
    templateVideoWorker.includes("queueSupplementalTargets(latestNewTargets)"),
  "a publisher claim racing the initial compare-and-set must be reconciled without resetting its active lease or losing new targets",
);

assert.deepEqual(requireSocialQueueRows([], "empty queue"), []);
assert.throws(
  () => requireSocialQueueRows({}, "social publish queue"),
  /invalid row set; refusing to report an empty successful batch/,
  "a malformed PostgREST object must not be treated as an empty queue",
);
assert.throws(
  () => requireSocialQueueRows(null, "written-post queue"),
  /invalid row set; refusing to report an empty successful batch/,
  "a null PostgREST payload must not be treated as an empty written-post queue",
);
