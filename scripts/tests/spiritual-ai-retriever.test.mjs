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

const prophetSectionsQuery = retriever.match(/`\/rest\/v1\/prophet_sections\?[^\`]+`/);
assert.ok(prophetSectionsQuery, "Spiritual AI must keep a dedicated prophet-sections lookup");
assert.match(
  prophetSectionsQuery[0],
  /prophets!inner\(published\)/,
  "prophet sections must be joined to their parent prophet",
);
assert.match(
  prophetSectionsQuery[0],
  /prophets\.published=eq\.true/,
  "Spiritual AI must never retrieve sections for an unpublished prophet, even before the production RLS migration is applied",
);

console.log("Spiritual AI source authority and published-parent contracts passed.");
