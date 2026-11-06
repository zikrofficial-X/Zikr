import { createHash } from "node:crypto";

export const REQUIRED_VIDEO_APPROVAL_CHECKS = ["sourceVerified", "audioReviewed", "visualsReviewed", "captionsReviewed", "rightsReviewed"] as const;
export type VideoApprovalCheck = (typeof REQUIRED_VIDEO_APPROVAL_CHECKS)[number];
export type VideoApprovalChecklist = Record<VideoApprovalCheck, boolean>;
function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export function isVideoContentType(contentType: string): boolean {
  const normalized = contentType.trim().toLowerCase();
  return normalized === "video" || normalized.endsWith("_video") || normalized === "video_generation";
}
export function hasCompleteVideoApprovalChecklist(value: unknown): value is VideoApprovalChecklist {
  const checklist = record(value);
  return REQUIRED_VIDEO_APPROVAL_CHECKS.every((key) => checklist?.[key] === true);
}
export type VideoApprovalSnapshot = {
  category: string;
  sourceHash: string | null;
  contentHash: string | null;
  templateVersion: string | null;
  videoUrl: string | null;
};

export function buildVideoApprovalSnapshotHash(snapshot: VideoApprovalSnapshot): string | null {
  const sourceHash = snapshot.sourceHash?.trim();
  const contentHash = snapshot.contentHash?.trim();
  const videoUrl = snapshot.videoUrl?.trim();
  const category = snapshot.category.trim();
  if (!sourceHash || !contentHash || !videoUrl || !category) return null;
  const canonical = JSON.stringify([
    category,
    sourceHash,
    contentHash,
    snapshot.templateVersion?.trim() ?? "",
    videoUrl,
  ]);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function isVideoApprovalRecorded(content: unknown, expectedSnapshotHash: string | null): boolean {
  const data = record(content);
  if (data?.approvalStatus !== "approved") return false;
  if (typeof data.approvalReviewerId !== "string" || !data.approvalReviewerId.trim()) return false;
  if (!expectedSnapshotHash || data.approvalSnapshotHash !== expectedSnapshotHash) return false;
  const reviewedAt = typeof data.approvalReviewedAt === "string" ? Date.parse(data.approvalReviewedAt) : Number.NaN;
  if (!Number.isFinite(reviewedAt)) return false;
  const review = record(data.qualityReview);
  if (!hasCompleteVideoApprovalChecklist(review)) return false;
  const reviewTimestamp = (review as Record<string, unknown>).reviewedAt;
  return typeof reviewTimestamp === "string" && Number.isFinite(Date.parse(reviewTimestamp));
}
export type VideoPublishRequestSnapshot = {
  status: string;
  category: string;
  video_url: string | null;
  source_hash: string | null;
  content_hash: string | null;
  template_version: string | null;
  content: unknown;
};
export function isVideoQueueItemApprovedForPublishing(input: {
  contentType: string;
  contentId: string | null;
  queuedVideoUrl: string | null;
  request: VideoPublishRequestSnapshot | null;
  requireApproval?: boolean;
}): boolean {
  if (!isVideoContentType(input.contentType)) return true;
  if (!input.contentId || !input.queuedVideoUrl || !input.request) return false;
  if (input.request.status !== "completed" || !input.request.video_url) return false;

  // Always preserve source/status integrity, even when the owner explicitly disables
  // the human QA approval gate for autonomous publishing.
  if (input.request.video_url.trim() !== input.queuedVideoUrl.trim()) return false;
  if (input.requireApproval === false) return true;
  const approvalSnapshotHash = buildVideoApprovalSnapshotHash({
    category: input.request.category,
    sourceHash: input.request.source_hash,
    contentHash: input.request.content_hash,
    templateVersion: input.request.template_version,
    videoUrl: input.request.video_url,
  });
  return isVideoApprovalRecorded(input.request.content, approvalSnapshotHash);
}
