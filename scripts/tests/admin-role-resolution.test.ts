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
assert.match(adminService, /error: assignmentError/, "the assignment query error must be captured");
assert.match(
  adminService,
  /resolveAdminRole\(\s*profile\.role,\s*assignment\?\.role,\s*Boolean\(assignmentError\),\s*\)/,
  "the role resolver must receive the lookup failure state",
);

console.log("Admin role resolution fail-closed tests passed.");
