#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const migrationNames = [
  "20260817074038_quran_tafsir_expansion_01.sql",
  "20260817074103_quran_tafsir_expansion_02.sql",
  "20260817074131_quran_tafsir_expansion_03.sql",
  "20260817074153_quran_tafsir_expansion_04.sql",
  "20260817074216_quran_tafsir_expansion_05.sql",
  "20260817074237_quran_tafsir_expansion_06.sql",
  "20260817074304_quran_tafsir_expansion_07.sql",
  "20260817074324_quran_tafsir_expansion_08.sql",
  "20260817074342_quran_tafsir_expansion_09.sql",
];
const expectedCounts = [700, 700, 700, 700, 700, 700, 700, 700, 636];
const rowPattern = /INSERT INTO public\.quran_tafsir \(id,surah_id,ayah_number,tafsir_ar,author,created_at,updated_at,source_url,retrieved_at\) SELECT gen_random_uuid\(\),(\d+),(\d+),'((?:''|[^'])*)','التفسير الميسر',now\(\),now\(\),'([^']+)','([^']+)' WHERE EXISTS \(SELECT 1 FROM public\.quran_surahs WHERE id=(\d+)\) ON CONFLICT \(surah_id,ayah_number,author\) DO UPDATE/g;

const pairs = new Set();
const countsByFile = [];
const ayahCountsBySurah = new Map();
for (let i = 0; i < migrationNames.length; i += 1) {
  const sql = readFileSync(join(process.cwd(), "supabase/migrations", migrationNames[i]), "utf8");
  const matches = [...sql.matchAll(rowPattern)];
  assert.equal(matches.length, expectedCounts[i], migrationNames[i] + " must contain its complete expected chunk");
  assert.ok(!/^\s*(?:DELETE|TRUNCATE|DROP|ALTER|GRANT|REVOKE)\b/im.test(sql), migrationNames[i] + " must remain an insert/upsert-only data migration");

  for (const match of matches) {
    const surah = Number(match[1]);
    const ayah = Number(match[2]);
    const tafsirText = match[3].replace(/''/g, "'").trim();
    const sourceUrl = match[4];
    const retrievedAt = match[5];
    const existsGuardSurah = Number(match[6]);
    assert.ok(Number.isInteger(surah) && surah >= 1 && surah <= 114, "surah id must be canonical");
    assert.ok(Number.isInteger(ayah) && ayah >= 1, "ayah number must be positive");
    assert.ok(tafsirText.length > 0, "tafsir text must not be empty");
    assert.equal(sourceUrl, "https://api.alquran.cloud/v1/surah/" + surah + "/ar.muyassar", "source URL must match the canonical AlQuranCloud Muyassar corpus");
    assert.equal(retrievedAt, "2026-08-17T00:00:00+00:00", "source retrieval timestamp must remain explicit");
    assert.equal(existsGuardSurah, surah, "surah existence guard must target the same surah as the seed record");

    const key = surah + ":" + ayah;
    assert.ok(!pairs.has(key), "duplicate tafsir ayah pair: " + key);
    pairs.add(key);
    ayahCountsBySurah.set(surah, (ayahCountsBySurah.get(surah) ?? 0) + 1);
  }
  countsByFile.push(matches.length);
}

assert.deepEqual(countsByFile, expectedCounts);
assert.equal(countsByFile.reduce((sum, count) => sum + count, 0), 6236);
assert.equal(pairs.size, 6236, "the original source migrations must cover 6,236 unique ayah pairs");
assert.equal(ayahCountsBySurah.size, 114, "the tafsir seed corpus must cover all 114 Quran surahs");
for (let surah = 1; surah <= 114; surah += 1) {
  assert.ok((ayahCountsBySurah.get(surah) ?? 0) > 0, "missing tafsir seed rows for surah " + surah);
}

for (const file of ["scripts/restore-quran-tafsir.sh", "scripts/reconcile-supabase-migration-history.sh"]) {
  const syntax = spawnSync("bash", ["-n", file], { encoding: "utf8" });
  assert.equal(syntax.status, 0, file + " must pass bash -n: " + (syntax.stderr || syntax.stdout || "unknown shell error"));
}

