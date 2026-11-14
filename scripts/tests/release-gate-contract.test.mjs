import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasCurrentCodeOwnerApproval } from "../lib/release-gate-approval.mjs";

const workflow = readFileSync(".github/workflows/release-vercel.yml", "utf8");
const releaseWorkflow = readFileSync(".github/workflows/release-finalization.yml", "utf8");
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


assert.ok(releaseWorkflow.includes("pull-requests: read"));
assert.ok(releaseWorkflow.includes("name: Verify current PR CODEOWNER approval before production changes"));
assert.ok(releaseWorkflow.includes("GITHUB_TOKEN: ${{ github.token }}"));
assert.ok(releaseWorkflow.includes('REQUIRE_VERCEL_STATUS: "false"'));
const releasePreflightIndex = releaseWorkflow.indexOf("node scripts/verify-release-gates.mjs");
const releaseMigrationIndex = releaseWorkflow.indexOf("supabase db push");
const releaseFunctionDeployIndex = releaseWorkflow.indexOf("supabase functions deploy");
const releaseVercelDeployIndex = releaseWorkflow.indexOf("vercel deploy --prebuilt");
const releaseRestoreIndex = releaseWorkflow.indexOf("Restore source-verified Quran tafsir corpus");
assert.ok(releasePreflightIndex >= 0, "production deployment must run the CODEOWNER preflight");
assert.ok(releaseMigrationIndex > releasePreflightIndex, "CODEOWNER preflight must run before database migrations");
assert.ok(releaseFunctionDeployIndex > releasePreflightIndex, "CODEOWNER preflight must run before Edge Function deployment");
assert.ok(releaseVercelDeployIndex > releasePreflightIndex, "CODEOWNER preflight must run before Vercel deployment");
assert.ok(releaseRestoreIndex > releasePreflightIndex, "CODEOWNER preflight must run before production corpus restoration");

assert.ok(gate.includes("REQUIRE_VERCEL_STATUS"));
assert.ok(gate.includes('const requireVercelStatus = requireVercelStatusSetting !== "false"'));
assert.ok(gate.includes('await requireCircleCiStatuses(commitSha, "Merged commit statuses", requireVercelStatus);'));
assert.ok(!workflow.includes('REQUIRE_VERCEL_STATUS: "false"'), "post-deploy smoke must continue to require Vercel status by default");
