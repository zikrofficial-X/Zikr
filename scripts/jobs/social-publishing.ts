import { syncYoutubePublishedPostInsights } from "../../src/features/social/services/youtube-post-insights";
import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";
import { syncFacebookReelsInsights } from "../../src/features/social/services/facebook-reels-insights";
import { getEnabledSocialPlatforms } from "../../src/features/social/services/platform-availability";
import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
  retryPendingPublishedVideoCleanup,
} from "../../src/features/social/services/social-publishing";

async function isVideoPurgeInProgress(): Promise<boolean> {
  try {
    const rows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
      "/rest/v1/admin_settings?key=eq.video_purge_in_progress&select=value&limit=1",
    );
    return rows?.[0]?.value === true;
  } catch (error) {
    console.error("[social-worker] Could not verify the video purge lock; failing closed:", error);
    return true;
  }
}

export async function processSocialPublishQueue(limit = 10) {
  if (await isVideoPurgeInProgress()) {
    console.log("[social-worker] Video purge lock is active; no social queue item will be claimed.");
    return { processed: 0, succeeded: 0, deferred: 0, authBlocked: 0, approvalBlocked: 0, failed: 0, purgeLocked: true };
  }
  // Retry media cleanup for posts already confirmed on every target before
  // claiming new work. This removes temporary Supabase/Cloudinary assets
  // without republishing or deleting the publication/audit records.
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

  const facebookInsights = await syncFacebookReelsInsights(25).catch((error: unknown) => {
    console.error("[social-worker] Facebook Reels insights sync unavailable:", error instanceof Error ? error.message : "Unknown Meta insights error");
    return { configured: false, candidates: 0, fetched: 0, updated: 0, failed: 0 };
  });
  if (!facebookInsights.configured || facebookInsights.updated > 0 || facebookInsights.failed > 0) {
    console.log("[social-worker] Facebook Reels insights sync:", JSON.stringify(facebookInsights));
  }

  const insights = await syncYoutubePublishedPostInsights(Math.max(50, Math.min(250, limit * 10))).catch((error: unknown) => {
    console.error("[social-worker] YouTube public insights sync unavailable:", error instanceof Error ? error.message : String(error));
    return { configured: false, candidates: 0, fetched: 0, updated: 0 };
  });

  if (insights.updated > 0) {
    console.log("[social-worker] YouTube public post statistics synced:", JSON.stringify(insights));
  }

  return { processed: items.length, succeeded, deferred, authBlocked, approvalBlocked, failed, enabledPlatforms, insights, facebookInsights };
}
