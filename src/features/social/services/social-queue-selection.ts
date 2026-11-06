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
    if (eligible.length >= limit) break;
  }

  return eligible;
}
