import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasHadithPageRows, resolveHadithBookName, resolveHadithDisplay } from "../../src/features/hadith/types/hadith";

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

assert.equal(resolveHadithBookName("صحيح البخاري", "Sahih al-Bukhari", "en"), "Sahih al-Bukhari");
assert.equal(resolveHadithBookName("صحيح البخاري", "Sahih al-Bukhari", "ar"), "صحيح البخاري");
assert.equal(resolveHadithBookName("صحيح البخاري", null, "en"), "صحيح البخاري", "offline English labels must fall back safely when unavailable");
assert.equal(hasHadithPageRows([]), false, "an empty local search result must allow the remote fallback");
assert.equal(hasHadithPageRows([{ number: 1 }]), true, "non-empty local search rows remain authoritative");

const hadithService = readFileSync("src/features/hadith/services/hadith.ts", "utf8");
assert.ok(hadithService.includes("loadOfflineHadithBooks(locale)"), "offline collection names must use the requested locale");
assert.ok(hadithService.includes("if (hasHadithPageRows(dbHadiths))"), "empty local search results must fall through to the remote provider");
assert.ok(hadithService.includes("return dbHadiths.map(mapDbHadith)"), "Arabic originals must remain available when English translation is missing");

console.log("Hadith localization and empty-search fallback contracts passed.");
