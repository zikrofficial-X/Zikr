#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (file) => {
  assert.ok(existsSync(file), "Missing CI/CD source file: " + file);
  return readFileSync(file, "utf8");
};

const quality = read(".github/workflows/quality-gate.yml");
const video = read(".github/workflows/generate-ai-video.yml");
const urgent = read(".github/workflows/urgent-video-dispatcher.yml");
const english = read(".github/workflows/english-content-sync.yml");
const release = read(".github/workflows/release-finalization.yml");
const smoke = read(".github/workflows/release-vercel.yml");
const androidPublish = read(".github/workflows/publish-android-release-assets.yml");
const circle = read(".circleci/config.yml");

assert.ok(quality.includes('name: "ZIKR / Quality Gate"'), "Canonical GitHub quality check name is incorrect");
assert.ok(!quality.includes("ci/circleci: ci-check"), "GitHub quality gate must not impersonate CircleCI");
assert.ok(video.includes('cron: "17 3,9,15,21 * * *"'), "Video worker cadence drifted");
assert.ok(!video.includes("\n  push:"), "Production video worker must not run on source pushes");
assert.ok(video.includes("environment: production"), "Video worker must use protected production environment");
assert.ok(video.includes("github.ref == 'refs/heads/main'"), "Video worker must be main-only");
assert.ok(urgent.includes('cron: "*/30 * * * *"'), "Urgent dispatcher cadence drifted");
assert.ok(urgent.includes("environment: production"), "Urgent dispatcher must use protected production environment");
assert.ok(urgent.includes("github.ref == 'refs/heads/main'"), "Urgent dispatcher must be main-only");
assert.ok(english.includes('cron: "17 4 * * *"'), "English sync cadence drifted");
assert.ok(english.includes("environment: production"), "English sync must use protected production environment");
assert.ok(english.includes("github.ref == 'refs/heads/main'"), "English sync must be main-only");
assert.ok(release.includes("github.ref == 'refs/heads/main'"), "Controlled Vercel release must be main-only");
assert.ok(release.includes("Production smoke test on deployed artifact"), "Controlled release must verify the deployment it just created");
assert.ok(release.includes("pnpm production:smoke"), "Controlled release must use the canonical production smoke script");
assert.ok(release.includes("environment:\n      name: production"), "Controlled release must use the protected production environment");
assert.ok(smoke.includes("name: ZIKR Production Smoke Verification"), "Manual production smoke workflow name is incorrect");
assert.ok(smoke.includes("pnpm production:smoke"), "Manual smoke workflow must use the canonical production smoke script");
assert.ok(androidPublish.includes("github.ref_type == 'tag'"), "Android publishing must support release tags");
assert.ok(androidPublish.includes("docs/finalization/RELEASE_RETRY.flag"), "Android publishing must require explicit release state for non-tag recovery");
assert.ok(!circle.includes("main-source-verification:"), "CircleCI must not duplicate main source verification");
assert.ok(circle.includes("  source-verify:"), "CircleCI recovery verification job name must be explicit");
assert.ok(!existsSync(".github/workflows/global-localization-verify.yml"), "Duplicate localization workflow must stay removed");

for (const file of [
  ".github/workflows/generate-ai-video.yml",
  ".github/workflows/urgent-video-dispatcher.yml",
  ".github/workflows/english-content-sync.yml",
  ".github/workflows/release-finalization.yml",
]) {
  const content = read(file);
  assert.ok(content.includes("environment: production") || content.includes("environment:\n      name: production"), file + " must bind the production environment");
}

console.log("✅ CI/CD architecture checks passed");