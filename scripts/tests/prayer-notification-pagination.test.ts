import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fetchAllIdPages, forEachIdPage } from "../../supabase/functions/prayer-notification-worker/pagination";

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
assert.match(worker, /.order\("id", \{ ascending: true \}\)/);
assert.match(worker, /query\.gt\("id", afterId\)/);

assert.match(worker, /ensureSubscriptionBatchSchedules\(page, now\)/);
assert.match(worker, /subscriptions: readonly PushSubscriptionRow\[\]/);
assert.match(worker, /\.in\("user_id", userIds\)/);
assert.match(worker, /\.in\("location_id", locationIds\)/);
assert.match(worker, /scheduled \+= await ensureSubscriptionBatchSchedules/);

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
assert.match(reminderMigration, /grant execute on function public\.plan_background_reminder_deliveries\(timestamptz\)\s+to service_role/i);
assert.doesNotMatch(reminderMigration, /grant execute on function public\.plan_background_reminder_deliveries\(timestamptz\)\s+to (?:public|anon|authenticated)/i);
assert.match(reminderService, /normalizeIanaTimeZone\(body\.timezone\)/);
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
