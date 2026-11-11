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
