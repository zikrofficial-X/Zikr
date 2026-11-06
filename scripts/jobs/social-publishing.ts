import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
  retryPendingPublishedVideoCleanup,
} from "../../src/features/social/services/social-publishing";

export async function processSocialPublishQueue(limit = 10) {
  // Retry media cleanup for posts already confirmed on every target before
  // claiming new work. This removes temporary Supabase/Cloudinary assets
  // without republishing or deleting the publication/audit records.
  const cleanup = await retryPendingPublishedVideoCleanup(Math.max(25, Math.min(100, limit * 2)));
  if (cleanup.attempted > 0) {
    console.log("[social-worker] Published media cleanup retry:", JSON.stringify(cleanup));
  }
  const items = await claimPendingSocialPublishItems(limit);
  let succeeded = 0;
  let deferred = 0;
  let authBlocked = 0;
  let approvalBlocked = 0;
  let failed = 0;

  for (const item of items) {
    const outcome = await processSocialPublishItem(item, { alreadyClaimed: true });
    if (outcome === "published") succeeded += 1;
    else if (outcome === "deferred") deferred += 1;
    else if (outcome === "auth_blocked") authBlocked += 1;
    else if (outcome === "approval_blocked") approvalBlocked += 1;
    else failed += 1;
  }

  const insights = await syncYoutubePublishedPostInsights(Math.max(50, Math.min(250, limit * 10))).catch((error) => {
    console.error("[social-worker] YouTube public insights sync unavailable:", error instanceof Error ? error.message : String(error));
    return { configured: false, candidates: 0, fetched: 0, updated: 0 };
  });

  if (insights.updated > 0) {
    console.log("[social-worker] YouTube public post statistics synced:", JSON.stringify(insights));
  }

  return { processed: items.length, succeeded, deferred, authBlocked, approvalBlocked, failed, insights };
}
