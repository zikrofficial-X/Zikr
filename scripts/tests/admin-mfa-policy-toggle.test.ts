import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shouldRequireAdminStepUp } from "../../src/features/admin/services/security-policy";

const read = (path: string) => readFileSync(path, "utf8");
const security = read("src/features/admin/services/security.ts");
const actions = read("src/app/admin/system-actions.ts");

assert.equal(shouldRequireAdminStepUp(false), false, "ordinary destructive actions may follow an explicit disabled policy");
assert.equal(shouldRequireAdminStepUp(true), true, "an enabled policy must require AAL2");
assert.equal(shouldRequireAdminStepUp(false, true), true, "the policy toggle itself must always require AAL2");

assert.match(
  security,
  /requireAdminStepUp\(permission: AdminPermission, nextPath = ["']\/admin["'], forceMfa = false\)/,
  "the server-action guard must support an unconditional step-up override",
);
assert.match(
  security,
  /requireAdminStepUpApi\([\s\S]*?forceMfa = false/,
  "the API guard must support the same unconditional step-up override",
);
assert.equal(
  (security.match(/shouldRequireAdminStepUp\(await destructiveMfaRequired\(\), forceMfa\)/g) ?? []).length,
  2,
  "both page and API guards must honor the force flag",
);
assert.match(
  actions,
  /key === ["']require_mfa_for_destructive["'][\s\S]*?requireAdminStepUp\(["']settings\.manage["'], ["']\/admin\/settings["'], true\)/,
  "changing the destructive-MFA policy must force step-up even when the current policy is disabled",
);
assert.ok(
  actions.indexOf('requireAdminStepUp("settings.manage", "/admin/settings", true)') <
    actions.indexOf('await supabaseServerAdminRequest("/rest/v1/admin_settings?on_conflict=key"'),
  "step-up authorization must precede the privileged settings mutation",
);

console.log("Admin MFA policy-toggle step-up regression passed.");
