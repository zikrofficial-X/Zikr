import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const shareButton = read("src/components/ui/share-button.tsx");
const quranPage = read("src/app/quran/[surah]/[ayah]/page.tsx");
const hadithPage = read("src/app/hadith/[book]/[id]/page.tsx");
const routeParams = read("src/lib/route-params.ts");

assert.match(shareButton, /Capacitor\.isNativePlatform\(\)/, "native pages must use the Capacitor Share plugin");
assert.match(shareButton, /navigator\.share/, "web pages must use the Web Share API when available");
assert.match(shareButton, /navigator\.clipboard\?\.writeText/, "share must fall back to copying the content and URL");
assert.match(shareButton, /AbortError/, "cancelling the native/web share sheet must not be reported as a failure");
assert.match(shareButton, /aria-live="polite"/, "share feedback must be announced to assistive technology");

assert.match(routeParams, /typeof value !== "string"/, "route IDs must be strings, not coercible numeric values");
assert.match(routeParams, /\/\^\[1-9\]\\d\*\$\//, "route IDs must use canonical positive decimal digits only");
assert.match(routeParams, /Number\.isSafeInteger\(parsed\)/, "route IDs must stay within JavaScript's safe integer range");
const parsePositiveIntegerRouteSegment = (value) => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};
assert.equal(parsePositiveIntegerRouteSegment("1"), 1);
assert.equal(parsePositiveIntegerRouteSegment("114"), 114);
for (const invalid of ["0", "01", "+1", "1.0", "1e2", "0x10", " 1", "1abc", "9007199254740992"]) {
  assert.equal(parsePositiveIntegerRouteSegment(invalid), null, `non-canonical route segment ${invalid} must be rejected`);
}
assert.match(quranPage, /parsePositiveIntegerRouteSegment\(p\.surah\)/, "Quran surah IDs must use the shared decimal parser");
assert.match(quranPage, /parsePositiveIntegerRouteSegment\(p\.ayah\)/, "Quran ayah IDs must use the shared decimal parser");
assert.match(quranPage, /surahId > 114/, "Quran route must reject surah numbers outside the canonical range");
assert.doesNotMatch(quranPage, /Number\(p\.surah\)|Number\(p\.ayah\)/, "Quran route must not coerce hexadecimal or exponent notation");
assert.match(quranPage, /<ShareButton/, "Quran ayah page must use the functional share control");
assert.doesNotMatch(quranPage, /Share2|جاري تحميل التفسير/, "Quran ayah page must not retain inert share or permanent loading UI");
assert.match(quranPage, /لا يتوفر تفسير مسجل لهذه الآية حالياً/, "a completed missing-tafsir read must render an empty state");

assert.match(hadithPage, /<ShareButton/, "Hadith detail page must use the functional share control");
assert.doesNotMatch(hadithPage, /Share2/, "Hadith detail page must not retain an inert share button");
assert.match(hadithPage, /parsePositiveIntegerRouteSegment\(hadithNumber\)/, "Hadith route IDs must use the shared decimal parser");
assert.doesNotMatch(hadithPage, /Number\(hadithNumber\)|parseInt\(hadithNumber/, "Hadith route must not coerce hexadecimal, exponent, or trailing non-numeric path characters");

console.log("Quran/Hadith detail route validation, share controls, and tafsir empty-state contracts passed.");
