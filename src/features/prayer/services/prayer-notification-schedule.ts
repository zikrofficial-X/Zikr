function datePartsInTimeZone(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const year = Number(values.year);
    const month = Number(values.month);
    const day = Number(values.day);
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day)
    ) {
      return null;
    }
    return { year, month, day };
  } catch {
    return null;
  }
}

export function formatDateInTimeZone(
  date: Date,
  timeZone: string,
): string | null {
  const parts = datePartsInTimeZone(date, timeZone);
  if (!parts) return null;
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function addCalendarDays(
  date: string,
  days: number,
): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || !Number.isInteger(days)) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const base = new Date(Date.UTC(year, month - 1, day));
  if (
    base.getUTCFullYear() !== year ||
    base.getUTCMonth() + 1 !== month ||
    base.getUTCDate() !== day
  ) {
    return null;
  }
  const value = new Date(Date.UTC(year, month - 1, day + days, 12));
  if (Number.isNaN(value.getTime())) return null;
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

export function getZonedDateTime(
  date: string,
  timeZone: string,
  time: string,
): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const validDate = new Date(Date.UTC(year, month - 1, day));
  if (
    validDate.getUTCFullYear() !== year ||
    validDate.getUTCMonth() + 1 !== month ||
    validDate.getUTCDate() !== day
  ) {
    return null;
  }

  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = target;
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date(candidate));
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const rendered = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour),
        Number(values.minute),
      );
      const difference = target - rendered;
      if (difference === 0) return new Date(candidate);
      candidate += difference;
    }
  } catch {
    return null;
  }
  return null;
}

export function getPrayerAlertDateKey(date: Date, timeZone?: string): string {
  const resolvedTimeZone =
    timeZone?.trim() ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  const zonedDate = formatDateInTimeZone(date, resolvedTimeZone);
  if (zonedDate) return zonedDate;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}


/**
 * Select only native prayer alarms that can be safely refreshed.
 * Enabled alarms for a day/prayer whose timing could not be resolved are
 * deliberately preserved; disabled alarms and successfully refreshed alarms
 * are cancelled so the caller can replace or remove them deterministically.
 */
export function getPrayerNotificationIdsToCancel(input: {
  scheduleDays: number;
  prayers: readonly string[];
  enabledPrayers: Readonly<Record<string, boolean>>;
  refreshedPrayerIds: readonly number[];
  idBase: number;
  hasLocation?: boolean;
}): number[] {
  const {
    scheduleDays,
    prayers,
    enabledPrayers,
    refreshedPrayerIds,
    idBase,
    hasLocation = true,
  } = input;
  if (!Number.isInteger(scheduleDays) || scheduleDays <= 0 ||
      !Number.isInteger(idBase) || prayers.length === 0) {
    return [];
  }

  const hasEnabledPrayer = prayers.some(prayer => enabledPrayers[prayer] === true);
  const refreshedIds = new Set(
    refreshedPrayerIds.filter(id => Number.isInteger(id)),
  );
  const ids: number[] = [];

  for (let dayOffset = 0; dayOffset < scheduleDays; dayOffset += 1) {
    for (let prayerIndex = 0; prayerIndex < prayers.length; prayerIndex += 1) {
      const prayer = prayers[prayerIndex];
      const id = idBase + dayOffset * prayers.length + prayerIndex;
      if (
        !hasLocation ||
        !hasEnabledPrayer ||
        enabledPrayers[prayer] !== true ||
        refreshedIds.has(id)
      ) {
        ids.push(id);
      }
    }
  }

  return ids;
}
