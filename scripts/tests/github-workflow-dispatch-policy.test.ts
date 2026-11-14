import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isGitHubWorkflowDispatchAllowed } from "../../src/lib/github/workflow-dispatch-policy";

const cases = [
  {
    name: "local development without Vercel runtime metadata",
    env: {},
    expected: true,
  },
  {
    name: "Vercel production deployment on main",
    env: {
      VERCEL: "1",
      VERCEL_URL: "zikrmediaofficial.vercel.app",
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "main",
    },
    expected: true,
  },
  {
    name: "Vercel preview deployment",
    env: {
      VERCEL: "1",
      VERCEL_URL: "zikr-git-feature-zikr3.vercel.app",
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "feature/example",
    },
    expected: false,
  },
  {
    name: "Vercel development deployment",
    env: {
      VERCEL: "1",
      VERCEL_ENV: "development",
      VERCEL_GIT_COMMIT_REF: "main",
    },
    expected: false,
  },
  {
    name: "Vercel runtime with missing environment metadata",
    env: { VERCEL_URL: "zikr-preview.vercel.app" },
    expected: false,
  },
  {
    name: "Vercel production deployment from a non-main ref",
    env: {
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "release/tag",
    },
    expected: false,
  },
];

for (const testCase of cases) {
  assert.equal(
    isGitHubWorkflowDispatchAllowed(testCase.env),
    testCase.expected,
    testCase.name,
  );
}

const dispatchSource = readFileSync(
  resolve(process.cwd(), "src/lib/github/dispatch-workflow.ts"),
  "utf8",
);
const guardIndex = dispatchSource.indexOf(
  "isGitHubWorkflowDispatchAllowed({",
);
const tokenIndex = dispatchSource.indexOf("const token = githubToken();");
assert.ok(guardIndex >= 0, "dispatch helper must enforce the environment policy");
for (const field of ["VERCEL", "VERCEL_URL", "VERCEL_ENV", "VERCEL_GIT_COMMIT_REF"]) {
  assert.ok(
    dispatchSource.includes(`${field}: process.env.${field}`),
    `dispatch helper must pass ${field} explicitly to the environment policy`,
  );
}
assert.ok(
  tokenIndex > guardIndex,
  "the environment guard must run before reading a write-capable token",
);


const releaseWorkflow = readFileSync(resolve(process.cwd(), ".github/workflows/release-finalization.yml"), "utf8");
const edgeFunctionGuard = releaseWorkflow.indexOf("Recheck approved main SHA immediately before Edge Function deployment");
const prayerDeploy = releaseWorkflow.indexOf("supabase functions deploy prayer-notification-worker");
const sourceAgentGuard = releaseWorkflow.indexOf("Recheck approved main SHA immediately before source-agent deployment");
const sourceAgentDeploy = releaseWorkflow.indexOf("supabase functions deploy source-verified-content-agent");
const migrationApply = releaseWorkflow.indexOf("Apply pending production migrations");
const productionDeploy = releaseWorkflow.indexOf("vercel deploy --prebuilt --prod");
assert.ok(edgeFunctionGuard >= 0 && prayerDeploy > edgeFunctionGuard, "the approved-main SHA preflight must guard the prayer notification Edge Function deployment");
assert.ok(sourceAgentGuard > prayerDeploy && sourceAgentGuard < sourceAgentDeploy, "the source-agent deployment must revalidate main after the first Edge Function deploy so a mid-release main advance fails closed");
assert.ok(sourceAgentDeploy > sourceAgentGuard, "release finalization must deploy the source-verified content agent only after its own exact-main SHA guard");
assert.ok(migrationApply >= 0 && migrationApply < edgeFunctionGuard && sourceAgentDeploy < productionDeploy, "database migrations and both Edge Functions must precede Vercel production deployment");
const supabaseConfig = readFileSync(resolve(process.cwd(), "supabase/config.toml"), "utf8");
assert.match(supabaseConfig, /\[functions\.source-verified-content-agent\][\s\S]*?verify_jwt\s*=\s*false/, "the source-agent cron endpoint must remain deployed without Supabase JWT verification because it validates its private scheduler secret itself");

console.log("GitHub workflow dispatch environment policy checks passed.");
