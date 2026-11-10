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
  "isGitHubWorkflowDispatchAllowed(process.env)",
);
const tokenIndex = dispatchSource.indexOf("const token = githubToken();");
assert.ok(guardIndex >= 0, "dispatch helper must enforce the environment policy");
assert.ok(
  tokenIndex > guardIndex,
  "the environment guard must run before reading a write-capable token",
);

console.log("GitHub workflow dispatch environment policy checks passed.");
