import assert from "node:assert/strict";
import { getNextPrayer, type PrayerTime } from "../../src/features/prayer/services/prayer-times";

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

console.log("Prayer-time next-prayer regression tests passed.");
