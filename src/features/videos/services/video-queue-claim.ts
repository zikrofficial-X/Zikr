export type VideoRequestClaimCandidate = {
  id: string;
  status: string;
  updated_at?: string | null;
  next_retry_at?: string | null;
};

function timestamp(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildVideoRequestClaimFilter(
  candidate: VideoRequestClaimCandidate,
  now: string,
): string | null {
  const id = candidate.id.trim();
  const status = candidate.status;
  const updatedAt = candidate.updated_at?.trim();
  const nowTimestamp = timestamp(now);
  const updatedTimestamp = timestamp(updatedAt);
  if (!id || !updatedAt || nowTimestamp === null || updatedTimestamp === null) return null;
  if (status !== "pending" && status !== "retry_wait") return null;

  const filters = [
    `id=eq.${encodeURIComponent(id)}`,
    `status=eq.${encodeURIComponent(status)}`,
    `updated_at=eq.${encodeURIComponent(updatedAt)}`,
  ];

  if (status === "retry_wait") {
    const nextRetryAt = candidate.next_retry_at?.trim();
    const nextRetryTimestamp = timestamp(nextRetryAt);
    if (!nextRetryAt || nextRetryTimestamp === null || nextRetryTimestamp > nowTimestamp) return null;
    filters.push(`next_retry_at=lte.${encodeURIComponent(now)}`);
  }

  return filters.join("&");
}

export function buildStaleVideoRequestRecoveryFilter(
  id: string,
  updatedAt: string | null | undefined,
  staleBefore: string,
): string | null {
  const normalizedId = id.trim();
  const normalizedUpdatedAt = updatedAt?.trim();
  const updatedTimestamp = timestamp(normalizedUpdatedAt);
  const staleTimestamp = timestamp(staleBefore);
  if (!normalizedId || !normalizedUpdatedAt || updatedTimestamp === null || staleTimestamp === null) return null;
  if (updatedTimestamp >= staleTimestamp) return null;

  return [
    `id=eq.${encodeURIComponent(normalizedId)}`,
    "status=eq.processing",
    "video_url=is.null",
    `updated_at=eq.${encodeURIComponent(normalizedUpdatedAt)}`,
  ].join("&");
}

function isGeneratedCloudinaryVideoUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.includes("/video/upload/");
  } catch {
    return false;
  }
}

export function buildProcessingVideoRequestLeaseFilter(
  id: string,
  updatedAt: string | null | undefined,
  videoUrl: string | null = null,
): string | null {
  const normalizedId = id.trim();
  const normalizedUpdatedAt = updatedAt?.trim();
  const normalizedVideoUrl = videoUrl?.trim() ?? null;
  if (!normalizedId || timestamp(normalizedUpdatedAt) === null) return null;
  if (videoUrl !== null && (!normalizedVideoUrl || !isGeneratedCloudinaryVideoUrl(normalizedVideoUrl))) return null;

  return [
    `id=eq.${encodeURIComponent(normalizedId)}`,
    "status=eq.processing",
    normalizedVideoUrl
      ? `video_url=eq.${encodeURIComponent(normalizedVideoUrl)}`
      : "video_url=is.null",
    `updated_at=eq.${encodeURIComponent(normalizedUpdatedAt!)}`,
  ].join("&");
}

export type VideoSocialQueueRecoveryCandidate = {
  id: string;
  status: string;
  video_url?: string | null;
  updated_at?: string | null;
  content?: Record<string, unknown> | null;
};

/**
 * Claim a completed render whose social-queue handoff is pending, or whose
 * prior handoff worker died while holding the processing marker. The exact
 * row version and media URL make the claim compare-and-set safe.
 */
export function buildVideoSocialQueueRecoveryClaimFilter(
  candidate: VideoSocialQueueRecoveryCandidate,
  staleBefore: string,
): string | null {
  const id = candidate.id.trim();
  const updatedAt = candidate.updated_at?.trim();
  const videoUrl = candidate.video_url?.trim();
  const updatedTimestamp = timestamp(updatedAt);
  const enqueueStatus = candidate.content?.socialQueueEnqueueStatus;
  if (
    !id ||
    (candidate.status !== "processing" && candidate.status !== "retry_wait") ||
    !updatedAt ||
    updatedTimestamp === null ||
    !videoUrl ||
    !isGeneratedCloudinaryVideoUrl(videoUrl) ||
    (enqueueStatus !== "pending" && enqueueStatus !== "processing")
  ) {
    return null;
  }

  if (candidate.status === "processing" && enqueueStatus === "processing") {
    const staleTimestamp = timestamp(staleBefore);
    if (staleTimestamp === null || updatedTimestamp >= staleTimestamp) return null;
  }

  return [
    `id=eq.${encodeURIComponent(id)}`,
    `status=eq.${candidate.status}`,
    `video_url=eq.${encodeURIComponent(videoUrl)}`,
    `updated_at=eq.${encodeURIComponent(updatedAt)}`,
    `content->>socialQueueEnqueueStatus=eq.${enqueueStatus}`,
  ].join("&");
}

/** Lease filter for a social enqueue recovery worker after its atomic claim. */
export function buildVideoSocialQueueRecoveryLeaseFilter(
  id: string,
  videoUrl: string | null | undefined,
  updatedAt: string | null | undefined,
): string | null {
  const normalizedId = id.trim();
  const normalizedVideoUrl = videoUrl?.trim();
  const normalizedUpdatedAt = updatedAt?.trim();
  if (
    !normalizedId ||
    !normalizedVideoUrl ||
    !isGeneratedCloudinaryVideoUrl(normalizedVideoUrl) ||
    timestamp(normalizedUpdatedAt) === null
  ) {
    return null;
  }

  return [
    `id=eq.${encodeURIComponent(normalizedId)}`,
    "status=eq.processing",
    `video_url=eq.${encodeURIComponent(normalizedVideoUrl)}`,
    `updated_at=eq.${encodeURIComponent(normalizedUpdatedAt!)}`,
    "content->>socialQueueEnqueueStatus=eq.processing",
  ].join("&");
}
