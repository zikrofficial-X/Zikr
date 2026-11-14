import { TOTAL_AYAHS } from "@/features/quran/utils/quran-progress";

export type WirdProgressState = {
  dailyTarget: number;
  position: number;
  khatmaCount: number;
  todayCount: number;
  todayDate: string;
  streak: number;
  lastStreakDate: string;
};

export const DEFAULT_WIRD_PROGRESS_STATE: WirdProgressState = {
  dailyTarget: 20,
  position: 0,
  khatmaCount: 0,
  todayCount: 0,
  todayDate: "",
  streak: 0,
  lastStreakDate: "",
};

const MAX_COUNTER = 1_000_000;

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

function isIsoDateOrEmpty(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Normalize untrusted localStorage and JSONB values before they reach progress
 * arithmetic or are written back to the account-scoped reading_progress row.
 * Missing fields from older clients receive defaults; malformed supplied fields
 * reject the whole state so corrupted counters cannot mark the Quran complete.
 */
export function normalizeWirdProgressState(value: unknown): WirdProgressState | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const read = (key: keyof WirdProgressState, fallback: unknown): unknown =>
    Object.prototype.hasOwnProperty.call(input, key) ? input[key] : fallback;

  const dailyTarget = read("dailyTarget", DEFAULT_WIRD_PROGRESS_STATE.dailyTarget);
  const position = read("position", DEFAULT_WIRD_PROGRESS_STATE.position);
  const khatmaCount = read("khatmaCount", DEFAULT_WIRD_PROGRESS_STATE.khatmaCount);
  const todayCount = read("todayCount", DEFAULT_WIRD_PROGRESS_STATE.todayCount);
  const todayDate = read("todayDate", DEFAULT_WIRD_PROGRESS_STATE.todayDate);
  const streak = read("streak", DEFAULT_WIRD_PROGRESS_STATE.streak);
  const lastStreakDate = read("lastStreakDate", DEFAULT_WIRD_PROGRESS_STATE.lastStreakDate);

  if (!isIntegerInRange(dailyTarget, 1, TOTAL_AYAHS)) return null;
  if (!isIntegerInRange(position, 0, TOTAL_AYAHS)) return null;
  if (!isIntegerInRange(khatmaCount, 0, MAX_COUNTER)) return null;
  if (!isIntegerInRange(todayCount, 0, MAX_COUNTER)) return null;
  if (!isIsoDateOrEmpty(todayDate) || !isIsoDateOrEmpty(lastStreakDate)) return null;
  if (!isIntegerInRange(streak, 0, MAX_COUNTER)) return null;

  return { dailyTarget, position, khatmaCount, todayCount, todayDate, streak, lastStreakDate };
}
