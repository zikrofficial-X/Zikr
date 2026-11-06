import { syncYoutubePublishedPostInsights } from "../../src/features/social/services/youtube-post-insights";
import { syncFacebookReelsInsights } from "../../src/features/social/services/facebook-reels-insights";
import { getEnabledSocialPlatforms } from "../../src/features/social/services/platform-availability";
import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
  retryPendingPublishedVideoCleanup,
} from "../../src/features/social/services/social-publishing";

export async function syncSocialInsights() {
  // Insights collection is deliberately independent from public publishing.
  // Both writers persist to social_post_insights and never mutate publish queue rows.
  const facebookInsights = await syncFacebookReelsInsights(25).catch((error: unknown) => {
    console.error(
      "[social-worker] Facebook Reels insights sync unavailable:",
      error instanceof Error ? error.message : "Unknown Meta insights error",
    );
    return { configured: false, reason: "connection_unavailable" as const, candidates: 0, fetched: 0, updated: 0, failed: 0 };
  });

  const youtubeInsights = await syncYoutubePublishedPostInsights(100).catch((error: unknown) => {
    console.error(
      "[social-worker] YouTube public insights sync unavailable:",
      error instanceof Error ? error.message : "Unknown YouTube insights error",
    );
    return { configured: false, candidates: 0, fetched: 0, updated: 0 };
  });

  if (facebookInsights.updated > 0 || facebookInsights.failed > 0 || !facebookInsights.configured) {
    console.log("[social-worker] Facebook Reels insights sync:", JSON.stringify(facebookInsights));
  }
  if (youtubeInsights.updated > 0 || !youtubeInsights.configured) {
    console.log("[social-worker] YouTube public post statistics sync:", JSON.stringify(youtubeInsights));
  }

  return { facebookInsights, youtubeInsights };
}

export async function processSocialPublishQueue(limit = 10) {
  // Retry media cleanup for posts already confirmed on every target before
  // claiming new work. This removes temporary assets without republishing.
  const cleanup = await retryPendingPublishedVideoCleanup(Math.max(25, Math.min(100, limit * 2)));
  if (cleanup.attempted > 0) {
    console.log("[social-worker] Published media cleanup retry:", JSON.stringify(cleanup));
  }

  const enabledPlatforms = getEnabledSocialPlatforms(process.env);
  const items = enabledPlatforms.length > 0
    ? await claimPendingSocialPublishItems(limit, enabledPlatforms)
    : [];
  let succeeded = 0;
  let deferred = 0;
  let authBlocked = 0;
  let approvalBlocked = 0;
  let failed = 0;

  for (const item of items) {
    const outcome = await processSocialPublishItem(item, { alreadyClaimed: true, enabledPlatforms });
    if (outcome === "published") succeeded += 1;
    else if (outcome === "deferred") deferred += 1;
    else if (outcome === "auth_blocked") authBlocked += 1;
    else if (outcome === "approval_blocked") approvalBlocked += 1;
    else failed += 1;
  }

  return {
    processed: items.length,
    succeeded,
    deferred,
    authBlocked,
    approvalBlocked,
    failed,
    enabledPlatforms,
  };
}
