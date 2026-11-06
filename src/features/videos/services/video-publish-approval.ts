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
export type VideoPublishApprovalDiagnostics = {
  approved: boolean;
  reason: string | null;
  missingChecks: VideoApprovalCheck[];
  approvalStatus: string | null;
};

export function inspectVideoQueueItemApproval(input: {
  contentType: string;
  contentId: string | null;
  queuedVideoUrl: string | null;
  request: VideoPublishRequestSnapshot | null;
}): VideoPublishApprovalDiagnostics {
  if (!isVideoContentType(input.contentType)) {
    return { approved: true, reason: null, missingChecks: [], approvalStatus: "not_required" };
  }
  if (!input.contentId || !input.queuedVideoUrl || !input.request) {
    return { approved: false, reason: "بيانات طلب الفيديو أو ملفه غير مكتملة.", missingChecks: [...REQUIRED_VIDEO_APPROVAL_CHECKS], approvalStatus: null };
  }
  if (input.request.status !== "completed" || !input.request.video_url) {
    return { approved: false, reason: "الفيديو لم يكتمل توليده أو لم يعد ملفه متاحًا.", missingChecks: [...REQUIRED_VIDEO_APPROVAL_CHECKS], approvalStatus: record(input.request.content)?.approvalStatus === "approved" ? "approved" : null };
  }
  if (input.request.video_url.trim() !== input.queuedVideoUrl.trim()) {
    return { approved: false, reason: "ملف الفيديو في الطابور مختلف عن الملف الذي تمت مراجعته؛ يلزم تحديث الطابور وإعادة المراجعة.", missingChecks: [...REQUIRED_VIDEO_APPROVAL_CHECKS], approvalStatus: typeof record(input.request.content)?.approvalStatus === "string" ? String(record(input.request.content)?.approvalStatus) : null };
  }

  const content = record(input.request.content);
  const review = record(content?.qualityReview);
  const missingChecks = REQUIRED_VIDEO_APPROVAL_CHECKS.filter((key) => review?.[key] !== true);
  const approvalStatus = typeof content?.approvalStatus === "string" ? content.approvalStatus : null;
  const snapshotHash = buildVideoApprovalSnapshotHash({
    category: input.request.category,
    sourceHash: input.request.source_hash,
    contentHash: input.request.content_hash,
    templateVersion: input.request.template_version,
    videoUrl: input.request.video_url,
  });
  const approved = isVideoApprovalRecorded(content, snapshotHash);
  if (approved) return { approved: true, reason: null, missingChecks: [], approvalStatus };

  let reason: string;
  if (approvalStatus !== "approved") {
    reason = "بانتظار اعتماد المراجعة البشرية من صفحة طابور الفيديو.";
  } else if (missingChecks.length > 0) {
    reason = "قائمة مراجعة الجودة غير مكتملة؛ راجع البنود الناقصة قبل النشر.";
  } else if (!snapshotHash || content?.approvalSnapshotHash !== snapshotHash) {
    reason = "اعتماد المراجعة قديم أو تغيّر المصدر/المحتوى/القالب/ملف الفيديو؛ أعد المراجعة.";
  } else if (typeof content?.approvalReviewerId !== "string" || !content.approvalReviewerId.trim() || typeof content?.approvalReviewedAt !== "string") {
    reason = "سجل اعتماد المراجعة غير مكتمل؛ أعد اعتماد الفيديو من حساب إداري مخوّل.";
  } else {
    reason = "لم يجتز الفيديو شروط الاعتماد النهائي للنشر.";
  }
  return { approved: false, reason, missingChecks, approvalStatus };
}

export function isVideoQueueItemApprovedForPublishing(input: {
  contentType: string;
  contentId: string | null;
  queuedVideoUrl: string | null;
  request: VideoPublishRequestSnapshot | null;
}): boolean {
  return inspectVideoQueueItemApproval(input).approved;
}
