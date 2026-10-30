import assert from "node:assert/strict";
import { normalizeArabicSearchText } from "../../src/lib/search/arabic-normalization";

assert.equal(normalizeArabicSearchText("الْقُرْآنِ"), "القران");
assert.equal(normalizeArabicSearchText("مُوسَى"), "موسي");
assert.equal(normalizeArabicSearchText("إِلَى"), "الي");
assert.equal(normalizeArabicSearchText("اللَّهُمَّ"), "اللهم");
assert.equal(normalizeArabicSearchText("أَإِآُٱ"), "اااا");
assert.equal(normalizeArabicSearchText("السَّلَامُ عَلَيْكُمْ"), "السلام عليكم");
assert.equal(normalizeArabicSearchText("  قُرْآنٌ   كَرِيمٌ  "), "قران كريم");

console.log("Arabic search normalization tests passed.");
