export function nextLocalDate(date: Date, timeZone: string): string {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError("A valid date is required.");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error("Could not resolve the local calendar date.");
  }

  // Advance the calendar date in UTC. Re-formatting a noon-UTC timestamp in
  // a UTC+14 zone would already be the following local day and skip a date.
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export type NotificationKind = "prayer" | "dhikr" | "salawat";

/**
 * Web Push topics replace outstanding messages for the same subscription.
 * Keep each scheduled delivery distinct while staying inside RFC 8030's
 * 32-character URL-safe Topic limit.
 */
export function buildNotificationTopic(input: {
  notificationKind: NotificationKind;
  prayerName: string;
  scheduledAt: string;
}): string {
  const instant = new Date(input.scheduledAt);
  if (!Number.isFinite(instant.getTime())) {
    throw new RangeError("A valid scheduledAt timestamp is required.");
  }

  const timestamp = [
    String(instant.getUTCFullYear()).padStart(4, "0"),
    String(instant.getUTCMonth() + 1).padStart(2, "0"),
    String(instant.getUTCDate()).padStart(2, "0"),
    String(instant.getUTCHours()).padStart(2, "0"),
    String(instant.getUTCMinutes()).padStart(2, "0"),
  ].join("");
  const prayerName = input.prayerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 7);
  if (input.notificationKind === "prayer" && !prayerName) {
    throw new Error("A prayer name is required for prayer notification topics.");
  }

  const topic = `zikr-${input.notificationKind}${input.notificationKind === "prayer" ? `-${prayerName}` : ""}-${timestamp}`;
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(topic)) {
    throw new RangeError("Web Push topic must contain at most 32 URL-safe characters.");
  }
  return topic;
}


/**
 * Resolve a local wall-clock time in an IANA zone. Nonexistent times during
 * a DST spring-forward gap return null rather than being shifted to a
 * different prayer time.
 */
export function zonedDateTime(
  dateString: string,
  timeZone: string,
  time: string,
): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
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
  ) return null;

  const validDate = new Date(Date.UTC(year, month - 1, day));
  if (
    validDate.getUTCFullYear() !== year ||
    validDate.getUTCMonth() + 1 !== month ||
    validDate.getUTCDate() !== day
  ) return null;

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
      const value = (type: string) =>
        Number(parts.find(part => part.type === type)?.value ?? 0);
      const rendered = Date.UTC(
        value("year"),
        value("month") - 1,
        value("day"),
        value("hour"),
        value("minute"),
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

/** Return the previous calendar date in an IANA timezone without UTC+14/DST drift. */
export function previousLocalDate(date: Date, timeZone: string): string {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError("A valid date is required.");
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error("Could not resolve the local calendar date.");
  }
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return [
    previous.getUTCFullYear(),
    String(previous.getUTCMonth() + 1).padStart(2, "0"),
    String(previous.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** Check a queued prayer reminder against the current prayer time and offset. */
export function isCurrentPrayerReminderSchedule(input: {
  scheduledAt: string;
  prayerAt: Date;
  offsetMinutes: unknown;
  toleranceMs?: number;
}): boolean {
  const scheduledTime = new Date(input.scheduledAt).getTime();
  const prayerTime = input.prayerAt.getTime();
  const tolerance = input.toleranceMs ?? 1_000;
  if (
    !Number.isFinite(scheduledTime) ||
    !Number.isFinite(prayerTime) ||
    !Number.isInteger(input.offsetMinutes) ||
    !Number.isFinite(tolerance) ||
    tolerance < 0
  ) {
    return false;
  }
  const expectedTime = prayerTime + Number(input.offsetMinutes) * 60_000;
  return Math.abs(scheduledTime - expectedTime) <= tolerance;
}

/** Background reminder intervals are anchored to UTC midnight by the SQL planner. */
export function isCurrentIntervalReminderSlot(
  scheduledAt: string,
  intervalMinutes: unknown,
): boolean {
  const scheduledTime = new Date(scheduledAt).getTime();
  if (
    !Number.isFinite(scheduledTime) ||
    !Number.isInteger(intervalMinutes) ||
    Number(intervalMinutes) <= 0
  ) {
    return false;
  }
  const instant = new Date(scheduledTime);
  const utcDayStart = Date.UTC(
    instant.getUTCFullYear(),
    instant.getUTCMonth(),
    instant.getUTCDate(),
  );
  const elapsedMinutes = (scheduledTime - utcDayStart) / 60_000;
  return Number.isInteger(elapsedMinutes) && elapsedMinutes % Number(intervalMinutes) === 0;
}
