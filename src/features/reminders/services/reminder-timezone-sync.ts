import { normalizeIanaTimeZone } from "../../../lib/timezone";

type ReminderTimeZoneSyncOptions = {
  userId: string;
  serverTimeZone?: unknown;
  deviceTimeZone?: unknown;
  fetcher?: typeof fetch;
};

type InFlightReminderTimeZoneSync = {
  deviceTimeZone: string;
  promise: Promise<boolean>;
};

const inFlightSyncs = new Map<string, InFlightReminderTimeZoneSync>();

async function syncReminderTimeZoneOnce(
  deviceTimeZone: string,
  fetcher: typeof fetch,
  serverTimeZone?: unknown,
  useProvidedServerTimeZone = false,
): Promise<boolean> {
  try {
    let currentServerTimeZone = serverTimeZone;
    if (!useProvidedServerTimeZone) {
      const response = await fetcher("/api/reminders/background", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return false;
      const payload = await response.json().catch(() => null);
      currentServerTimeZone =
        payload && typeof payload === "object" && !Array.isArray(payload)
          ? (payload as Record<string, unknown>).timezone
          : undefined;
    }

    if (normalizeIanaTimeZone(currentServerTimeZone) === deviceTimeZone) return true;

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
  } catch {
    return false;
  }
}

/**
 * Keep the account-level background reminder timezone aligned with the active
 * device. The server uses this value to enforce quiet hours while the app is
 * closed, so syncs are serialized per user and the latest device timezone wins.
 */
export async function syncBackgroundReminderTimeZone(
  options: ReminderTimeZoneSyncOptions,
): Promise<boolean> {
  const userId = options.userId.trim();
  let requestedDeviceTimeZone: unknown;
  try {
    requestedDeviceTimeZone = Object.prototype.hasOwnProperty.call(options, "deviceTimeZone")
      ? options.deviceTimeZone
      : Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return false;
  }
  const deviceTimeZone = normalizeIanaTimeZone(requestedDeviceTimeZone);
  if (!userId || !deviceTimeZone) return false;

  const existing = inFlightSyncs.get(userId);
  if (existing?.deviceTimeZone === deviceTimeZone) return existing.promise;

  const fetcher = options.fetcher ?? fetch;
  const hasProvidedServerTimeZone = Object.prototype.hasOwnProperty.call(options, "serverTimeZone");
  const pending = existing
    ? existing.promise
        .catch(() => false)
        .then(() => syncReminderTimeZoneOnce(deviceTimeZone, fetcher))
    : syncReminderTimeZoneOnce(
        deviceTimeZone,
        fetcher,
        options.serverTimeZone,
        hasProvidedServerTimeZone,
      );
  const entry = { deviceTimeZone, promise: pending };
  inFlightSyncs.set(userId, entry);
  try {
    return await pending;
  } finally {
    if (inFlightSyncs.get(userId) === entry) inFlightSyncs.delete(userId);
  }
}
