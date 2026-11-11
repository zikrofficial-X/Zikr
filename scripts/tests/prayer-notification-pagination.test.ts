import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fetchAllIdPages, forEachIdPage } from "../../supabase/functions/prayer-notification-worker/pagination";
import { canSchedulePrayerSubscription, isDeliverySubscriptionOwnerValid } from "../../supabase/functions/prayer-notification-worker/eligibility";
import { buildNotificationTopic, nextLocalDate, zonedDateTime } from "../../supabase/functions/prayer-notification-worker/time-zone";

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
const staleRecoveryStart = worker.indexOf("async function recoverStaleClaims");
const staleRecoveryEnd = worker.indexOf("async function claimDueDeliveries", staleRecoveryStart);
const staleRecovery = worker.slice(staleRecoveryStart, staleRecoveryEnd);
assert.ok(staleRecoveryStart >= 0 && staleRecoveryEnd > staleRecoveryStart);
assert.match(staleRecovery, /\.lt\("attempt_count", 3\)/,
  "stale claims below the retry budget may be retried once the backoff expires");
assert.match(staleRecovery, /\.gte\("attempt_count", 3\)/,
  "stale claims at the retry budget must be selected for terminal handling");
assert.match(staleRecovery, /status: "cancelled"/,
  "stale claims that exhaust the retry budget must not cycle forever");
assert.match(staleRecovery, /Stale worker claim exhausted retry budget; manual review required/);

assert.match(worker, /forEachIdPage\(/);
assert.match(worker, /canSchedulePrayerSubscription\(/);
assert.match(worker, /preference\.notifications_enabled !== true/);
assert.match(worker, /isDeliverySubscriptionOwnerValid\(delivery\.user_id, subscription\.user_id\)/);
assert.match(worker, /Subscription owner does not match delivery owner/);
const subscriptionOwnershipGuard = worker.indexOf("isDeliverySubscriptionOwnerValid(delivery.user_id, subscription.user_id)");
const pushDelivery = worker.indexOf(".pushTextMessage(");
assert.ok(subscriptionOwnershipGuard >= 0 && pushDelivery > subscriptionOwnershipGuard, "subscription ownership must be validated before any push is sent");
assert.equal(canSchedulePrayerSubscription(true, undefined), false, "a missing prayer preference must not be treated as opted in");
assert.equal(canSchedulePrayerSubscription(true, null), false, "a null prayer preference must not be treated as opted in");
assert.equal(canSchedulePrayerSubscription(false, { notifications_enabled: true }), false, "a subscription without a default location must not be scheduled");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: false }), false, "disabled prayer notifications must be skipped");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: null }), false, "a null opt-in flag must fail closed");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: true }), true, "only an explicit opt-in may schedule notifications");
assert.equal(isDeliverySubscriptionOwnerValid("user-1", "user-1"), true, "a delivery may target only its owner's active subscription");
assert.equal(isDeliverySubscriptionOwnerValid("user-1", "user-2"), false, "a mismatched subscription owner must be rejected");
assert.equal(isDeliverySubscriptionOwnerValid("", "user-1"), false, "an empty delivery owner must fail closed");

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

assert.equal(
  zonedDateTime("2026-03-08", "America/Los_Angeles", "01:30")?.toISOString(),
  "2026-03-08T09:30:00.000Z",
  "valid local times before a daylight-saving transition must resolve to the matching instant",
);
assert.equal(
  zonedDateTime("2026-03-08", "America/Los_Angeles", "02:30"),
  null,
  "a nonexistent wall-clock time during spring-forward must not be shifted to a different prayer time",
);
assert.equal(
  zonedDateTime("2026-03-08", "America/Los_Angeles", "03:30")?.toISOString(),
  "2026-03-08T10:30:00.000Z",
  "valid local times after a daylight-saving transition must resolve to the matching instant",
);

const pushTopics = [
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Fajr", scheduledAt: "2026-11-11T03:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Dhuhr", scheduledAt: "2026-11-11T10:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "dhikr", prayerName: "", scheduledAt: "2026-11-11T09:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "dhikr", prayerName: "", scheduledAt: "2026-11-11T09:30:00.000Z" }),
  buildNotificationTopic({ notificationKind: "salawat", prayerName: "", scheduledAt: "2026-11-11T09:00:00.000Z" }),
];
assert.equal(new Set(pushTopics).size, pushTopics.length, "distinct prayer and interval reminders must not replace one another in the push service");
assert.ok(pushTopics.every(topic => topic.length <= 32 && /^[A-Za-z0-9_-]+$/.test(topic)), "Web Push topics must satisfy the 32-character URL-safe limit");
assert.notEqual(
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Fajr", scheduledAt: "2026-11-11T03:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Fajr", scheduledAt: "2026-11-12T03:00:00.000Z" }),
  "the same prayer on different dates must have distinct topics",
);
assert.throws(
  () => buildNotificationTopic({ notificationKind: "prayer", prayerName: "", scheduledAt: "2026-11-11T03:00:00.000Z" }),
  /prayer name is required/,
);
assert.throws(
  () => buildNotificationTopic({ notificationKind: "dhikr", prayerName: "", scheduledAt: "invalid" }),
  /valid scheduledAt/,
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
assert.match(
  reminderMigration,
  /date_trunc\('day',\s*now_at\s+at\s+time\s+zone\s+'UTC'\)\s+at\s+time\s+zone\s+'UTC'/i,
  "background reminder slots must use a stable UTC day boundary regardless of session timezone",
);
assert.match(
  reminderMigration,
  /make_interval\(\s*mins\s*=>\s*\([\s\S]*floor\([\s\S]*now_at\s*-\s*day_start\.utc_day_start[\s\S]*\)\s*::integer\s*\+\s*1/i,
  "the next interval must be calculated from elapsed minutes since midnight, not added to the current minute",
);
assert.doesNotMatch(
  reminderMigration,
  /date_trunc\('minute',\s*now_at\)\s*\+/i,
  "the interval calculation must not double-count elapsed minutes by adding an elapsed-day offset to now_at",
);
assert.match(
  reminderMigration,
  /on conflict \(push_subscription_id, notification_kind, scheduled_at\) do nothing/i,
  "delivery planning must target the existing notification-kind idempotency index",
);
const nextUtcInterval = (now: Date, intervalMinutes: number) => {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const elapsedMinutes = (now.getTime() - dayStart) / 60_000;
  return new Date(
    dayStart + (Math.floor(elapsedMinutes / intervalMinutes) + 1) * intervalMinutes * 60_000,
  ).toISOString();
};
assert.equal(
  nextUtcInterval(new Date("2026-11-11T07:37:35.000Z"), 15),
  "2026-11-11T07:45:00.000Z",
  "a 15-minute reminder at 09:37 Cairo time must be scheduled for the next 15-minute boundary",
);
assert.equal(
  nextUtcInterval(new Date("2026-11-11T07:37:35.000Z"), 60),
  "2026-11-11T08:00:00.000Z",
  "a 60-minute reminder must be scheduled for the next hour boundary",
);
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

assert.match(reminderMigration, /security invoker\s+set search_path = ''/i, "the scheduler RPC must run with service-role invoker privileges and an empty search path");
assert.doesNotMatch(reminderMigration, /security definer/i, "the service-only reminder scheduler must not use definer privileges");

console.log("Prayer notification subscription pagination contracts passed.");
