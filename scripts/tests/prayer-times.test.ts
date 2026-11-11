import assert from "node:assert/strict";
import { getCurrentPrayer, getNextPrayer, type PrayerTime } from "../../src/features/prayer/services/prayer-times";
import { readFileSync } from "node:fs";
import {
  addCalendarDays,
  formatDateInTimeZone,
  getZonedDateTime,
} from "../../src/features/prayer/services/prayer-notification-schedule";

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

const prayerAlertHook = readFileSync("src/features/prayer/hooks/use-prayer-alert.ts", "utf8");
const pushSubscription = readFileSync("src/lib/push-subscription.ts", "utf8");
assert.match(prayerAlertHook, /loadLocalPrayerLocation/);
assert.match(prayerAlertHook, /getSavedPrayerLocation/);
assert.match(prayerAlertHook, /getPrayerTimes\(location\.latitude,\s*location\.longitude/);
assert.match(prayerAlertHook, /getZonedDateTime\(/);
assert.doesNotMatch(prayerAlertHook, /LOCATION_KEY\s*=\s*["']zikr_prayer_location["']/);
assert.match(pushSubscription, /getSavedPrayerLocation/);
assert.match(pushSubscription, /timezone:\s*location\.timezone/);
assert.doesNotMatch(pushSubscription, /PRAYER_LOCATION_KEY/);

console.log("Prayer-time next-prayer, selected-location scheduling, and push-location contracts passed.");
