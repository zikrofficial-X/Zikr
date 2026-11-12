import { syncYoutubePublishedPostInsights } from "../../src/features/social/services/youtube-post-insights";
import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";
import { syncFacebookReelsInsights } from "../../src/features/social/services/facebook-reels-insights";
import { getFacebookPageProfile } from "../../src/features/social/integrations/facebook";
import { getEnabledSocialPlatforms } from "../../src/features/social/services/platform-availability";
import { getFacebookProfileSyncFailureCount } from "../../src/features/social/services/social-insights-sync-status";
import { isVideoPurgeLockResponseActive } from "../../src/features/videos/services/background-job-settings";
import { recoverPendingVideoSocialQueueEnqueues } from "./template-video-automation";
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
    return isVideoPurgeLockResponseActive(rows);
  } catch (error) {
    console.error("[social-worker] Could not verify the video purge lock; failing closed:", error);
    return true;
  }
}

export async function syncSocialInsights() {
  let facebookProfileLookupFailed = false;
  const facebookProfile = await getFacebookPageProfile().catch((error: unknown) => {
    facebookProfileLookupFailed = true;
    console.error(
      "[social-worker] Facebook Page profile refresh unavailable:",
      error instanceof Error ? error.message : "Unknown Facebook profile error",
    );
    return null;
  });
  const facebookProfileSync = {
    configured: facebookProfile?.configured ?? false,
    stale: facebookProfile?.stale ?? true,
    syncedAt: facebookProfile?.syncedAt ?? null,
    hasLikesCount: facebookProfile?.likesCount !== null && facebookProfile?.likesCount !== undefined,
    hasFollowersCount: facebookProfile?.followersCount !== null && facebookProfile?.followersCount !== undefined,
    error: facebookProfile?.error ?? null,
  };
  console.log("[social-worker] Facebook Page profile sync:", JSON.stringify(facebookProfileSync));

  const facebookInsights = await syncFacebookReelsInsights(25).catch((error: unknown) => {
    console.error(
      "[social-worker] Facebook Reels insights sync unavailable:",
      error instanceof Error ? error.message : "Unknown Meta insights error",
    );
    return { configured: false, candidates: 0, fetched: 0, updated: 0, failed: 1 };
  });
  if (!facebookInsights.configured || facebookInsights.updated > 0 || facebookInsights.failed > 0) {
    console.log("[social-worker] Facebook Reels insights sync:", JSON.stringify(facebookInsights));
  }

  const insights = await syncYoutubePublishedPostInsights(100).catch((error: unknown) => {
    console.error(
      "[social-worker] YouTube public insights sync unavailable:",
      error instanceof Error ? error.message : "Unknown YouTube insights error",
    );
    return { configured: false, candidates: 0, fetched: 0, updated: 0, failed: 1 };
  });

  if (insights.updated > 0) {
    console.log("[social-worker] YouTube public post statistics synced:", JSON.stringify(insights));
  }

  const facebookProfileFailed = getFacebookProfileSyncFailureCount({
    configured: facebookProfileSync.configured,
    stale: facebookProfileSync.stale,
    lookupFailed: facebookProfileLookupFailed,
  });
  return {
    facebookProfileSync,
    facebookInsights,
    youtubeInsights: insights,
    failed: facebookProfileFailed + Number(facebookInsights.failed ?? 0) + Number(insights.failed ?? 0),
  };
}

export async function processSocialPublishQueue(limit = 10) {
  if (await isVideoPurgeInProgress()) {
    console.log("[social-worker] Video purge lock is active; no social queue item will be claimed.");
    return { processed: 0, succeeded: 0, deferred: 0, authBlocked: 0, approvalBlocked: 0, failed: 0, purgeLocked: true };
  }
  // A completed render can outlive the generation toggle. Recover its durable
  // social handoff here as well as in the video worker so the separate social
  // workflow can finish it while new video generation is paused.
  try {
    const handoffRecovery = await recoverPendingVideoSocialQueueEnqueues(Math.max(1, Math.min(10, limit)));
    if (handoffRecovery.recovered > 0 || handoffRecovery.deferred > 0) {
      console.log("[social-worker] Video social handoff recovery:", JSON.stringify(handoffRecovery));
    }
  } catch (error) {
    console.error("[social-worker] Video social handoff recovery is unavailable; continuing existing queue processing:", error);
  }
  // Reconcile deferred staging-cleanup metadata for posts already confirmed
  // on every target. The 48-hour retention worker removes only the redundant
  // Supabase staging copy; the public Cloudinary playback master is never deleted.
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

  return { processed: items.length, succeeded, deferred, authBlocked, approvalBlocked, failed, enabledPlatforms };
}
