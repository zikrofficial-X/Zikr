import assert from "node:assert/strict";
import { normalizeArabicSearchText } from "../../src/lib/search/arabic-normalization";

const cases: Array<[string, string]> = [
  ["الْقُرْآنِ", "القران"],
  ["أَإِآُٱ", "اااا"],
  ["هَذَا الْحَدِيثُ", "هذا الحديث"],
  ["مُوسَى", "موسي"],
  ["السَّلَامُ عَلَيْكُمْ", "السلام عليكم"],
];

for (const [input, expected] of cases) {
  assert.equal(normalizeArabicSearchText(input), expected, input);
}

console.log("Arabic search normalization tests passed.");
