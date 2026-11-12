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
  hadithSync.includes("published=eq.true&text_ar=eq.${encodeURIComponent(row.text_ar)}"),
  "Hadith sync updates must revalidate both publication state and the Arabic source snapshot",
);

assert.ok(
  articleSync.includes("select=id,status,attempt_count"),
  "article translation retries must read the existing attempt counter",
);
assert.ok(
  articleSync.includes("const attemptCount = Math.max(0, Number(existing.attempt_count) || 0) + 1") &&
    articleSync.includes("attempt_count: attemptCount"),
  "article translation retries must increment, not reset, the attempt counter",
);
assert.ok(
  articleSync.includes("TRANSLATION_QUEUE_LEASE_MS = 60 * 60_000"),
  "article translation claims must remain leased longer than the 40-minute workflow timeout",
);
assert.ok(
  articleSync.includes("on_conflict=content_type,content_id,target_locale,source_hash") &&
    articleSync.includes("resolution=ignore-duplicates,return=representation"),
  "concurrent article translation runs must not create duplicate queue rows or duplicate Gemini jobs",
);
assert.ok(
  articleSync.includes("status=eq.${encodeURIComponent(existing.status)}&updated_at=eq.${encodeURIComponent(existing.updated_at)}"),
  "article translation queue claims must compare the exact status and updated_at version",
);
assert.ok(
  articleSync.includes("status=eq.processing&updated_at=eq.${encodeURIComponent(claim.updatedAt)}"),
  "translation completion and failure writes must retain the exact processing lease",
);
assert.ok(
  articleSync.includes("updated_at=eq.${encodeURIComponent(article.updated_at)}") &&
    articleSync.includes("and=(${emptyFieldFilters})"),
  "English article writes must compare the Arabic source version and keep all originally missing fields empty",
);

console.log("English content sync concurrency and retry contracts passed.");
