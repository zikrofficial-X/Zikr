import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const migrationsDir = path.resolve("supabase/migrations");
const migrationFiles = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
const migrations = migrationFiles.map((file) => readFileSync(path.join(migrationsDir, file), "utf8")).join("\n\n");
const types = readFileSync("src/lib/types/supabase.ts", "utf8");

function requireText(haystack: string, needle: string, label: string) {
  assert.ok(haystack.includes(needle), label + " is missing: " + needle);
}

function requireRegex(haystack: string, pattern: RegExp, label: string) {
  assert.ok(pattern.test(haystack), label + " does not match " + pattern);
}

requireText(migrations, "media_assets", "media_assets migration contract");
requireText(migrations, "source_id", "media_assets.source_id migration contract");
requireRegex(types, /media_assets\s*:\s*\{/, "media_assets generated type contract");
requireText(types, "media_assets_source_id_fkey", "media_assets.source_id relationship type contract");

requireRegex(migrations, /quran_reciters[\s\S]{0,800}code\s+text\s+unique\s+not\s+null/i, "quran_reciters.code migration contract");
requireRegex(types, /quran_reciters\s*:\s*\{[\s\S]{0,5000}?code:\s*string \| null/i, "quran_reciters.code generated type contract");
requireRegex(migrations, /quran_audio[\s\S]{0,1200}reciter_id/i, "quran_audio.reciter_id migration contract");
requireRegex(migrations, /quran_audio[\s\S]{0,1200}audio_url/i, "quran_audio.audio_url migration contract");
requireRegex(types, /quran_audio\s*:\s*\{[\s\S]{0,6000}?reciter_id:\s*string \| null/i, "quran_audio.reciter_id generated type contract");
requireRegex(types, /quran_audio\s*:\s*\{[\s\S]{0,6000}?audio_url:\s*string \| null/i, "quran_audio.audio_url generated type contract");

const kidsGameHardening = readFileSync(
  path.join(migrationsDir, "20261009054919_kids_games_client_write_hardening_20261009.sql"),
  "utf8",
);
requireRegex(kidsGameHardening, /REVOKE ALL PRIVILEGES[\s\S]*FROM PUBLIC, anon, authenticated/i, "kids game client write revocation");
requireRegex(kidsGameHardening, /GRANT SELECT[\s\S]*TO authenticated/i, "kids game authenticated read access");
requireRegex(kidsGameHardening, /DROP POLICY IF EXISTS "Users can insert their own game results"/i, "legacy kids result insert policy removal");
requireRegex(kidsGameHardening, /DROP POLICY IF EXISTS "Users can update their own game progress"/i, "legacy kids progress update policy removal");
requireRegex(kidsGameHardening, /CREATE POLICY kids_game_results_select_own[\s\S]*TO authenticated[\s\S]*auth\.uid\(\).*user_id/i, "kids game result self-read policy");


const adminContent = readFileSync("src/features/admin/services/content.ts", "utf8");
const siteContent = readFileSync("src/features/site-content/services/site-content.ts", "utf8");
const scheduledContent = readFileSync("scripts/jobs/content-publishing.ts", "utf8");

requireRegex(
  migrations,
  /create table if not exists pinned_messages[\\s\\S]{0,500}?published boolean not null default false/i,
  "pinned_messages.published migration contract",
);
requireRegex(
  types,
  /pinned_messages\\s*:\\s*\\{[\\s\\S]{0,1000}?published:\\s*boolean/,
  "pinned_messages.published generated type contract",
);
requireText(
  adminContent,
  '.select("id, title, published, created_at, updated_at")',
  "admin pinned_messages query contract",
);
requireText(
  siteContent,
  ".select('id, title, body, cta_label, cta_href, published, created_at')",
  "public pinned_messages query contract",
);
requireText(siteContent, ".eq('published', true)", "public pinned_messages visibility contract");
assert.doesNotMatch(adminContent, /is_active/);
assert.doesNotMatch(siteContent, /is_active|priority/);
assert.doesNotMatch(scheduledContent, /is_active/);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(pkg.scripts["video:contract:check"], "tsx scripts/tests/video-contract.test.ts", "video contract check must remain wired to the canonical test");

console.log("✅ Schema contract checks passed");
