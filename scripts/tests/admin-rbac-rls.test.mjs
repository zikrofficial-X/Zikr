#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261030050000_admin_rbac_permission_scope.sql", "utf8");
const userActions = readFileSync("src/features/admin/actions/users.ts", "utf8");

const checks = [
  [/CREATE OR REPLACE FUNCTION private\.current_admin_role\(\)[\s\S]*?WHEN p\.role::text IS DISTINCT FROM 'admin' THEN 'user'[\s\S]*?WHEN assignment\.role IS NOT NULL THEN assignment\.role[\s\S]*?ELSE 'admin'/i, "delegated roles must be resolved separately from legacy admin profiles"],
  [/CREATE OR REPLACE FUNCTION private\.has_admin_role\(required_roles text\[\]\)[\s\S]*?= ANY\(COALESCE\(required_roles, ARRAY\[\]::text\[\]\)\)/i, "role checks must use explicit allow-lists"],
  [/CREATE OR REPLACE FUNCTION private\.is_admin_user\(\)[\s\S]*?private\.has_admin_role\(ARRAY\['admin', 'super_admin'\]::text\[\]\)/i, "global administrator access must exclude delegated roles"],
  [/CREATE OR REPLACE FUNCTION public\.is_admin_user\(\)[\s\S]*?SELECT private\.is_admin_user\(\)/i, "public compatibility function must delegate to the private predicate"],
  [/CREATE POLICY admin_role_assignments_insert[\s\S]*?private\.has_admin_role\(ARRAY\['super_admin'\]::text\[\]\)/i, "role assignment inserts must be super-admin only"],
  [/CREATE POLICY admin_role_assignments_update[\s\S]*?private\.has_admin_role\(ARRAY\['super_admin'\]::text\[\]\)/i, "role assignment updates must be super-admin only"],
  [/CREATE POLICY admin_role_assignments_delete[\s\S]*?private\.has_admin_role\(ARRAY\['super_admin'\]::text\[\]\)/i, "role assignment deletes must be super-admin only"],
  [/CREATE POLICY admin_audit_events_admin_select[\s\S]*?'analyst'/i, "audit visibility must follow the audit.read role set"],
  [/CREATE POLICY admin_queue_alert_deliveries_admin_read[\s\S]*?'support'/i, "queue alerts must follow notifications.manage role scope"],
  [/CREATE POLICY social_publish_queue_admin_write[\s\S]*?'social_manager'/i, "social queue writes must be restricted to social managers and full admins"],
  [/SET search_path = ''/i, "security-definer functions must use an empty search path"],
];
for (const [pattern, description] of checks) assert.match(migration, pattern, description);
assert.match(userActions, /previousRole === "super_admin"[\s\S]*?admin\.role !== "super_admin"/, "delegated admins must not modify super-admin accounts");
console.log("Admin RBAC/RLS contract passed.");