const expectedProjectRef = "zqtssvlvmkzeeyqghqfk";
function runDatabaseUrlValidation(url) {
  const env = { ...process.env, SUPABASE_DB_URL: url, EXPECTED_PROJECT_REF: expectedProjectRef };
  delete env.PGSSLMODE;
  return spawnSync("python3", ["scripts/verify-supabase-db-url.py"], { encoding: "utf8", env });
}
const validDirectUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?sslmode=require`,
);
assert.equal(validDirectUrl.status, 0, "the exact direct project endpoint with TLS must pass");
const validPoolerUrl = runDatabaseUrlValidation(
  `postgresql://postgres.${expectedProjectRef}:test-only-secret@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=verify-full`,
);
assert.equal(validPoolerUrl.status, 0, "the Supabase pooler must require the project-qualified postgres user");
const wrongHostUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret-${expectedProjectRef}@db.attacker.supabase.co:5432/postgres?sslmode=require`,
);
assert.notEqual(wrongHostUrl.status, 0, "a project ref appearing only in a password must not validate a foreign hostname");
assert.ok(
  !String(wrongHostUrl.stdout + wrongHostUrl.stderr).includes("test-only-secret"),
  "database URL validation must never echo credentials",
);
const wrongPoolerUser = runDatabaseUrlValidation(
  "postgresql://postgres:test-only-secret@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require",
);
assert.notEqual(wrongPoolerUser.status, 0, "pooler usernames must identify the expected project");
const weakTlsUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?sslmode=disable`,
);
assert.notEqual(weakTlsUrl.status, 0, "explicitly disabled TLS must fail");
const missingTlsUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres`,
);
assert.notEqual(missingTlsUrl.status, 0, "a production database URL without an explicit secure TLS mode must fail");
const hostOverrideUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?host=db.attacker.supabase.co&sslmode=require`,
);
assert.notEqual(hostOverrideUrl.status, 0, "a libpq host query override must not bypass the validated authority hostname");
const hostAddressOverrideUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?hostaddr=203.0.113.10&sslmode=require`,
);
assert.notEqual(hostAddressOverrideUrl.status, 0, "a hostaddr override must not bypass DNS endpoint validation");
const portOverrideUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?port=6543&sslmode=require`,
);
assert.notEqual(portOverrideUrl.status, 0, "a conflicting port query parameter must not replace the validated authority port");
const databaseOverrideUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?dbname=attacker&sslmode=require`,
);
assert.notEqual(databaseOverrideUrl.status, 0, "a database-name query override must not replace the postgres database");
const queryUserOverrideUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?user=zikr_seed_loader&sslmode=require`,
);
assert.notEqual(queryUserOverrideUrl.status, 0, "the effective query-string user must be checked against the retired-role denylist");
const doubleEncodedUser = `postgres.%25${expectedProjectRef.charCodeAt(0).toString(16)}${expectedProjectRef.slice(1)}`;
const doubleEncodedUserUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?user=${doubleEncodedUser}&sslmode=require`,
);
assert.notEqual(doubleEncodedUserUrl.status, 0, "query credentials must be percent-decoded exactly once");
const duplicateUserUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?user=postgres&user=attacker&sslmode=require`,
);
assert.notEqual(duplicateUserUrl.status, 0, "duplicate user parameters must fail closed");
const duplicateTlsUrl = runDatabaseUrlValidation(
  `postgresql://postgres:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?sslmode=disable&sslmode=require`,
);
assert.notEqual(duplicateTlsUrl.status, 0, "duplicate TLS parameters must fail closed");
const retiredRoleUrl = runDatabaseUrlValidation(
  `postgresql://zikr_seed_loader:test-only-secret@db.${expectedProjectRef}.supabase.co:5432/postgres?sslmode=require`,
);
assert.notEqual(retiredRoleUrl.status, 0, "the retired seed-loader role must remain blocked");

const restore = readFileSync("scripts/restore-quran-tafsir.sh", "utf8");
for (const name of migrationNames) assert.ok(restore.includes(name), "restore script is missing " + name);
assert.ok(restore.includes("--single-transaction"), "all tafsir chunks must restore atomically");
assert.ok(restore.includes("python3 scripts/verify-supabase-db-url.py"), "tafsir restore must validate the exact database host, role, project and TLS before connecting");
assert.ok(!restore.includes('!= *"${EXPECTED_PROJECT_REF}"*'), "tafsir restore must not rely on a raw substring target check");
assert.ok(!restore.includes("INSERT INTO public.quran_tafsir"), "restore wrapper must reuse immutable source migrations instead of duplicating tafsir text");
const manualRestoreWorkflow = readFileSync(".github/workflows/supabase-restore-seed-data.yml", "utf8");
assert.ok(manualRestoreWorkflow.includes("bash scripts/restore-quran-tafsir.sh"), "manual seed restore must reuse the canonical guarded restore implementation");
assert.ok(manualRestoreWorkflow.includes('[[ "$count" == "6236" ]]'), "manual seed restore must require the complete source-verified corpus");
assert.ok(!manualRestoreWorkflow.includes("grep -l"), "manual seed restore must not discover arbitrary future migrations by matching SQL text");

const reconcile = readFileSync("scripts/reconcile-supabase-migration-history.sh", "utf8");
assert.ok(reconcile.includes("TAFSIR_EXPECTED_COUNT"), "production schema reconciliation must expose the source-corpus preflight mode");
assert.ok(reconcile.includes("0,6236"), "baseline reconciliation must allow only an absent or complete tafsir corpus, never a partial corpus");

const release = readFileSync(".github/workflows/release-finalization.yml", "utf8");
assert.ok(release.includes("TAFSIR_EXPECTED_COUNT=0,6236"), "pre-deploy parent-schema verification must allow an absent or complete corpus");
assert.ok(release.includes("bash scripts/restore-quran-tafsir.sh"), "controlled release must restore the source-verified tafsir corpus");
assert.ok(release.includes('TAFSIR_EXPECTED_COUNT: "6236"'), "post-migration production verification must require the complete tafsir corpus");

console.log("Quran tafsir source integrity passed: 6,236 unique rows across 114 surahs; atomic restore contract verified.");
