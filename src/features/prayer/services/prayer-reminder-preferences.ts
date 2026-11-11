export type PrayerReminderValues = Record<string, number | null>;

function asReminderRecord(value: unknown): PrayerReminderValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as PrayerReminderValues;
}

/**
 * Push-subscription refreshes only carry enabled/disabled flags (0/null).
 * Preserve an existing per-prayer minute offset when that prayer remains
 * enabled; otherwise a device resume would silently reset saved offsets to 0.
 */
export function mergePrayerReminderPreferences(
  existingValue: unknown,
  requestedValue: PrayerReminderValues,
): PrayerReminderValues {
  const existing = asReminderRecord(existingValue);
  const merged: PrayerReminderValues = {};

  for (const [prayer, requestedOffset] of Object.entries(requestedValue)) {
    if (requestedOffset === null) {
      merged[prayer] = null;
      continue;
    }
    const savedOffset = existing[prayer];
    merged[prayer] = Number.isInteger(savedOffset)
      ? Number(savedOffset)
      : requestedOffset;
  }

  return merged;
}

export function hasEnabledPrayerReminder(value: PrayerReminderValues): boolean {
  return Object.values(value).some(offset => Number.isInteger(offset));
}
