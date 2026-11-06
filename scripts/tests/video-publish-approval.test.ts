import assert from "node:assert/strict";
import { buildVideoApprovalSnapshotHash, hasCompleteVideoApprovalChecklist, isVideoApprovalRecorded, isVideoQueueItemApprovedForPublishing, REQUIRED_VIDEO_APPROVAL_CHECKS } from "../../src/features/videos/services/video-publish-approval";
const checks = Object.fromEntries(REQUIRED_VIDEO_APPROVAL_CHECKS.map((key) => [key, true]));
const now = "2026-10-21T12:00:00.000Z";
const snapshot = {
  category: "quran",
  sourceHash: "source-sha-256",
  contentHash: "content-sha-256",
  templateVersion: "template-v1",
  videoUrl: "https://media.example.test/approved.mp4",
};
const snapshotHash = buildVideoApprovalSnapshotHash(snapshot);
assert.equal(typeof snapshotHash, "string");
const content = {
  approvalStatus: "approved",
  approvalReviewerId: "admin-user-1",
  approvalReviewedAt: now,
  approvalSnapshotHash: snapshotHash,
  qualityReview: { ...checks, reviewedAt: now },
};
const request = {
  status: "completed",
  category: snapshot.category,
  video_url: snapshot.videoUrl,
  source_hash: snapshot.sourceHash,
  content_hash: snapshot.contentHash,
  template_version: snapshot.templateVersion,
  content,
};
const queueItem = { contentType: "quran_video", contentId: "request-1", queuedVideoUrl: request.video_url, request };
assert.equal(REQUIRED_VIDEO_APPROVAL_CHECKS.length, 5);
assert.equal(hasCompleteVideoApprovalChecklist(checks), true);
assert.equal(hasCompleteVideoApprovalChecklist({ ...checks, rightsReviewed: false }), false);
assert.equal(isVideoApprovalRecorded(content, snapshotHash), true);
assert.equal(isVideoApprovalRecorded({ ...content, approvalReviewedAt: null }, snapshotHash), false);
assert.equal(isVideoApprovalRecorded({ ...content, approvalReviewerId: null }, snapshotHash), false);
assert.equal(isVideoApprovalRecorded(content, "different-snapshot-hash"), false);
assert.equal(buildVideoApprovalSnapshotHash({ ...snapshot, sourceHash: null }), null);
assert.equal(isVideoQueueItemApprovedForPublishing(queueItem), true);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, contentType: "article" }), true);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, request: { ...request, status: "processing" } }), false);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, queuedVideoUrl: "https://media.example.test/old.mp4" }), false);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, request: { ...request, content: { ...content, approvalStatus: "awaiting_human_review" } } }), false);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, request: { ...request, content: { ...content, qualityReview: { ...checks, sourceVerified: false, reviewedAt: now } } } }), false);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, request: { ...request, source_hash: "changed-source-hash" } }), false);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, request: { ...request, content_hash: "changed-content-hash" } }), false);
assert.equal(isVideoQueueItemApprovedForPublishing({ ...queueItem, request: null }), false);

// Unattended worker scheduling never bypasses persisted human approval.
const unreviewedRequest = {
  status: "completed",
  category: "quran",
  video_url: "https://media.example.test/approved.mp4",
  source_hash: "source-sha-256",
  content_hash: "content-sha-256",
  template_version: "template-v1",
  content: {},
};
assert.equal(isVideoQueueItemApprovedForPublishing({
  ...queueItem,
  request: unreviewedRequest,
}), false);
assert.equal(isVideoQueueItemApprovedForPublishing({
  ...queueItem,
  request: { ...unreviewedRequest, status: "processing" },
}), false);
assert.equal(isVideoQueueItemApprovedForPublishing({
  ...queueItem,
  request: unreviewedRequest,
  requireApproval: false,
} as Parameters<typeof isVideoQueueItemApprovedForPublishing>[0]), false);
console.log("Video publishing approval contract passed.");
