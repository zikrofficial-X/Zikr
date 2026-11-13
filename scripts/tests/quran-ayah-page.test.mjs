import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const shareButton = read("src/components/ui/share-button.tsx");
const quranPage = read("src/app/quran/[surah]/[ayah]/page.tsx");
const hadithPage = read("src/app/hadith/[book]/[id]/page.tsx");

assert.match(shareButton, /Capacitor\.isNativePlatform\(\)/, "native pages must use the Capacitor Share plugin");
assert.match(shareButton, /navigator\.share/, "web pages must use the Web Share API when available");
assert.match(shareButton, /navigator\.clipboard\?\.writeText/, "share must fall back to copying the content and URL");
assert.match(shareButton, /AbortError/, "cancelling the native/web share sheet must not be reported as a failure");
assert.match(shareButton, /aria-live="polite"/, "share feedback must be announced to assistive technology");

assert.match(quranPage, /const surahId = Number\(p\.surah\)/, "Quran route parameters must be parsed strictly");
assert.match(quranPage, /Number\.isInteger\(surahId\)/, "Quran route must reject partial numeric path segments");
assert.match(quranPage, /surahId > 114/, "Quran route must reject surah numbers outside the canonical range");
assert.match(quranPage, /<ShareButton/, "Quran ayah page must use the functional share control");
assert.doesNotMatch(quranPage, /Share2|جاري تحميل التفسير/, "Quran ayah page must not retain inert share or permanent loading UI");
assert.match(quranPage, /لا يتوفر تفسير مسجل لهذه الآية حالياً/, "a completed missing-tafsir read must render an empty state");

assert.match(hadithPage, /<ShareButton/, "Hadith detail page must use the functional share control");
assert.doesNotMatch(hadithPage, /Share2/, "Hadith detail page must not retain an inert share button");
assert.match(hadithPage, /const num = Number\(hadithNumber\)/, "Hadith route IDs must be parsed as complete numeric segments");
assert.match(hadithPage, /Number\.isInteger\(num\) \|\| num < 1/, "Hadith route must reject partial, fractional, zero, and negative record IDs");
assert.doesNotMatch(hadithPage, /parseInt\(hadithNumber/, "Hadith route must not silently accept trailing non-numeric path characters");

console.log("Quran/Hadith detail route validation, share controls, and tafsir empty-state contracts passed.");
