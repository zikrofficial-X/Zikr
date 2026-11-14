import assert from "node:assert/strict";
import { getCurrentPrayer, getNextPrayer, type PrayerTime } from "../../src/features/prayer/services/prayer-times";
import { readFileSync } from "node:fs";
import { parsePrayerCoordinate } from "../../src/features/prayer/services/prayer-location-validation";
import {
  addCalendarDays,
  formatDateInTimeZone,
  getPrayerAlertDateKey,
  getPrayerNotificationIdsToCancel,
  getZonedDateTime,
} from "../../src/features/prayer/services/prayer-notification-schedule";

assert.equal(parsePrayerCoordinate(31.2, -90, 90), 31.2);
assert.equal(parsePrayerCoordinate("29.9187", -180, 180), 29.9187);
assert.equal(parsePrayerCoordinate("", -90, 90), null, "empty coordinates must not coerce to zero");
assert.equal(parsePrayerCoordinate("   ", -90, 90), null, "whitespace coordinates must not coerce to zero");
assert.equal(parsePrayerCoordinate(null, -90, 90), null, "null coordinates must not coerce to zero");
assert.equal(parsePrayerCoordinate(false, -90, 90), null, "boolean coordinates must be rejected");
assert.equal(parsePrayerCoordinate("0x10", -90, 90), null, "non-decimal coordinate strings must be rejected");
assert.equal(parsePrayerCoordinate("1e2", -90, 90), null, "exponential coordinate strings must be rejected");
assert.equal(parsePrayerCoordinate(91, -90, 90), null);
assert.equal(parsePrayerCoordinate(-181, -180, 180), null);

const timings: PrayerTime = {
  Fajr: "05:00",
  Sunrise: "06:15",
  Dhuhr: "12:00",
  Asr: "15:30",
  Sunset: "17:40",
  Maghrib: "18:00",
  Isha: "19:30",
  Imsak: "04:50",
  Midnight: "00:00",
};

const afterSunrise = getNextPrayer(timings, new Date(2026, 9, 28, 6, 30));
assert.deepEqual(afterSunrise, {
  name: "Dhuhr",
  time: "12:00",
  minutesUntil: 330,
}, "sunrise must not be reported as the next salah");

const beforeMaghrib = getNextPrayer(timings, new Date(2026, 9, 28, 16, 30));
assert.deepEqual(beforeMaghrib, {
  name: "Maghrib",
  time: "18:00",
  minutesUntil: 90,
}, "sunset must not be reported as a separate salah before Maghrib");

const afterIsha = getNextPrayer(timings, new Date(2026, 9, 28, 20, 0));
assert.deepEqual(afterIsha, {
  name: "Fajr",
  time: "05:00",
  minutesUntil: 540,
}, "the next prayer after Isha must wrap to Fajr tomorrow");

const beforeFajr = getNextPrayer(timings, new Date(2026, 9, 28, 4, 0));
assert.deepEqual(beforeFajr, {
  name: "Fajr",
  time: "05:00",
  minutesUntil: 60,
}, "the early-morning countdown must use Fajr");

const selectedCityNow = new Date("2026-06-15T12:30:00.000Z");
assert.deepEqual(
  getNextPrayer(timings, selectedCityNow, "America/New_York"),
  {
    name: "Dhuhr",
    time: "12:00",
    minutesUntil: 210,
  },
  "a selected city's timezone, not the device timezone, must drive the countdown",
);
assert.equal(
  getCurrentPrayer(timings, selectedCityNow, "America/New_York")?.name,
  "Fajr",
  "the current prayer must be calculated in the selected city's timezone",
);


assert.equal(
  formatDateInTimeZone(new Date("2026-06-15T02:00:00.000Z"), "America/Los_Angeles"),
  "2026-06-14",
  "the selected location's calendar date must be used instead of the device date",
);
assert.equal(addCalendarDays("2026-06-14", 1), "2026-06-15");

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
assert.equal(
  getPrayerAlertDateKey(selectedCityNow),
  localDateKey(selectedCityNow),
  "alert deduplication must safely default to the device timezone when no location timezone is available",
);
assert.equal(
  getPrayerAlertDateKey(selectedCityNow, "America/Los_Angeles"),
  "2026-06-15",
  "alert deduplication must honor an explicitly selected timezone",
);
assert.equal(
  getPrayerAlertDateKey(selectedCityNow, "Invalid/Timezone"),
  localDateKey(selectedCityNow),
  "an invalid saved timezone must fall back to the device calendar date",
);

assert.equal(
  getZonedDateTime("2026-06-15", "America/New_York", "12:00")?.toISOString(),
  "2026-06-15T16:00:00.000Z",
  "native alarms must convert selected-city wall time to the correct UTC instant",
);
assert.equal(
  getZonedDateTime("2026-06-15", "UTC", "00:00")?.toISOString(),
  "2026-06-15T00:00:00.000Z",
);
assert.equal(getZonedDateTime("invalid", "UTC", "12:00"), null);
assert.equal(getZonedDateTime("2026-02-31", "UTC", "12:00"), null);
assert.equal(addCalendarDays("2026-02-31", 1), null);

