import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
} from "../../src/features/social/services/social-publishing";

export async function processSocialPublishQueue(limit = 10) {
  const items = await claimPendingSocialPublishItems(limit);
  let succeeded = 0;
  let authBlocked = 0;
  let failed = 0;

  for (const item of items) {
    const outcome = await processSocialPublishItem(item, { alreadyClaimed: true });
    if (outcome === "published") succeeded += 1;
    else if (outcome === "auth_blocked") authBlocked += 1;
    else failed += 1;
  }

  return { processed: items.length, succeeded, authBlocked, failed };
}
