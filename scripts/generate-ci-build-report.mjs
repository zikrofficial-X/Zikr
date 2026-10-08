#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "ci-artifacts");
mkdirSync(outDir, { recursive: true });

const run = (command, args = []) => {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return "unavailable";
  }
};

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const commit = run("git", ["rev-parse", "HEAD"]);
const branch = run("git", ["branch", "--show-current"]) || process.env.CIRCLE_BRANCH || "detached";
const nodeVersion = run(process.execPath, ["--version"]);
const pnpmVersion = run("pnpm", ["--version"]);
const buildId = existsSync(path.join(root, ".next", "BUILD_ID"))
  ? readFileSync(path.join(root, ".next", "BUILD_ID"), "utf8").trim()
  : "missing";

const report = {
  project: "ZIKR",
  version: packageJson.version,
  commit,
  branch,
  nodeVersion,
  pnpmVersion,
  buildId,
  generatedAt: new Date().toISOString(),
  build: {
    framework: "Next.js",
    output: ".next",
    status: buildId === "missing" ? "FAIL" : "PASS",
  },
  documentation: {
    architecture: "docs/ARCHITECTURE.md",
    ciCd: "docs/CI_CD_WORKFLOWS_REVIEW_2026_10_08.md",
    deploymentChecklist: "DEPLOYMENT_CHECKLIST.md",
  },
  ownership: {
    githubActions: [
      "video generation",
      "social publishing",
      "PR/main source verification",
      "controlled Vercel release",
    ],
    circleCI: [
      "production web application build artifact",
      "build/release documentation artifact",
      "Android release builds",
      "Supabase release gates",
      "English content sync",
    ],
  },
};

writeFileSync(path.join(outDir, "release-report.json"), JSON.stringify(report, null, 2) + "\n");

const markdown = [
  "# ZIKR Application Build Report",
  "",
  `- Version: ${report.version}`,
  `- Commit: ${report.commit}`,
  `- Branch: ${report.branch}`,
  `- Node: ${report.nodeVersion}`,
  `- pnpm: ${report.pnpmVersion}`,
  `- Next build ID: ${report.buildId}`,
  `- Build status: ${report.build.status}`,
  `- Generated: ${report.generatedAt}`,
  "",
  "## CI Ownership",
  "",
  "### GitHub Actions",
  "- Video generation",
  "- Social publishing",
  "- PR/main source verification",
  "- Controlled Vercel production release",
  "",
  "### CircleCI",
  "- Production web application build artifact",
  "- Build/release documentation artifact",
  "- Android release builds",
  "- Supabase release gates",
  "- English content synchronization",
  "",
  "## Canonical documentation",
  "",
  "- docs/ARCHITECTURE.md",
  "- docs/CI_CD_WORKFLOWS_REVIEW_2026_10_08.md",
  "- DEPLOYMENT_CHECKLIST.md",
].join("\n") + "\n";

writeFileSync(path.join(outDir, "release-report.md"), markdown);
console.log(`Generated ${path.join("ci-artifacts", "release-report.md")}`);
