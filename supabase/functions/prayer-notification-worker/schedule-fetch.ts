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
