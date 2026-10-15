#!/usr/bin/env node
import fs from "node:fs";

const failures = [];
const read = (path) => fs.readFileSync(path, "utf8");

const migrationPath = "supabase/migrations/20261002073929_phase6_security_hardening_20261002.sql";
const migration = read(migrationPath);

for (const token of [
  "REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER",
  "FROM anon;",
  "GRANT INSERT ON public.contacts TO anon;",
  "REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;",
  "REVOKE ALL ON public.admin_settings FROM anon, authenticated;",
  "REVOKE ALL ON public.content_revisions FROM anon, authenticated;",
  "REVOKE ALL ON public.video_automation_runs FROM anon, authenticated;",
  "REVOKE ALL ON public.youtube_sync_state FROM anon, authenticated;",
]) {
  if (!migration.includes(token)) failures.push(`${migrationPath} missing security contract: ${token}`);
}

const contactMigrationPath = "supabase/migrations/20261015050000_secure_contact_submission.sql";
const contactMigration = read(contactMigrationPath);
for (const token of [
  "REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER",
  "ON TABLE public.contacts",
  "FROM PUBLIC, anon, authenticated;",
  "DROP POLICY IF EXISTS contacts_public_insert ON public.contacts;",
]) {
  if (!contactMigration.includes(token)) failures.push(`${contactMigrationPath} missing security contract: ${token}`);
}

const contactService = read("src/features/contact/services/contact.ts");
if (!contactService.includes("createAdminClient()")) {
  failures.push("contact submission must use server-only privileged database access after public writes are revoked");
}
if (contactService.includes("createClient()")) {
  failures.push("contact submission must not use the public/session database client to write contacts");
}

const legacy = read("src/app/api/kids/games/submit-result/route.ts");
for (const token of [
  "recordKidsGameResultForUser",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  'Deprecation: "true"',
  'status: 405',
]) {
  if (!legacy.includes(token)) failures.push(`legacy kids route missing hardening token: ${token}`);
}
for (const forbidden of [
  "SUPABASE_SERVICE_ROLE_KEY",
  ".from('kids_game_results').insert",
  ".from('kids_game_progress').upsert",
  ".from('kids_achievements').insert",
]) {
  if (legacy.includes(forbidden)) failures.push(`legacy kids route still contains privileged operation: ${forbidden}`);
}
if (legacy.includes("// @ts-nocheck")) {
  failures.push("legacy kids route must not use @ts-nocheck");
}

const games = read("src/features/kids/services/games.ts");
if (!games.includes("export async function recordKidsGameResultForUser(")) {
  failures.push("kids games service is missing the shared authenticated result processor");
}
if (!games.includes("validateGameResultPayload(body)")) {
  failures.push("kids games service must validate result payloads before privileged RPC execution");
}
if (!games.includes('kids_record_game_result_internal')) {
  failures.push("kids games service must use the secure service-role RPC");
}

if (failures.length) {
  console.error("SECURITY_HARDENING_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Phase 6 repository security-hardening checks passed");
