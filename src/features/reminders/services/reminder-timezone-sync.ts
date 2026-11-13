import { normalizeIanaTimeZone } from "../../../lib/timezone";

type ReminderTimeZoneSyncOptions = {
  userId: string;
  serverTimeZone?: unknown;
  deviceTimeZone?: unknown;
  fetcher?: typeof fetch;
};

const inFlightSyncs = new Map<string, Promise<boolean>>();

/**
 * Keep the account-level background reminder timezone aligned with the active
 * device. The server uses this value to enforce quiet hours while the app is
 * closed, so it must be refreshed when the user signs in or resumes the app.
 */
export async function syncBackgroundReminderTimeZone(
  options: ReminderTimeZoneSyncOptions,
): Promise<boolean> {
  const userId = options.userId.trim();
  const deviceTimeZone = normalizeIanaTimeZone(
    Object.prototype.hasOwnProperty.call(options, "deviceTimeZone")
      ? options.deviceTimeZone
      : Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  if (!userId || !deviceTimeZone) return false;

  const key = `${userId}:${deviceTimeZone}`;
  const existing = inFlightSyncs.get(key);
  if (existing) return existing;

  const fetcher = options.fetcher ?? fetch;
  const pending = (async () => {
    let serverTimeZone: unknown;
    if (Object.prototype.hasOwnProperty.call(options, "serverTimeZone")) {
      serverTimeZone = options.serverTimeZone;
    } else {
      const response = await fetcher("/api/reminders/background", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return false;
      const payload = await response.json().catch(() => null);
      serverTimeZone =
        payload && typeof payload === "object" && !Array.isArray(payload)
          ? (payload as Record<string, unknown>).timezone
          : undefined;
    }

    if (normalizeIanaTimeZone(serverTimeZone) === deviceTimeZone) return true;

    const response = await fetcher("/api/reminders/background", {
      method: "PUT",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timezone: deviceTimeZone }),
    });
    return response.ok;
  })().catch(() => false);

  inFlightSyncs.set(key, pending);
  try {
    return await pending;
  } finally {
    if (inFlightSyncs.get(key) === pending) inFlightSyncs.delete(key);
  }
}
