#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20261030050000_admin_rbac_permission_scope.sql",
);
const migration = readFileSync(migrationPath, "utf8");
const permissionService = readFileSync(resolve(process.cwd(), "src/features/admin/services/permissions.ts"), "utf8");
const publicRpcMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261030100000_admin_public_rpc_invoker.sql"),
  "utf8",
);
const userActions = readFileSync(
  resolve(process.cwd(), "src/features/admin/actions/users.ts"),
  "utf8",
);
const atomicRoleMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261101170000_admin_atomic_role_update.sql"),
  "utf8",
);
const selfRoleMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261111020000_admin_role_update_blocks_self_demotion.sql"),
  "utf8",
);
const roleAssignmentWritesMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261111050000_admin_role_assignments_service_role_only.sql"),
  "utf8",
);
const revokePublicAdminPredicateMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261111000000_revoke_anon_public_admin_predicate.sql"),
  "utf8",
);
const contentService = readFileSync(
  resolve(process.cwd(), "src/features/admin/services/content.ts"),
  "utf8",
);
const siteAudioMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261101190000_admin_atomic_site_audio_primary.sql"),
  "utf8",
);
const siteAudioRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/site-audio/route.ts"),
  "utf8",
);
const rlsEventTriggerMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261106205519_revoke_public_execution_on_rls_auto_enable.sql"),
  "utf8",
);
const editorialActions = readFileSync(
  resolve(process.cwd(), "src/app/admin/editorial-actions.ts"),
  "utf8",
);
const queuesPage = readFileSync(
  resolve(process.cwd(), "src/app/admin/queues/page.tsx"),
  "utf8",
);
const socialRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/social/route.ts"),
  "utf8",
);
const writtenSocialRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/social/written/route.ts"),
  "utf8",
);
const videoRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/videos/[id]/route.ts"),
  "utf8",
);
const videoGenerationRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/admin/video-generation/route.ts"),
  "utf8",
);

function requireMatch(pattern, description) {
  assert.match(migration, pattern, `Missing admin RLS invariant: ${description}`);
}

requireMatch(
  /CREATE OR REPLACE FUNCTION private\.current_admin_role\(\)[\s\S]*?WHEN p\.role::text IS DISTINCT FROM 'admin' THEN 'user'[\s\S]*?WHEN assignment\.role IS NOT NULL THEN assignment\.role[\s\S]*?ELSE 'admin'/i,
  "assigned roles must be resolved separately from the legacy admin profile flag",
);
requireMatch(
  /CREATE OR REPLACE FUNCTION private\.has_admin_role\(required_roles text\[\]\)[\s\S]*?= ANY\(COALESCE\(required_roles, ARRAY\[\]::text\[\]\)\)/i,
  "role checks must use an explicit allow-list",
);
requireMatch(
  /CREATE OR REPLACE FUNCTION private\.is_admin_user\(\)[\s\S]*?private\.has_admin_role\(ARRAY\['admin', 'super_admin'\]::text\[\]\)/i,
  "global RLS administration must exclude delegated roles",
);
requireMatch(
  /CREATE OR REPLACE FUNCTION public\.is_admin_user\(\)[\s\S]*?SELECT private\.is_admin_user\(\)/i,
  "the public compatibility predicate must not retain the old broad check",
);

const policyBlock = migration.slice(migration.indexOf("DROP POLICY IF EXISTS admin_role_assignments_select"));
assert.doesNotMatch(
  policyBlock,
  /FROM public\.profiles[\s\S]*?role::?text?\s*=\s*'admin'/i,
  "RLS policies must not infer full administrator access from profiles.role alone",
);

