#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20261030050000_admin_rbac_permission_scope.sql",
);
const migration = readFileSync(migrationPath, "utf8");
const publicRpcMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261030100000_admin_public_rpc_invoker.sql"),
  "utf8",
);
const userActions = readFileSync(
  resolve(process.cwd(), "src/features/admin/actions/users.ts"),
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

requireMatch(
  /CREATE POLICY admin_role_assignments_insert[\s\S]*?private\.has_admin_role\(ARRAY\['super_admin'\]::text\[\]\)/i,
  "direct role assignment inserts must be restricted to super_admin",
);
requireMatch(
  /CREATE POLICY admin_role_assignments_update[\s\S]*?private\.has_admin_role\(ARRAY\['super_admin'\]::text\[\]\)/i,
  "direct role assignment updates must be restricted to super_admin",
);
requireMatch(
  /CREATE POLICY admin_role_assignments_delete[\s\S]*?private\.has_admin_role\(ARRAY\['super_admin'\]::text\[\]\)/i,
  "direct role assignment deletes must be restricted to super_admin",
);
assert.match(
  userActions,
  /isFullAdminTarget[\s\S]*?isGrantingFullAdmin[\s\S]*?admin\.role !== ["']super_admin["']/,
  "server actions must protect full-admin accounts and full-admin role grants from delegated administrators",
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
  /CREATE OR REPLACE FUNCTION public\\.is_admin_user\\(\\)[\\s\\S]*?SECURITY INVOKER[\\s\\S]*?SELECT private\\.is_admin_user\\(\\)/i,
  "the exposed compatibility wrapper must execute as invoker, not definer",
);
assert.doesNotMatch(
  publicRpcMigration,
  /CREATE OR REPLACE FUNCTION public\\.is_admin_user\\(\\)[\\s\\S]*?SECURITY DEFINER/i,
  "the public RPC must not become a security-definer entry point",
);
assert.match(
  publicRpcMigration,
  /GRANT EXECUTE ON FUNCTION public\\.is_admin_user\\(\\) TO anon, authenticated, service_role/i,
  "the wrapper must remain callable where public-read RLS policies reference it",
);

console.log("Admin RBAC/RLS migration contract passed.");
