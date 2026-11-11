export function canSchedulePrayerSubscription(
  hasLocation: boolean,
  preference: { notifications_enabled: boolean | null } | null | undefined,
): boolean {
  return hasLocation && preference != null && preference.notifications_enabled === true;
}
