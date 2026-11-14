export function normalizePrayerTimings(
  value: unknown,
  requiredPrayers: readonly string[],
): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const timings: Record<string, string> = {};

  for (const prayer of requiredPrayers) {
    const raw = record[prayer];
    if (typeof raw !== "string") return null;
    const normalized = raw.trim();
    const match = /^(\d{1,2}):([0-5]\d)(?:\s|$)/.exec(normalized);
    if (!match || Number(match[1]) > 23) return null;
    timings[prayer] = normalized;
  }

  return timings;
}

export async function fetchScheduleOrSkip<T>(
  key: string,
  failedKeys: Set<string>,
  fetchSchedule: () => Promise<T>,
  onFailure: (key: string, error: unknown) => void,
): Promise<T | null> {
  if (failedKeys.has(key)) return null;

  try {
    return await fetchSchedule();
  } catch (error) {
    failedKeys.add(key);
    onFailure(key, error);
    return null;
  }
}
