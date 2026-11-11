import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const retriever = readFileSync("src/features/spiritual-ai/services/retriever.ts", "utf8");

assert.match(
  retriever,
  /authority: SpiritualSource\["authority"\] = kind === "quran" \|\| kind === "hadith" \? "primary" : "site"/,
  "Quran verses and hadith retain primary-source classification by default",
);
assert.match(
  retriever,
  /contentKeys,\s*urlBuilder\?\.\(row\),\s*authority/,
  "queryRows must propagate the selected source authority",
);
assert.match(
  retriever,
  /'quran', 'تفسير قرآني متاح في ZIKR'.*\['tafsir_ar'\], undefined, 'site'/s,
  "tafsir must be classified as scholarly commentary rather than primary Quran text",
);

console.log("Spiritual AI source authority contracts passed.");
