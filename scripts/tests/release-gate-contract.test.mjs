import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasCurrentCodeOwnerApproval } from "../lib/release-gate-approval.mjs";

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
const approval = readFileSync("scripts/lib/release-gate-approval.mjs", "utf8");
assert.match(approval, /APPROVED/);
assert.ok(gate.includes("hasCurrentCodeOwnerApproval(reviews, owner, pullRequest.head.sha)"),
  "release preflight must bind CODEOWNER approval to the exact current PR head");
assert.ok(gate.includes("owners.find("),
  "one approved owner from a multi-owner CODEOWNERS rule must be sufficient");

const currentHead = "current-head-sha";
const staleApproval = [{
  user: { login: "Zikrmediaofficial" },
  state: "APPROVED",
  commit_id: "previous-head-sha",
  submitted_at: "2026-11-14T09:00:00Z",
}];
assert.equal(
  hasCurrentCodeOwnerApproval(staleApproval, "Zikrmediaofficial", currentHead),
  false,
  "an approval tied to an earlier commit must not authorize the current release",
);
const currentApproval = [{
  user: { login: "Zikrmediaofficial" },
  state: "APPROVED",
  commit_id: currentHead,
  submitted_at: "2026-11-14T09:10:00Z",
}];
assert.equal(
  hasCurrentCodeOwnerApproval(currentApproval, "Zikrmediaofficial", currentHead),
  true,
  "an approval for the exact current head must be accepted",
);
assert.equal(
  hasCurrentCodeOwnerApproval([
    ...currentApproval,
    {
      user: { login: "Zikrmediaofficial" },
      state: "COMMENTED",
      commit_id: currentHead,
      submitted_at: "2026-11-14T09:11:00Z",
    },
  ], "Zikrmediaofficial", currentHead),
  false,
  "a later non-approval review must supersede an earlier approval",
);
assert.equal(
  ["Zikrmediaofficial", "another-owner"].some((owner) =>
    hasCurrentCodeOwnerApproval(currentApproval, owner, currentHead)),
  true,
  "one of the listed global CODEOWNERS may approve the release",
);
assert.match(gate, /check-runs/);
assert.ok(gate.includes("ci/circleci:"));
assert.match(gate, /required check/);
assert.match(gate, /pending/);

console.log("Release preflight contract passed: exact commit checks, CODEOWNER approval, and production smoke ordering are enforced.");
