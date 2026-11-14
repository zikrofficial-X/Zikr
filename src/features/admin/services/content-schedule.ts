export function formatLocalDateTimeInputValue(
  date: Date,
  timezoneOffsetMinutes = date.getTimezoneOffset(),
): string {
  if (
    !Number.isFinite(date.getTime()) ||
    !Number.isInteger(timezoneOffsetMinutes) ||
    Math.abs(timezoneOffsetMinutes) > 14 * 60
  ) {
    return "";
  }

  const localWallClock = new Date(date.getTime() - timezoneOffsetMinutes * 60_000);
  return localWallClock.toISOString().slice(0, 16);
}

export function getLocalDateTimeOffsetMinutes(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const localDate = new Date(value.trim());
  if (
    !Number.isFinite(localDate.getTime()) ||
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day ||
    localDate.getHours() !== hour ||
    localDate.getMinutes() !== minute
  ) {
    // Browsers normalize wall-clock values that fall inside a DST gap.
    // Reject them rather than silently scheduling a different local time.
    return null;
  }

  const offset = localDate.getTimezoneOffset();
  return Number.isInteger(offset) && Math.abs(offset) <= 14 * 60 ? offset : null;
}

export function localDateTimeToUtcIso(
  value: string,
  timezoneOffsetMinutes: number,
): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match || !Number.isInteger(timezoneOffsetMinutes) || Math.abs(timezoneOffsetMinutes) > 14 * 60) {
    return null;
  }

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;

  const localWallClock = new Date(0);
  localWallClock.setUTCFullYear(year, month - 1, day);
  localWallClock.setUTCHours(hour, minute, 0, 0);
  if (
    localWallClock.getUTCFullYear() !== year ||
    localWallClock.getUTCMonth() !== month - 1 ||
    localWallClock.getUTCDate() !== day ||
    localWallClock.getUTCHours() !== hour ||
    localWallClock.getUTCMinutes() !== minute
  ) {
    return null;
  }

  const utcDate = new Date(localWallClock.getTime() + timezoneOffsetMinutes * 60_000);
  return Number.isFinite(utcDate.getTime()) ? utcDate.toISOString() : null;
}

export function parseExplicitScheduledAt(value: string): Date | null {
  const normalized = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/i.exec(normalized);
  if (!match) return null;

  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null;

  const offset = match[7].toUpperCase();
  if (offset !== "Z") {
    const offsetMatch = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
    if (!offsetMatch) return null;
    const offsetHours = Number(offsetMatch[2]);
    const offsetMinutes = Number(offsetMatch[3]);
    if (offsetMinutes > 59 || offsetHours > 14 || (offsetHours === 14 && offsetMinutes !== 0)) return null;
  }

  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  calendarDate.setUTCHours(hour, minute, second, 0);
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    calendarDate.getUTCHours() !== hour ||
    calendarDate.getUTCMinutes() !== minute ||
    calendarDate.getUTCSeconds() !== second
  ) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}
