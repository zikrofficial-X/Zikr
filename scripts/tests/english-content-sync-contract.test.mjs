import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hadithSync = readFileSync("scripts/sync-hadith-english.ts", "utf8");
const articleSync = readFileSync("scripts/translate-published-articles-en.ts", "utf8");

const missingEnglishFilter = "&or=(text_en.is.null,text_en.eq.)";
assert.ok(
  hadithSync.split(missingEnglishFilter).length - 1 >= 2,
  "Hadith candidate selection and update must both require the English field to remain empty",
);
const hadithUpdateIndex = hadithSync.indexOf("const updatedRows = await supabase");
const hadithSkipIndex = hadithSync.indexOf("if (!updatedRows.length)", hadithUpdateIndex);
const hadithSuccessIndex = hadithSync.indexOf("synced += 1", hadithUpdateIndex);
assert.ok(
  hadithUpdateIndex >= 0 && hadithSkipIndex > hadithUpdateIndex && hadithSuccessIndex > hadithSkipIndex,
  "a concurrent English edit must cause a safe skip before the sync is counted",
);
assert.ok(
  hadithSync.includes("an English value was added while the external source was fetched"),
  "the Hadith sync must explain why a concurrent edit was preserved",
);

assert.ok(
  articleSync.includes("select=id,status,attempt_count"),
  "article translation retries must read the existing attempt counter",
);
assert.ok(
  articleSync.includes("attempt_count: Math.max(0, Number(existing.attempt_count) || 0) + 1"),
  "article translation retries must increment, not reset, the attempt counter",
);

console.log("English content sync concurrency and retry contracts passed.");
