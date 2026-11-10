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
