export type SalawatInterval = 15 | 30 | 60 | 120 | 0;

export interface QuietHours {
  enabled: boolean;
  from: string;
  to: string;
}

export interface SalawatSettings {
  enabled: boolean;
  intervalMinutes: SalawatInterval;
  quietHours: QuietHours;
}

export const DEFAULT_SALAWAT_SETTINGS: SalawatSettings = {
  enabled: false,
  intervalMinutes: 60,
  quietHours: { enabled: false, from: "22:00", to: "06:00" },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function isSalawatInterval(value: unknown): value is SalawatInterval {
  return typeof value === "number" && [0, 15, 30, 60, 120].includes(value);
}

function isClockTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeSalawatSettings(value: unknown): SalawatSettings {
  const source = asRecord(value);
  const quietHours = asRecord(source.quietHours);
  return {
    enabled: typeof source.enabled === "boolean"
      ? source.enabled
      : DEFAULT_SALAWAT_SETTINGS.enabled,
    intervalMinutes: isSalawatInterval(source.intervalMinutes)
      ? source.intervalMinutes
      : DEFAULT_SALAWAT_SETTINGS.intervalMinutes,
    quietHours: {
      enabled: typeof quietHours.enabled === "boolean"
        ? quietHours.enabled
        : DEFAULT_SALAWAT_SETTINGS.quietHours.enabled,
      from: isClockTime(quietHours.from)
        ? quietHours.from
        : DEFAULT_SALAWAT_SETTINGS.quietHours.from,
      to: isClockTime(quietHours.to)
        ? quietHours.to
        : DEFAULT_SALAWAT_SETTINGS.quietHours.to,
    },
  };
}
