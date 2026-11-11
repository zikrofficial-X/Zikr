import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  hasEnabledPrayerReminder,
  mergePrayerReminderPreferences,
} from "../../src/features/prayer/services/prayer-reminder-preferences";

const requested = {
  Fajr: 0,
  Dhuhr: 0,
  Asr: null,
  Maghrib: 0,
  Isha: 0,
};

assert.deepEqual(
  mergePrayerReminderPreferences(
    { Fajr: -10, Dhuhr: 5, Asr: 15, Maghrib: 99, Isha: null, retired: 20 },
    requested,
  ),
  { Fajr: -10, Dhuhr: 5, Asr: null, Maghrib: 0, Isha: 0 },
  "push refresh must preserve valid offsets for enabled prayers, apply disabled flags, and reject invalid legacy offsets",
);

assert.deepEqual(
  mergePrayerReminderPreferences(null, requested),
  requested,
  "first-time registration must use the requested enabled/disabled flags",
);

assert.deepEqual(
  mergePrayerReminderPreferences(["not", "a", "record"], requested),
  requested,
  "malformed stored JSON must not be treated as a prayer preference record",
);

assert.equal(
  hasEnabledPrayerReminder({ Fajr: -10, Dhuhr: null }),
  true,
  "a valid numeric offset represents an enabled prayer reminder",
);
assert.equal(
  hasEnabledPrayerReminder({ Fajr: null, Dhuhr: null }),
  false,
  "null offsets represent disabled prayer reminders",
);

const route = readFileSync("src/app/api/push/subscription/route.ts", "utf8");
const lookupIndex = route.indexOf('.from("prayer_preferences")');
const mergeIndex = route.indexOf("mergePrayerReminderPreferences(");
const upsertIndex = route.indexOf('.upsert(', lookupIndex);
assert.ok(
  lookupIndex >= 0 && mergeIndex > lookupIndex && upsertIndex > mergeIndex,
  "the subscription route must read and merge saved offsets before writing prayer preferences",
);
assert.match(route, /\.select\("prayer_reminders"\)/);
assert.match(route, /prayer_reminders:\s*mergedPrayerReminders/);

console.log("Prayer reminder preference merge contract passed.");
