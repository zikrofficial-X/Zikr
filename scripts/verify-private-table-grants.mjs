#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migrationPath = "supabase/migrations/20261101135000_revoke_anon_privileges_private_tables.sql";
const sql = readFileSync(migrationPath, "utf8");
const contactService = readFileSync("src/features/contact/services/contact.ts", "utf8");
const contactRoute = readFileSync("src/app/api/contact/route.ts", "utf8");
assert.ok(contactService.includes('import "server-only"'), "public contact inserts must stay in a server-only service");
assert.ok(contactService.includes("createAdminClient()") && contactService.includes('.from("contacts").insert'), "contact form must use the service-role server API, not anon table grants");
assert.ok(contactRoute.includes("submitContactMessage("), "public contact form must submit through the validated /api/contact handler");


const privateTables = [
  "admin_page_views",
  "admin_queue_alert_deliveries",
  "admin_role_assignments",
  "background_reminder_preferences",
  "contacts",
  "content_agent_queue",
  "content_agent_runs",
  "content_publish_queue",
  "content_translation_queue",
  "favorites",
  "memorization_progress",
  "notifications",
  "prayer_notification_deliveries",
  "prayer_notifications",
  "prayer_preferences",
  "profiles",
  "push_subscriptions",
  "reading_progress",
  "recent_recitations",
  "reciter_favorites",
  "reminders",
  "social_publish_queue",
  "social_sync_jobs",
  "social_sync_state",
  "social_platform_profiles",
  "tawasheeh_favorites",
  "user_behavior",
  "video_automation_runs",
  "video_generation_requests",
];

assert.ok(sql.includes("REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon"), "migration must revoke all direct table privileges from anon");
assert.ok(sql.includes("to_regclass("), "migration must safely skip tables absent in a fresh/partial schema");
assert.ok(sql.includes("BEGIN;") && sql.includes("COMMIT;"), "grant hardening must be transactional");
assert.ok(sql.includes("DO $anon_acl$") && sql.includes("\nEND;\n$anon_acl$;"), "migration must use a valid named SQL block");
for (const table of ["hadiths", "stories", "scholars"]) {
  assert.ok(sql.includes(table + "_public_read_published"), "anonymous public-read policy must be explicit for " + table);
  assert.ok(sql.includes(table + "_authenticated_read_published_or_admin"), "authenticated admin-read policy must remain for " + table);
}
assert.ok(sql.includes("REVOKE EXECUTE ON FUNCTION private.is_admin_user() FROM anon"), "anonymous role must not execute the SECURITY DEFINER admin predicate");
assert.ok(sql.includes("REVOKE ALL PRIVILEGES ON SEQUENCE public.social_sync_jobs_id_seq FROM anon"), "anonymous role must not read or advance the private social sync sequence");
assert.ok(sql.includes("to_regclass('public.social_sync_jobs_id_seq')"), "sequence revocation must safely handle fresh/partial schemas");




for (const table of privateTables) {
  assert.ok(sql.includes("'" + table + "'"), "private table is missing from the anon-grant hardening list: " + table);
}

if (/REVOKE\s+ALL\s+PRIVILEGES[\s\S]{0,120}\s+FROM\s+(authenticated|service_role)/i.test(sql)) {
  throw new Error("migration must preserve authenticated and service_role table privileges");
}
const droppedPolicies = [...sql.matchAll(/DROP\s+POLICY\s+IF\s+EXISTS\s+([a-z_]+)/gi)]
  .map((match) => match[1])
  .sort();
assert.deepEqual(
  droppedPolicies,
  ["public_read_hadiths", "public_read_scholars", "public_read_stories", "social_platform_profiles_public_read", "youtube_sync_state_public_read"],
  "only the three admin-aware public-read policies and two server-only social sync policies may be removed",
);
if (/DISABLE\s+ROW\s+LEVEL\s+SECURITY|TRUNCATE\s+TABLE|DELETE\s+FROM/i.test(sql)) {
  throw new Error("grant hardening migration must not disable RLS or modify application data");
}

console.log("Private-table anonymous-grant hardening contract passed.");


const defaultFunctionMigration = readFileSync("supabase/migrations/20261114020000_revoke_client_default_function_execute.sql", "utf8");
assert.ok(
  defaultFunctionMigration.includes("ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public"),
  "future public functions created by postgres must use hardened defaults",
);
assert.ok(
  defaultFunctionMigration.includes("REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated"),
  "future public functions must not inherit browser-role EXECUTE",
);
assert.ok(
  defaultFunctionMigration.includes("ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public"),
  "future public functions created by supabase_admin must use hardened defaults",
);
assert.ok(
  defaultFunctionMigration.includes("BEGIN;") && defaultFunctionMigration.includes("COMMIT;"),
  "default function privilege hardening must be transactional",
);
