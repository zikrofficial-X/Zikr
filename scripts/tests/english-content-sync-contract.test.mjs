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
  hadithSync.includes("signal: init.signal ?? AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS)"),
  "Supabase reads and writes in the Hadith sync must have a bounded request timeout",
);
assert.ok(
  hadithSync.includes("signal: AbortSignal.timeout(HADITH_API_TIMEOUT_MS)"),
  "the external Hadith source request must have a bounded timeout",
);
assert.ok(
  hadithSync.includes("if (response.status === 404 || response.status === 204) return null;") &&
    hadithSync.includes("throw new Error(`Hadith API ${response.status}:"),
  "only a genuine missing source may be skipped; upstream 429/5xx failures must fail the sync",
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

const environmentGuardIndex = articleSync.indexOf("function requireEnvironmentValue(name: string): string");
const geminiKeyDeclarationIndex = articleSync.indexOf('const geminiApiKey = requireEnvironmentValue("GEMINI_API_KEY");');
const geminiFactoryIndex = articleSync.indexOf("async function generateGeminiTextForJob(");
assert.ok(
  environmentGuardIndex >= 0 &&
    geminiKeyDeclarationIndex > environmentGuardIndex &&
    geminiFactoryIndex > geminiKeyDeclarationIndex,
  "required Gemini credentials must be narrowed to a string before the model factory captures the key",
);
assert.ok(
  articleSync.includes('const supabaseUrl = requireEnvironmentValue("SUPABASE_URL");') &&
    articleSync.includes('const serviceRoleKey = requireEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY");'),
  "Supabase URL and service-role credentials must be validated and narrowed before any queue recovery request",
);
const recoveryCallIndex = articleSync.indexOf("await recoverStaleTranslationQueueRows();");
assert.ok(
  geminiGuardIndex >= 0 && geminiGuardIndex < recoveryCallIndex,
  "missing Gemini credentials must fail before stale translation queue recovery can write to production",
);
const articleCandidateIndex = articleSync.indexOf('const rows = await supabase<ArticleRow[]>(');
assert.ok(
  recoveryCallIndex >= 0 && recoveryCallIndex < articleCandidateIndex,
  "stale translation claims must be reconciled before selecting new article candidates",
);
assert.ok(
  articleSync.includes("status=eq.processing&updated_at=eq.${encodeURIComponent(queueRow.updated_at)}"),
  "stale queue recovery must compare the exact processing-row revision before finalizing",
);
assert.ok(
  articleSync.includes("sourceHashMatches: article !== null && hashSource(article) === queueRow.source_hash"),
  "stale queue recovery must verify the current Arabic source hash before marking a translation generated",
);

const circleCi = readFileSync(".circleci/config.yml", "utf8");
const circleEnglishSync = circleCi.slice(
  circleCi.indexOf("  english-content-sync:"),
  circleCi.indexOf("  android-release-draft:"),
);
const credentialValidationStart = circleEnglishSync.indexOf("name: Validate production content-sync credentials");
const boundedSyncStart = circleEnglishSync.indexOf("name: Run bounded English content sync");
const boundedSyncCommand = circleEnglishSync.slice(boundedSyncStart);
assert.ok(
  credentialValidationStart >= 0 && boundedSyncStart > credentialValidationStart,
  "Supabase credentials shared by both content-sync workers must be validated before the bounded worker step",
);
const geminiBranchStart = boundedSyncCommand.indexOf('if [[ -n "${GEMINI_API_KEY:-}" ]]');
const geminiBranchEnd = boundedSyncCommand.indexOf("\n              fi\n\n              echo \"Synchronizing", geminiBranchStart);
const hadithCommandPosition = boundedSyncCommand.indexOf("pnpm sync:hadith:en");
assert.ok(
  geminiBranchStart >= 0 && geminiBranchEnd > geminiBranchStart && hadithCommandPosition > geminiBranchEnd,
  "Hadith sync must remain outside the optional Gemini article branch so it runs even when article translation is unavailable",
);

assert.ok(
  circleEnglishSync.includes("timeout --signal=TERM --kill-after=60s 40m pnpm translate:articles:en"),
  "the scheduled CircleCI article worker must have a hard 40-minute limit below its 60-minute queue lease",
);
assert.ok(
  circleEnglishSync.includes("timeout --signal=TERM --kill-after=60s 40m pnpm translate:articles:en"),
  "the scheduled CircleCI article worker must have a hard 40-minute limit below its 60-minute queue lease",
);
assert.ok(
  circleEnglishSync.includes("timeout --signal=TERM --kill-after=60s 15m pnpm sync:hadith:en"),
  "the scheduled Hadith sync must have a hard runtime bound",
);
assert.ok(
  circleEnglishSync.includes("if ! command -v timeout >/dev/null 2>&1; then") &&
    circleEnglishSync.includes("hadith_status=127"),
  "the scheduled workers must fail closed when their hard-timeout utility is unavailable",
);
console.log("English content sync concurrency and retry contracts passed.");
