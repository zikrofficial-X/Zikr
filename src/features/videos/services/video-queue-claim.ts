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

export function buildProcessingVideoRequestLeaseFilter(
  id: string,
  updatedAt: string | null | undefined,
): string | null {
  const normalizedId = id.trim();
  const normalizedUpdatedAt = updatedAt?.trim();
  if (!normalizedId || timestamp(normalizedUpdatedAt) === null) return null;

  return [
    `id=eq.${encodeURIComponent(normalizedId)}`,
    "status=eq.processing",
    "video_url=is.null",
    `updated_at=eq.${encodeURIComponent(normalizedUpdatedAt!)}`,
  ].join("&");
}
