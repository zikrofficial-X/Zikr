import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasAdminPermission, resolveAdminRole } from "../../src/features/admin/services/permissions";
import { resolveDestructiveMfaRequirement } from "../../src/features/admin/services/security-policy";

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
assert.equal(hasAdminPermission("moderator", "content.manage"), true);
assert.equal(hasAdminPermission("moderator", "content.publish"), false, "moderators may review content but must not see publish controls");
assert.equal(hasAdminPermission("moderator", "content.delete"), false, "moderators must not see delete controls");
assert.equal(hasAdminPermission("editor", "content.publish"), true);
assert.equal(hasAdminPermission("editor", "content.delete"), false, "editors may publish but may not delete content");
assert.equal(hasAdminPermission("content_manager", "content.delete"), true);

const contentPage = readFileSync("src/app/admin/content/page.tsx", "utf8");
const contentConsole = readFileSync("src/app/admin/content/content-console.tsx", "utf8");
assert.match(contentPage, /hasAdminPermission\(admin\.role, 'content\.publish'\)/);
assert.match(contentPage, /hasAdminPermission\(admin\.role, 'content\.delete'\)/);
assert.match(contentPage, /canPublish=\{canPublish\}/);
assert.match(contentPage, /canDelete=\{canDelete\}/);
assert.match(contentConsole, /canPublish \? <form action=\{safeTogglePublishAction\}/);
assert.match(contentConsole, /canPublish && scheduledAvailable/);
assert.match(contentConsole, /canDelete \? <form action=\{safeDeleteContentAction\}/);

assert.equal(resolveDestructiveMfaRequirement(false), false, "an explicit false setting may disable optional step-up MFA");
assert.equal(resolveDestructiveMfaRequirement(true), true);
assert.equal(resolveDestructiveMfaRequirement(undefined), true, "a missing MFA setting must fail closed");
assert.equal(resolveDestructiveMfaRequirement(null), true, "a null MFA setting must fail closed");
assert.equal(resolveDestructiveMfaRequirement("false"), true, "a malformed string must not disable destructive-action MFA");

const securityService = readFileSync("src/features/admin/services/security.ts", "utf8");
const adminSystemActions = readFileSync("src/app/admin/system-actions.ts", "utf8");
assert.match(
  adminSystemActions,
  /key === "require_mfa_for_destructive"[\s\S]*?requireAdminStepUp\("settings\.manage", "\/admin\/settings"\)/,
  "changing the destructive-action MFA policy must require step-up whenever the current policy is enabled or missing",
);
const securityPage = readFileSync("src/app/admin/security/page.tsx", "utf8");
const settingsPage = readFileSync("src/app/admin/settings/page.tsx", "utf8");
assert.match(securityService, /resolveDestructiveMfaRequirement\(rows\[0\]\?\.value\)/, "runtime enforcement must fail closed when the setting row is absent");
assert.match(securityPage, /resolveDestructiveMfaRequirement\(settings\.require_mfa_for_destructive\)/, "the security dashboard must display the same fail-closed effective policy");
assert.match(settingsPage, /key === "require_mfa_for_destructive"[\s\S]*?resolveDestructiveMfaRequirement\(values\[key\]\)/, "the settings form must show MFA enabled when the setting is missing or malformed");

const usersPage = readFileSync("src/app/admin/users/page.tsx", "utf8");
const usersTable = readFileSync("src/features/admin/components/users-table.tsx", "utf8");
const usersAction = readFileSync("src/features/admin/actions/users.ts", "utf8");
assert.match(usersPage, /hasAdminPermission\(currentAdmin\.role, "audit\.read"\)/);
assert.match(usersPage, /resolveAdminRole\(user\.role, roleByUser\.get\(user\.id\)\)/, "the users table must not display a delegated assignment for a profile that is not admin");
assert.match(usersPage, /async function getTotalUsers\(\): Promise<number \| null>/, "the users page must tolerate a failed count query without failing the whole page");
assert.match(usersPage, /totalUsers \?\? "غير متاح"/, "a failed total-user count must be shown as unavailable rather than crashing or implying zero");

assert.match(usersPage, /user_id=in\.\(/, "delegated role lookups must be scoped to the displayed user IDs");
assert.match(usersPage, /userIds\.map\(\(id\) => encodeURIComponent\(id\)\)\.join\(","\)/, "role assignment filters must encode each displayed UUID");

assert.match(usersPage, /canReadAudit \? getRecentAdminActions\(\)/, "audit rows must not be fetched for users without audit.read");
assert.match(usersPage, /canManageRoles=\{canManageRoles\}/);
assert.match(usersPage, /canAssignFullAdminAccounts=\{canAssignFullAdminAccounts\}/);
assert.match(usersTable, /!canManageRoles/);
assert.match(usersTable, /!canAssignFullAdminAccounts && \(effectiveRole === "admin" \|\| effectiveRole === "super_admin"\)/);
assert.match(usersTable, /value !== "admin" && value !== "super_admin"/);
assert.match(usersAction, /admin\.role !== "super_admin" && \(roleValue === "admin" \|\| roleValue === "super_admin"\)/);
assert.match(usersAction, /userId === admin\.id && roleValue !== admin\.role/, "the server action must block self-demotion even from super_admin to admin");
const roleIntegrationSql = readFileSync("scripts/tests/admin-role-update.integration.sql", "utf8");
assert.ok(
  !roleIntegrationSql.split(/\r?\n/).some((line) => line === "DO $" || line === "$;"),
  "anonymous PL/pgSQL blocks must use paired dollar-quote delimiters",
);
const roleIntegrationRunner = readFileSync("scripts/tests/admin-role-update.integration.sh", "utf8");
assert.ok(
  roleIntegrationRunner.includes("20261111020000_admin_role_update_blocks_self_demotion.sql"),
  "the SQL integration test must apply the self-demotion migration before exercising the RPC",
);
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