assert.deepEqual(
  getPrayerNotificationIdsToCancel({
    scheduleDays: 2,
    prayers: ["Fajr", "Dhuhr", "Isha"],
    enabledPrayers: { Fajr: true, Dhuhr: false, Isha: true },
    refreshedPrayerIds: [7000, 7002, 7003],
    idBase: 7000,
  }),
  [7000, 7001, 7002, 7003, 7004],
  "refresh must cancel disabled alarms and only enabled alarms whose replacement timing was resolved",
);
assert.deepEqual(
  getPrayerNotificationIdsToCancel({
    scheduleDays: 2,
    prayers: ["Fajr", "Dhuhr", "Isha"],
    enabledPrayers: { Fajr: true, Dhuhr: true, Isha: true },
    refreshedPrayerIds: [7000],
    idBase: 7000,
  }),
  [7000],
  "enabled alarms for days whose timing lookup failed must remain scheduled",
);
assert.deepEqual(
  getPrayerNotificationIdsToCancel({
    scheduleDays: 2,
    prayers: ["Fajr", "Dhuhr", "Isha"],
    enabledPrayers: { Fajr: true, Dhuhr: true, Isha: true },
    refreshedPrayerIds: [],
    idBase: 7000,
    hasLocation: false,
  }),
  [7000, 7001, 7002, 7003, 7004, 7005],
  "removing the saved location must cancel every stale native prayer alarm",
);
assert.deepEqual(
  getPrayerNotificationIdsToCancel({
    scheduleDays: 2,
    prayers: ["Fajr", "Dhuhr", "Isha"],
    enabledPrayers: { Fajr: false, Dhuhr: false, Isha: false },
    refreshedPrayerIds: [],
    idBase: 7000,
  }),
  [7000, 7001, 7002, 7003, 7004, 7005],
  "disabling every prayer must cancel all native prayer alarms",
);

const prayerAlertHook = readFileSync("src/features/prayer/hooks/use-prayer-alert.ts", "utf8");
const pushSubscription = readFileSync("src/lib/push-subscription.ts", "utf8");
assert.match(prayerAlertHook, /loadLocalPrayerLocation/);
assert.match(prayerAlertHook, /getSavedPrayerLocation/);
assert.match(prayerAlertHook, /getPrayerTimes\(\s*location\.latitude,\s*location\.longitude/);
assert.match(prayerAlertHook, /getZonedDateTime\(/);
assert.match(prayerAlertHook, /syncExistingServerPush/);
assert.match(prayerAlertHook, /navigator\.serviceWorker\.getRegistration\(\)/);
assert.match(prayerAlertHook, /registration\.pushManager\.getSubscription\(\)/);
assert.match(prayerAlertHook, /pendingServerPushSyncRef\.current = true/);
assert.match(prayerAlertHook, /syncExistingServerPush\(settings\.enabledPrayers\)/);
assert.match(prayerAlertHook, /settingsRef\.current\.enabledPrayers/);
assert.match(prayerAlertHook, /zikr:prayer-location-updated/);
assert.match(prayerAlertHook, /zikr:prayer-location-saved/);
assert.doesNotMatch(prayerAlertHook, /LOCATION_KEY\s*=\s*["']zikr_prayer_location["']/);
assert.match(pushSubscription, /getSavedPrayerLocation/);
assert.match(pushSubscription, /timezone:\s*location\.timezone/);
assert.ok(
  pushSubscription.indexOf("getPrayerContext(context.enabledPrayers)") <
    pushSubscription.indexOf("registration.pushManager.subscribe"),
  "a missing prayer location must not create an orphan browser push subscription",
);
assert.doesNotMatch(pushSubscription, /PRAYER_LOCATION_KEY/);

const prayerLocationRoute = readFileSync("src/app/api/prayer-location/route.ts", "utf8");
const prayerLocationMigration = readFileSync("supabase/migrations/20261114040000_save_default_prayer_location_atomically.sql", "utf8");
assert.match(prayerLocationRoute, /parsePrayerCoordinate\(body\.latitude, -90, 90\)/);
assert.match(prayerLocationRoute, /parsePrayerCoordinate\(body\.longitude, -180, 180\)/);
assert.match(prayerLocationRoute, /supabase\.rpc\("save_default_prayer_location"/);
assert.doesNotMatch(prayerLocationRoute, /clearDefaultError|\.update\(\{ is_default: false/);
assert.match(prayerLocationMigration, /SECURITY INVOKER/);
assert.match(prayerLocationMigration, /SET search_path = ''/);
assert.match(prayerLocationMigration, /pg_advisory_xact_lock/);
assert.match(prayerLocationMigration, /GRANT EXECUTE ON FUNCTION public\.save_default_prayer_location/);

console.log("Prayer-time next-prayer, selected-location scheduling, and push-location contracts passed.");
