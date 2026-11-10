import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveAdminRole } from "../../src/features/admin/services/permissions";

assert.equal(resolveAdminRole("admin", null), "admin", "a full admin without a delegated assignment remains a full admin");
assert.equal(resolveAdminRole("admin", "content_manager"), "content_manager", "a valid delegated assignment must be respected");
assert.equal(resolveAdminRole("admin", "editor"), "editor");
assert.equal(resolveAdminRole("admin", "moderator"), "moderator");
assert.equal(resolveAdminRole("admin", null, true), "user", "an assignment lookup failure must never promote a delegated admin");
assert.equal(resolveAdminRole("admin", "not-a-role"), "user", "an invalid assignment must fail closed");
assert.equal(resolveAdminRole("admin", "__proto__"), "user", "inherited object keys are not valid roles");
assert.equal(resolveAdminRole("user", "content_manager"), "user", "delegated assignments cannot override a non-admin profile flag");
assert.equal(resolveAdminRole("user", null), "user");

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
  /resolveAdminRole\(\s*profileRes\.data\?\.\[0\]\?\.role,\s*assignmentRes\.data\?\.role,\s*Boolean\(assignmentRes\.error\)\s*\)/,
  "profile UI data must use the same fail-closed role resolver",
);
assert.match(
  profileService,
  /assignedRole\s*=\s*effectiveRole !== "admin" && effectiveRole !== "user"/,
  "profile UI must not expose an admin shortcut when role resolution fails",
);

console.log("Admin role resolution fail-closed tests passed.");
