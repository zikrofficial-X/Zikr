import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fetchAllIdPages, forEachIdPage } from "../../supabase/functions/prayer-notification-worker/pagination";
import { canSchedulePrayerSubscription } from "../../supabase/functions/prayer-notification-worker/eligibility";
import { nextLocalDate } from "../../supabase/functions/prayer-notification-worker/time-zone";

const source = Array.from({ length: 205 }, (_, index) => ({
  id: String(index + 1).padStart(4, "0"),
  value: index + 1,
}));
const cursors: Array<string | null> = [];
const all = await fetchAllIdPages(async (afterId, pageSize) => {
  cursors.push(afterId);
  const start = afterId === null
    ? 0
    : source.findIndex((row) => row.id === afterId) + 1;
  return source.slice(start, start + pageSize);
}, 100);

assert.equal(all.length, 205, "all subscriptions across multiple pages must be returned");
assert.deepEqual(all.map((row) => row.id), source.map((row) => row.id));
assert.deepEqual(cursors, [null, "0100", "0200"], "each page must continue strictly after the last UUID");

const visitedPages: string[][] = [];
const visitedCount = await forEachIdPage(
  async (afterId, pageSize) => {
    const start = afterId === null
      ? 0
      : source.findIndex((row) => row.id === afterId) + 1;
    return source.slice(start, start + pageSize);
  },
  100,
  async page => {
    visitedPages.push(page.map(row => row.id));
  },
);
assert.equal(visitedCount, 205);
assert.deepEqual(visitedPages.map(page => page.length), [100, 100, 5]);
assert.deepEqual(
  visitedPages.flat(),
  source.map(row => row.id),
  "streaming pagination must visit every row in bounded pages without dropping later subscriptions",
);


assert.deepEqual(
  await fetchAllIdPages(async () => [], 100),
  [],
  "an empty first page must return an empty result",
);
await assert.rejects(
  () => fetchAllIdPages(async () => [{ id: "same" }, { id: "same" }], 2),
  /strictly increasing order/,
  "duplicate or non-advancing IDs must fail rather than loop forever",
);
await assert.rejects(
  () => fetchAllIdPages(async () => [{ id: "a" }, { id: "b" }], 1),
  /more rows than requested/,
);
await assert.rejects(
  () => fetchAllIdPages(async () => [], 0),
  /pageSize/,
);

const worker = readFileSync("supabase/functions/prayer-notification-worker/index.ts", "utf8");
assert.match(worker, /forEachIdPage\(/);
assert.match(worker, /canSchedulePrayerSubscription\(/);
assert.match(worker, /preference\.notifications_enabled !== true/);
assert.equal(canSchedulePrayerSubscription(true, undefined), false, "a missing prayer preference must not be treated as opted in");
assert.equal(canSchedulePrayerSubscription(true, null), false, "a null prayer preference must not be treated as opted in");
assert.equal(canSchedulePrayerSubscription(false, { notifications_enabled: true }), false, "a subscription without a default location must not be scheduled");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: false }), false, "disabled prayer notifications must be skipped");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: null }), false, "a null opt-in flag must fail closed");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: true }), true, "only an explicit opt-in may schedule notifications");

assert.equal(
  nextLocalDate(new Date("2026-11-11T12:00:00.000Z"), "Pacific/Kiritimati"),
  "2026-11-13",
  "UTC+14 local calendar advancement must not skip the next day",
);
assert.equal(
  nextLocalDate(new Date("2026-03-08T08:00:00.000Z"), "America/Los_Angeles"),
  "2026-03-09",
  "local calendar advancement must remain correct across daylight-saving transitions",
);
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: true }), true, "configured, opted-in prayer notifications may be scheduled");
assert.match(worker, /.order\("id", \{ ascending: true \}\)/);
assert.match(worker, /query\.gt\("id", afterId\)/);

assert.match(worker, /ensureSubscriptionBatchSchedules\(page, now\)/);
assert.match(worker, /subscriptions: readonly PushSubscriptionRow\[\]/);
assert.match(worker, /\.in\("user_id", userIds\)/);
assert.match(worker, /\.in\("location_id", locationIds\)/);
assert.match(worker, /scheduled \+= await ensureSubscriptionBatchSchedules/);
assert.match(worker, /const timeZone = safeTimeZone\(location\.timezone\)/);
assert.doesNotMatch(worker, /location\.timezone!/);

