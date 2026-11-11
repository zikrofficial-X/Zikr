export type PrayerKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export interface AzanSettings {
  enabledPrayers: Record<PrayerKey, boolean>;
  audioUnlocked: boolean;
}

const PRAYER_KEYS: readonly PrayerKey[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export const DEFAULT_AZAN_SETTINGS: AzanSettings = {
  enabledPrayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
  audioUnlocked: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function normalizeAzanSettings(value: unknown): AzanSettings {
  const source = asRecord(value);
  const enabledPrayers = asRecord(source.enabledPrayers);
  return {
    enabledPrayers: Object.fromEntries(
      PRAYER_KEYS.map(prayer => [
        prayer,
        typeof enabledPrayers[prayer] === "boolean"
          ? enabledPrayers[prayer]
          : DEFAULT_AZAN_SETTINGS.enabledPrayers[prayer],
      ]),
    ) as Record<PrayerKey, boolean>,
    audioUnlocked: typeof source.audioUnlocked === "boolean"
      ? source.audioUnlocked
      : DEFAULT_AZAN_SETTINGS.audioUnlocked,
  };
}
