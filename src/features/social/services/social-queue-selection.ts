import { isVideoContentType } from "@/features/videos/services/video-publish-approval";
import {
  canAttemptSocialPlatform,
  type SocialPlatform,
} from "@/features/social/services/platform-availability";

export type SocialQueueSelectionCandidate = {
  id: string;
  content_type: string;
  target_platforms: readonly SocialPlatform[];
  metadata: Record<string, unknown> | null;
};

/** Build an atomic queue claim filter that rechecks the due time at update time. */
export function buildDueSocialQueueClaimFilter(
  id: string,
  status: string,
  now: string,
): string {
  return `id=eq.${encodeURIComponent(id)}&status=eq.${encodeURIComponent(status)}&or=(scheduled_at.is.null,scheduled_at.lte.${encodeURIComponent(now)})`;
}

/**
 * Build an atomic lease filter for a queue worker. A worker may advance a row
 * only while both its status and the exact updated_at version still match the
 * claim it received; stale recovery or a newer worker therefore wins safely.
 */
export function buildSocialPublishLeaseFilter(
  id: string,
  expectedStatus: string,
  expectedUpdatedAt: string,
): string {
  if (!id.trim()) throw new Error("Social publish lease filter requires a queue item ID.");
  if (!Number.isFinite(Date.parse(expectedUpdatedAt))) {
    throw new Error("Social publish lease filter requires a valid updated_at timestamp.");
  }
  return [
    `id=eq.${encodeURIComponent(id)}`,
    `status=eq.${encodeURIComponent(expectedStatus)}`,
    `updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
  ].join("&");
}

/** Merge bounded query pages while preserving priority and removing duplicate queue IDs. */
export function mergeUniqueSocialPublishCandidates<
  const Batches extends readonly (readonly { id: string }[])[]
>(
  ...batches: Batches
): Array<Batches[number][number]> {
  const byId = new Map<string, Batches[number][number]>();
  for (const batch of batches) {
    for (const item of batch) {
      if (item && typeof item.id === "string" && item.id.trim()) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

export function selectEligibleSocialPublishItems<T extends SocialQueueSelectionCandidate>(
  candidates: readonly T[],
  options: {
    enabledPlatforms: readonly SocialPlatform[];
    approvedVideoQueueItemIds: ReadonlySet<string>;
    maxAttemptsFor: (metadata: Record<string, unknown> | null) => number;
    limit: number;
  },
): T[] {
  const limit = Math.max(0, Math.floor(options.limit));
  if (limit === 0) return [];

  const eligible: T[] = [];
  for (const item of candidates) {
    if (item.metadata?.sourceMediaMissing === true) continue;
    const maxAttempts = options.maxAttemptsFor(item.metadata);
    const hasRunnableTarget = item.target_platforms.some((platform) =>
      canAttemptSocialPlatform({
        platform,
        enabledPlatforms: options.enabledPlatforms,
        metadata: item.metadata,
        maxAttempts,
      }),
    );
    if (!hasRunnableTarget) continue;
    if (
      isVideoContentType(item.content_type) &&
      !options.approvedVideoQueueItemIds.has(item.id)
    ) {
      continue;
    }

    eligible.push(item);
  }

  // Reserve one slot for an eligible non-video post when video retries fill
  // the front of the queue. This prevents written Facebook posts from being
  // perpetually deferred behind a recurring Reels cooldown backlog.
  const firstNonVideoIndex = eligible.findIndex(
    (item) => !isVideoContentType(item.content_type),
  );
  if (firstNonVideoIndex >= limit) {
    const [nonVideoItem] = eligible.splice(firstNonVideoIndex, 1);
    if (nonVideoItem) eligible.unshift(nonVideoItem);
  }

  return eligible.slice(0, limit);
}