assert.match(worker, /from\("prayer_preferences"\)/);
assert.match(worker, /from\("prayer_locations"\)/);
assert.match(worker, /from\("background_reminder_preferences"\)/);
assert.match(worker, /enabled !== true/);
assert.match(worker, /!Number\.isInteger\(preference\.prayer_reminders\?\.\[delivery\.prayer_name\]\)/);
assert.match(worker, /inQuietHours\(\s*now,/);
assert.match(worker, /const scheduledAt = new Date\(delivery\.scheduled_at\)/);
assert.match(worker, /inQuietHours\(\s*scheduledAt,/);
assert.match(worker, /status: "cancelled"/);
assert.match(worker, /Background reminder is no longer enabled/);
assert.match(worker, /Prayer reminder is no longer enabled or configured/);


assert.match(worker, /inserts\.slice\(offset, offset \+ BATCH_SIZE\)/);


const reminderMigration = readFileSync(
  "supabase/migrations/20261111010000_background_reminders_respect_quiet_hours_timezone.sql",
  "utf8",
);
const reminderService = readFileSync(
  "src/features/reminders/services/reminder-preferences.ts",
  "utf8",
);
const timezoneUtility = readFileSync("src/lib/timezone.ts", "utf8");
const dhikrHook = readFileSync("src/features/reminders/hooks/use-dhikr-reminder.ts", "utf8");
const salawatHook = readFileSync("src/features/reminders/hooks/use-salawat-reminder.ts", "utf8");
const supabaseTypes = readFileSync("src/lib/types/supabase.ts", "utf8");

assert.match(reminderMigration, /add column if not exists timezone text not null default 'UTC'/);
assert.match(reminderMigration, /left join pg_catalog\.pg_timezone_names/);
assert.match(reminderMigration, /local_clock\.local_time < preferences\.quiet_hours_start/);
assert.match(reminderMigration, /local_clock\.local_time >= preferences\.quiet_hours_end/);
assert.match(reminderMigration, /preferences\.quiet_hours_start = preferences\.quiet_hours_end/);
assert.match(
  reminderMigration,
  /else\s+local_clock\.local_time\s*<\s*preferences\.quiet_hours_start\s+and\s+local_clock\.local_time\s*>=\s*preferences\.quiet_hours_end/i,
  "overnight quiet hours must schedule only outside the quiet window",
);
assert.doesNotMatch(
  reminderMigration,
  /else\s+local_clock\.local_time\s*>=\s*preferences\.quiet_hours_start\s+or\s+local_clock\.local_time\s*<\s*preferences\.quiet_hours_end/i,
  "overnight quiet hours must not schedule during the quiet window",
);
const isOutsideQuietHours = (minute: number, start: number, end: number) =>
  start === end
    ? true
    : start < end
      ? minute < start || minute >= end
      : minute < start && minute >= end;
assert.equal(isOutsideQuietHours(23 * 60, 22 * 60, 7 * 60), false, "23:00 is inside overnight quiet hours");
assert.equal(isOutsideQuietHours(6 * 60 + 30, 22 * 60, 7 * 60), false, "06:30 is inside overnight quiet hours");
assert.equal(isOutsideQuietHours(7 * 60 + 30, 22 * 60, 7 * 60), true, "07:30 is outside overnight quiet hours");
assert.equal(isOutsideQuietHours(21 * 60 + 30, 22 * 60, 7 * 60), true, "21:30 is outside overnight quiet hours");
assert.match(reminderMigration, /grant execute on function public\.plan_background_reminder_deliveries\(timestamptz\)\s+to service_role/i);
assert.doesNotMatch(reminderMigration, /grant execute on function public\.plan_background_reminder_deliveries\(timestamptz\)\s+to (?:public|anon|authenticated)/i);
assert.match(reminderService, /normalizeIanaTimeZone\(body\.timezone\)/);
assert.match(
  reminderService,
  /\.upsert\(payload,[\s\S]*?\.select\(\s*"user_id,dhikr_enabled,dhikr_interval_minutes,salawat_enabled,salawat_interval_minutes,quran_enabled,quran_time,quran_message,quiet_hours_start,quiet_hours_end,timezone,updated_at"/,
  "reminder updates must return the complete preference contract, including Quran settings",
);
assert.match(timezoneUtility, /Intl\.DateTimeFormat\("en-US",\s*\{\s*timeZone:/);
assert.match(reminderService, /updates\.timezone = timezone/);
assert.match(reminderService, /quiet_hours_end,timezone,updated_at/);
assert.match(dhikrHook, /timezone: Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone \|\| "UTC"/);
assert.match(salawatHook, /timezone: Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone \|\| "UTC"/);
const reminderTypesStart = supabaseTypes.indexOf("background_reminder_preferences: {");
const reminderTypesEnd = supabaseTypes.indexOf("battle_events:", reminderTypesStart);
assert.ok(reminderTypesStart >= 0 && reminderTypesEnd > reminderTypesStart);
assert.match(supabaseTypes.slice(reminderTypesStart, reminderTypesEnd), /timezone: string/);
assert.match(supabaseTypes.slice(reminderTypesStart, reminderTypesEnd), /timezone\?: string/);

console.log("Prayer notification subscription pagination contracts passed.");
