import assert from "node:assert/strict";
import { hasHadithPageRows, resolveHadithDisplay } from "../../src/features/hadith/types/hadith";

const translated = resolveHadithDisplay(
  { number: 1, arab: "النص العربي", english: "English translation", contentLocale: "en" },
  "en",
);
assert.equal(translated.text, "English translation");
assert.equal(translated.contentLocale, "en");
assert.equal(translated.usedArabicFallback, false);

const originalFallback = resolveHadithDisplay(
  { number: 2, arab: "النص العربي الأصلي" },
  "en",
);
assert.equal(originalFallback.text, "النص العربي الأصلي");
assert.equal(originalFallback.contentLocale, "ar");
assert.equal(originalFallback.usedArabicFallback, true);

const arabicRequest = resolveHadithDisplay(
  { number: 3, arab: "النص العربي", english: "English translation" },
  "ar",
);
assert.equal(arabicRequest.text, "النص العربي");
assert.equal(arabicRequest.contentLocale, "ar");
assert.equal(arabicRequest.usedArabicFallback, false);

assert.equal(hasHadithPageRows([{ number: 1 }]), true, "a non-empty local page should be used");
assert.equal(hasHadithPageRows([]), false, "an empty partial seed page must fall back to the remote provider");
assert.equal(hasHadithPageRows(null), false, "a failed local query must fall back to the remote provider");
assert.equal(hasHadithPageRows(undefined), false, "an absent local result must fall back to the remote provider");

console.log("Hadith localization fallback contract passed.");
