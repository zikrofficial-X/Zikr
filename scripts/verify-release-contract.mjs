#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const repo = "zikrcontact-del/Zikr";
const read = (file) => {
  assert.ok(existsSync(file), `Missing release contract file: ${file}`);
  return readFileSync(file, "utf8");
};

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const tag = read(".release-tag").trim();
const version = String(pkg.version);

assert.equal(tag, `v${version}`, "package.json version and .release-tag must match");
assert.ok(existsSync(`docs/releases/${version}.md`), "release notes must exist for package version");
assert.ok(read(`docs/releases/${version}.md`).includes(`Release tag: \`v${version}\``), "release notes must reference the canonical release tag");

const createTag = read(".github/workflows/create-android-release-tag.yml");
assert.ok(createTag.includes("startsWith(github.event.head_commit.message, '[PRODUCTION RELEASE]')"), "Android release tag creation must require the controlled release marker");
assert.ok(createTag.includes('test "$TAG" = "v$VERSION"'), "release tag workflow must revalidate version/tag parity");
assert.ok(createTag.includes("createRelease"), "release tag workflow must create a draft GitHub release");
assert.ok(!createTag.includes("buildTag"), "release tag workflow must not create a redundant -build tag");

const publish = read(".github/workflows/publish-android-release-assets.yml");
assert.ok(publish.includes("github.ref_type == 'tag'"), "Android publisher must support semantic release tags");
assert.ok(!publish.includes("branches:\n      - main"), "Android publisher must not trigger directly from main");
assert.ok(publish.includes("EXPECTED_TAG=\"v$(jq -r '.version' package.json)\""), "Android publisher must revalidate tag/version parity");
assert.ok(publish.includes("com.zikr.app"), "Android publisher must verify the canonical application id");
assert.ok(publish.includes("SHA256SUMS"), "Android publisher must verify and publish checksums");
assert.ok(publish.includes("release-metadata.json"), "Android publisher must verify and publish release metadata");
assert.ok(publish.includes('gh release edit "$TAG"'), "Android publisher must finalize the GitHub release");

const circle = read(".circleci/config.yml");
assert.ok(circle.includes(`releaseUrl": "https://github.com/${repo}/releases/tag/`), "CircleCI Android release metadata must use the canonical repository");
assert.ok(circle.includes("ANDROID_KEYSTORE_BASE64"), "Android release must require protected signing material");
assert.ok(circle.includes("Detected Android versionName"), "Android release must validate the generated version");

const finalization = read(".github/workflows/release-finalization.yml");
assert.ok(finalization.includes("github.ref == 'refs/heads/main'"), "web production release must be main-only");
assert.ok(finalization.includes("environment:\n      name: production"), "web production release must use the protected production environment");
assert.ok(finalization.includes("pnpm production:smoke"), "web production release must verify its deployment");

console.log("✅ Release contract checks passed");
