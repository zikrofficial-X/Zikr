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
export function isVideoApprovalRecorded(content: unknown): boolean {
  const data = record(content);
  if (data?.approvalStatus !== "approved") return false;
  const reviewedAt = typeof data.approvalReviewedAt === "string" ? Date.parse(data.approvalReviewedAt) : Number.NaN;
  if (!Number.isFinite(reviewedAt)) return false;
  const review = record(data.qualityReview);
  if (!hasCompleteVideoApprovalChecklist(review)) return false;
  const reviewTimestamp = (review as Record<string, unknown>).reviewedAt;
  return typeof reviewTimestamp === "string" && Number.isFinite(Date.parse(reviewTimestamp));
}
export type VideoPublishRequestSnapshot = { status: string; video_url: string | null; content: unknown };
export function isVideoQueueItemApprovedForPublishing(input: {
  contentType: string; contentId: string | null; queuedVideoUrl: string | null; request: VideoPublishRequestSnapshot | null;
}): boolean {
  if (!isVideoContentType(input.contentType)) return true;
  if (!input.contentId || !input.queuedVideoUrl || !input.request) return false;
  if (input.request.status !== "completed" || !input.request.video_url) return false;
  return input.request.video_url.trim() === input.queuedVideoUrl.trim() && isVideoApprovalRecorded(input.request.content);
}
