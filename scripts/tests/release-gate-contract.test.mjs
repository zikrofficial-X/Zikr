import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/release-vercel.yml", "utf8");
const gate = readFileSync("scripts/verify-release-gates.mjs", "utf8");

assert.match(workflow, /checks:\s*read/);
assert.match(workflow, /statuses:\s*read/);
assert.match(workflow, /pull-requests:\s*read/);
assert.ok(workflow.includes("node scripts/verify-release-gates.mjs"));
assert.ok(
  workflow.indexOf("verify-release-gates.mjs") < workflow.indexOf("verify-production-smoke.mjs"),
  "exact-commit and CODEOWNER checks must run before production smoke requests",
);
assert.doesNotMatch(workflow, /Quality gate:\s*PASSED/i, "the workflow must not hardcode a successful quality-gate claim");

assert.match(gate, /CODEOWNERS/);
assert.match(gate, /merge_commit_sha === commitSha/);
assert.match(gate, /APPROVED/);
assert.match(gate, /check-runs/);
assert.ok(gate.includes("ci/circleci:"));
assert.match(gate, /required check/);
assert.match(gate, /pending/);

console.log("Release preflight contract passed: exact commit checks, CODEOWNER approval, and production smoke ordering are enforced.");