assert.match(
  roleAssignmentWritesMigration,
  /REVOKE ALL PRIVILEGES ON TABLE public\.admin_role_assignments[\s\S]*?FROM PUBLIC, anon, authenticated/i,
  "browser roles must not mutate role assignments outside the audited service RPC",
);
assert.match(
  roleAssignmentWritesMigration,
  /GRANT SELECT ON TABLE public\.admin_role_assignments TO authenticated/i,
  "authenticated sessions must retain the role read needed for delegated-admin resolution",
);
assert.match(
  roleAssignmentWritesMigration,
  /GRANT SELECT, INSERT, UPDATE, DELETE[\s\S]*?TO service_role/i,
  "the service role must retain the atomic role RPC's table access",
);
for (const policy of ["write", "insert", "update", "delete"]) {
  assert.match(
    roleAssignmentWritesMigration,
    new RegExp("DROP POLICY IF EXISTS admin_role_assignments_" + policy + " ON public\\.admin_role_assignments", "i"),
    "direct role-assignment " + policy + " policy must be removed",
  );
}
assert.doesNotMatch(
  roleAssignmentWritesMigration,
  /CREATE POLICY admin_role_assignments_(?:write|insert|update|delete)/i,
  "no browser-facing role-assignment write policy may remain",
);
assert.match(
  userActions,
  /admin\.role !== "super_admin" && \(roleValue === "admin" \|\| roleValue === "super_admin"\)/,
  "only a super administrator may assign either full-admin role",
);
assert.match(
  userActions,
  /userId === admin\.id && roleValue !== admin\.role/,
  "the server action must reject every self-role change",
);
assert.match(
  selfRoleMigration,
  /IF p_user_id = p_actor_user_id AND p_role <> v_previous_role THEN[\s\S]*?self-role changes are not allowed through this action/i,
  "the database transaction must reject self-promotion and self-demotion",
);
assert.match(
  selfRoleMigration,
  /IF v_actor_role <> 'super_admin' AND \([\s\S]*?v_previous_role IN \('admin', 'super_admin'\)[\s\S]*?p_role IN \('admin', 'super_admin'\)/i,
  "only super administrators may manage full-admin accounts",
);
assert.match(
  selfRoleMigration,
  /REVOKE ALL ON FUNCTION public\.admin_update_user_role\(uuid, text, uuid\)[\s\S]*?FROM PUBLIC, anon, authenticated[\s\S]*?GRANT EXECUTE ON FUNCTION public\.admin_update_user_role\(uuid, text, uuid\)[\s\S]*?TO service_role/i,
  "the self-role protection RPC must remain service-role only",
);
assert.match(
  atomicRoleMigration,
  /v_actor_role <> 'super_admin'[\s\S]*?v_previous_role IN \('admin', 'super_admin'\)/,
  "the atomic database function must prevent delegated administrators from managing full-admin accounts",
);
requireMatch(
  /CREATE POLICY admin_audit_events_admin_select[\s\S]*?'analyst'/i,
  "audit visibility must match the audit.read role set",
);
requireMatch(
  /CREATE POLICY admin_queue_alert_deliveries_admin_read[\s\S]*?'support'/i,
  "alert delivery visibility must match notifications.manage",
);
requireMatch(
  /CREATE POLICY social_publish_queue_admin_write[\s\S]*?'social_manager'/i,
  "social queue writes must be restricted to social managers and full admins",
);
requireMatch(
  /SET search_path = ''/i,
  "security-definer functions must use an empty search path",
);

assert.match(
  publicRpcMigration,
  /CREATE OR REPLACE FUNCTION public\.is_admin_user\(\)[\s\S]*?SECURITY INVOKER[\s\S]*?SELECT private\.is_admin_user\(\)/i,
  "the exposed compatibility wrapper must execute as invoker, not definer",
);
assert.doesNotMatch(
  publicRpcMigration,
  /CREATE OR REPLACE FUNCTION public\.is_admin_user\(\)[\s\S]*?SECURITY DEFINER/i,
  "the public RPC must not become a security-definer entry point",
);
assert.match(
  publicRpcMigration,
  /GRANT EXECUTE ON FUNCTION public\.is_admin_user\(\) TO anon, authenticated, service_role/i,
  "the wrapper must remain callable where public-read RLS policies reference it",
);

assert.match(
  revokePublicAdminPredicateMigration,
  /REVOKE EXECUTE ON FUNCTION public\.is_admin_user\(\) FROM PUBLIC, anon/i,
  "anonymous execute must be revoked from PUBLIC as well as anon so inherited grants cannot survive",
);
assert.doesNotMatch(
  revokePublicAdminPredicateMigration,
  /REVOKE EXECUTE ON FUNCTION public\.is_admin_user\(\) FROM PUBLIC, anon, authenticated/i,
  "the authenticated compatibility grant must remain intact",
);

assert.match(
  atomicRoleMigration,
  /CREATE OR REPLACE FUNCTION public\.admin_update_user_role\([\s\S]*?SECURITY INVOKER[\s\S]*?SET search_path = ''/i,
  "role updates must use a fixed-search-path invoker RPC",
);
assert.match(
  atomicRoleMigration,
  /INSERT INTO public\.admin_audit_events[\s\S]*?'users\.role\.update'[\s\S]*?GRANT EXECUTE ON FUNCTION public\.admin_update_user_role\(uuid, text, uuid\)[\s\S]*?TO service_role/i,
  "role changes and audit entries must commit inside one service-role-only database transaction",
);
assert.match(
  atomicRoleMigration,
  /REVOKE ALL ON FUNCTION public\.admin_update_user_role\(uuid, text, uuid\)[\s\S]*?FROM PUBLIC, anon, authenticated/i,
  "the atomic role RPC must not be callable from browser roles",
);
assert.match(
  userActions,
  /supabaseServerAdminRequest\([\s\S]*?["']\/rest\/v1\/rpc\/admin_update_user_role["'][\s\S]*?p_actor_user_id: admin\.id/,
  "the role server action must call the atomic RPC using the authenticated server actor",
);
assert.doesNotMatch(
  userActions,
  /supabaseServerAdminRequest\([\s\S]*?["']\/rest\/v1\/(?:admin_role_assignments|profiles\?id=eq\.)/,
  "the role server action must not split one role change across independent REST mutations",
);
assert.match(
  contentService,
  /const encodedId = encodeURIComponent\(id\);[\s\S]*?id=eq\.\$\{encodedId\}&updated_at=eq\.\$\{encodeURIComponent\(String\(target\.updated_at\)\)\}[\s\S]*?Prefer: "return=representation"[\s\S]*?if \(!updated\?\.length\)/,
  "content publish toggles must compare-and-set and verify the affected row",
);
assert.match(
  contentService,
  /\/rest\/v1\/\$\{table\}\?id=eq\.\$\{encodeURIComponent\(id\)\}&updated_at=eq\.\$\{encodeURIComponent\(String\(current\[0\]\.updated_at\)\)\}[\s\S]*?method: "DELETE"[\s\S]*?if \(!deleted\.length\)/,
  "content deletion must compare-and-set against the row version",
);
assert.match(
  editorialActions,
  /updateEditorialContentAtVersion[\s\S]*?return rows\.length > 0/,
  "editorial mutations must update using a version predicate and check affected rows",
);
assert.match(
  queuesPage,
  /hasAdminPermission\(admin\.role, "video\.manage"\)[\s\S]*?hasAdminPermission\(admin\.role, "social\.manage"\)/,
  "the operations page must not read module queues beyond the viewer's role permissions",
);
assert.match(
  socialRoute,
  /requireAdminApi\("social\.manage"\)[\s\S]*?requireAdminStepUpApi\("social\.publish"/,
  "social execution must require separate management and publishing permissions",
);
assert.match(
  socialRoute,
  /dispatchGitHubWorkflow\("publish-social\.yml"/,
  "social API must dispatch the controlled GitHub publisher",
);
assert.match(
  writtenSocialRoute,
  /requireAdminApi\("social\.manage"\)[\s\S]*?requireAdminStepUpApi\("social\.publish"/,
  "written-content generation must require separate management permission and publishing permission with MFA step-up",
);
assert.match(
  writtenSocialRoute,
  /dispatchGitHubWorkflow\("generate-written-content\.yml"/,
  "written-content generation must dispatch only the controlled GitHub workflow",
);
assert.doesNotMatch(
  socialRoute,
  /SOCIAL_PUBLISHING_RETIRED|status: 410/,
  "social API must not remain in its retired state",
);
assert.match(
  videoRoute,
  /recordAdminAuditEvent\([\s\S]*?video_generation\.update[\s\S]*?recordAdminAuditEvent\([\s\S]*?video_generation\.delete_failed/,
  "video mutation endpoints must append audit events",
);
const legacyVideoPatch = videoRoute.match(/export async function PATCH\([\s\S]*?(?=export async function DELETE|$)/)?.[0] ?? "";
assert.match(
  legacyVideoPatch,
  /status === 'pending'[\s\S]*?youtube_id: null[\s\S]*?facebook_id: null[\s\S]*?video_url: null/,
  "resetting a legacy video request must clear stale platform IDs and media URLs before it returns to the generation queue",
);


assert.match(
  siteAudioMigration,
  /CREATE OR REPLACE FUNCTION public\.admin_set_primary_site_audio_asset\([\s\S]*?SECURITY INVOKER[\s\S]*?SET search_path = ''/i,
  "primary audio changes must use a fixed-search-path invoker RPC",
);
assert.match(
  siteAudioMigration,
  /UPDATE public\.site_audio_assets[\s\S]*?SET is_primary = false[\s\S]*?UPDATE public\.site_audio_assets[\s\S]*?SET is_primary = true[\s\S]*?INSERT INTO public\.admin_audit_events[\s\S]*?'site_audio\.primary\.set'/i,
  "primary audio change and its audit event must run in one database transaction",
);
assert.match(
  siteAudioMigration,
  /REVOKE ALL ON FUNCTION public\.admin_set_primary_site_audio_asset\(uuid, text, uuid\)[\s\S]*?FROM PUBLIC, anon, authenticated[\s\S]*?GRANT EXECUTE ON FUNCTION public\.admin_set_primary_site_audio_asset\(uuid, text, uuid\)[\s\S]*?TO service_role/i,
  "primary audio RPC must be executable by service_role only",
);
assert.match(
  siteAudioRoute,
  /rpc\/admin_set_primary_site_audio_asset[\s\S]*?p_actor_user_id: guard\.profile\.id/,
  "primary audio API must call the atomic RPC with the authenticated actor",
);
assert.doesNotMatch(
  siteAudioRoute,
  /update\(\{ is_primary: false \}\)/,
  "the API route must not clear primary audio in a separate non-atomic request",
);

const socialManagerPermissions = permissionService.match(/social_manager:\s*\[([\s\S]*?)\],/);
const videoManagerPermissions = permissionService.match(/video_manager:\s*\[([\s\S]*?)\],/);
assert.ok(socialManagerPermissions?.[1].includes("'social.manage'"));
assert.ok(socialManagerPermissions?.[1].includes("'social.publish'"));
assert.equal(socialManagerPermissions?.[1].includes("'video.manage'"), false);
assert.equal(socialManagerPermissions?.[1].includes("'video.delete'"), false);
assert.ok(videoManagerPermissions?.[1].includes("'video.manage'"));
assert.equal(videoManagerPermissions?.[1].includes("'social.publish'"), false);
assert.equal(videoManagerPermissions?.[1].includes("'social.manage'"), false);

assert.ok(
  rlsEventTriggerMigration.includes("to_regprocedure('public.rls_auto_enable()')") &&
    rlsEventTriggerMigration.includes(
      "REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated",
    ),
  "RLS event-trigger function must not be callable by browser roles",
);

const videoGenerationDelete = videoGenerationRoute.match(
  /export async function DELETE\([\s\S]*?(?=export async function PATCH|$)/,
)?.[0] ?? "";
assert.match(
  videoGenerationDelete,
  /requireAdminStepUpApi\(['"]video\.delete['"]/,
  "bulk video-generation deletion must require the dedicated video.delete permission and MFA step-up",
);
assert.doesNotMatch(
  videoGenerationDelete,
  /requireAdminApi\(['"]video\.manage['"]/,
  "video-generation deletion must not be authorized by the less-privileged video.manage permission",
);

console.log("Admin RBAC/RLS migration contract passed.");
