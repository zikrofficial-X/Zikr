import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasAdminPermission, resolveAdminRole } from "../../src/features/admin/services/permissions";

assert.equal(resolveAdminRole("admin", null), "admin", "a full admin without a delegated assignment remains a full admin");
assert.equal(resolveAdminRole("admin", "content_manager"), "content_manager", "a valid delegated assignment must be respected");
assert.equal(resolveAdminRole("admin", "editor"), "editor");
assert.equal(resolveAdminRole("admin", "moderator"), "moderator");
assert.equal(resolveAdminRole("admin", null, true), "user", "an assignment lookup failure must never promote a delegated admin");
assert.equal(resolveAdminRole("admin", "not-a-role"), "user", "an invalid assignment must fail closed");
assert.equal(resolveAdminRole("admin", "__proto__"), "user", "inherited object keys are not valid roles");
assert.equal(resolveAdminRole("user", "content_manager"), "user", "delegated assignments cannot override a non-admin profile flag");
assert.equal(resolveAdminRole("user", null), "user");
assert.equal(hasAdminPermission("support", "users.read"), true);
assert.equal(hasAdminPermission("support", "audit.read"), false, "support must not inherit audit access from users.read");
assert.equal(hasAdminPermission("support", "users.roles"), false, "read-only support must not receive role-management controls");
assert.equal(hasAdminPermission("admin", "users.roles"), true);
assert.equal(hasAdminPermission("admin", "audit.read"), true);
assert.equal(hasAdminPermission("super_admin", "users.roles"), true);

const usersPage = readFileSync("src/app/admin/users/page.tsx", "utf8");
const usersTable = readFileSync("src/features/admin/components/users-table.tsx", "utf8");
const usersAction = readFileSync("src/features/admin/actions/users.ts", "utf8");
assert.match(usersPage, /hasAdminPermission\(currentAdmin\.role, "audit\.read"\)/);
assert.match(usersPage, /canReadAudit \? getRecentAdminActions\(\)/, "audit rows must not be fetched for users without audit.read");
assert.match(usersPage, /canManageRoles=\{canManageRoles\}/);
assert.match(usersPage, /canAssignFullAdminAccounts=\{canAssignFullAdminAccounts\}/);
assert.match(usersTable, /!canManageRoles/);
assert.match(usersTable, /!canAssignFullAdminAccounts && \(effectiveRole === "admin" \|\| effectiveRole === "super_admin"\)/);
assert.match(usersTable, /value !== "admin" && value !== "super_admin"/);
assert.match(usersAction, /admin\.role !== "super_admin" && \(roleValue === "admin" \|\| roleValue === "super_admin"\)/);
assert.match(usersAction, /userId === admin\.id && roleValue !== admin\.role/, "the server action must block self-demotion even from super_admin to admin");
const selfRoleMigration = readFileSync("supabase/migrations/20261111020000_admin_role_update_blocks_self_demotion.sql", "utf8");
assert.match(selfRoleMigration, /p_user_id = p_actor_user_id AND p_role <> v_previous_role/);
assert.match(selfRoleMigration, /self-role changes are not allowed/);



const adminPredicateGrantMigration = readFileSync("supabase/migrations/20261111000000_revoke_anon_public_admin_predicate.sql", "utf8");
assert.match(
  adminPredicateGrantMigration,
  /REVOKE EXECUTE ON FUNCTION public\.is_admin_user\(\) FROM\s+PUBLIC,\s*anon;/i,
  "anonymous clients must not retain EXECUTE on the public admin compatibility wrapper",
);

const adminService = readFileSync("src/features/admin/services/admin.ts", "utf8");
const profileService = readFileSync("src/features/profile/services/profile.ts", "utf8");
assert.match(adminService, /error: assignmentError/, "the assignment query error must be captured");
assert.match(
  adminService,
  /resolveAdminRole\(\s*profile\.role,\s*assignment\?\.role,\s*Boolean\(assignmentError\),\s*\)/,
  "the role resolver must receive the lookup failure state",
);
assert.match(
  profileService,
  /resolveAdminRole\(\s*profileRes\.data\?\.\[0\]\?\.role,\s*assignmentRes\.data\?\.role,\s*Boolean\(assignmentRes\.error\),?\s*\)/,
  "profile UI data must use the same fail-closed role resolver",
);
assert.match(
  profileService,
  /assignedRole\s*=\s*effectiveRole !== "admin" && effectiveRole !== "user"/,
  "profile UI must not expose an admin shortcut when role resolution fails",
);

console.log("Admin role resolution fail-closed tests passed.");
