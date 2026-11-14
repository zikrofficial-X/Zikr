export function canSchedulePrayerSubscription(
  hasLocation: boolean,
  preference: { notifications_enabled: boolean | null } | null | undefined,
): boolean {
  return hasLocation && preference != null && preference.notifications_enabled === true;
}

export function isDeliverySubscriptionOwnerValid(
  deliveryUserId: string,
  subscriptionUserId: string,
): boolean {
  const deliveryOwner = deliveryUserId.trim();
  return deliveryOwner.length > 0 && deliveryOwner === subscriptionUserId.trim();
}


/**
 * Prevent delayed worker runs from delivering obsolete notifications in a burst.
 * The caller supplies the grace window appropriate to the notification kind.
 */
export function isDeliveryWithinGraceWindow(
  scheduledAt: string,
  now: Date,
  maxDelayMs: number,
): boolean {
  const scheduledAtMs = Date.parse(scheduledAt);
  const nowMs = now.getTime();
  return (
    Number.isFinite(scheduledAtMs) &&
    Number.isFinite(nowMs) &&
    Number.isFinite(maxDelayMs) &&
    maxDelayMs >= 0 &&
    nowMs >= scheduledAtMs &&
    nowMs - scheduledAtMs <= maxDelayMs
  );
}
