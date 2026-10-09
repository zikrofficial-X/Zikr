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

const releaseManager = read("src/features/releases/services/github-release-manager.ts");
const releaseAction = read("src/app/admin/release/actions.ts");
assert.ok(releaseManager.includes("/git/tags"), "Admin release manager must create the annotated Android Git tag object");
assert.ok(releaseManager.includes("/git/refs"), "Admin release manager must publish the canonical Android tag ref");
assert.ok(releaseManager.includes("/releases"), "Admin release manager must create the draft GitHub Release");
assert.ok(releaseManager.includes("draft: true"), "Admin release manager must create Android releases as drafts until artifacts are verified");
assert.ok(releaseManager.includes('const REPO = process.env.GITHUB_REPOSITORY?.trim() || "zikrcontact-del/Zikr";'), "Admin release manager must use the canonical repository");
assert.ok(releaseAction.includes("prepareAndroidRelease"), "Admin release action must use the canonical Android release manager");
assert.ok(!releaseManager.includes("buildTag"), "Android release manager must not create a redundant -build tag");

const supabaseConfig = read("supabase/config.toml");
const androidStorageMigration = read("supabase/migrations/20261009145051_android_releases_storage_bucket.sql");
assert.ok(supabaseConfig.includes("[storage.buckets.android-releases]"), "Supabase config must declare the canonical Android release bucket");
assert.ok(supabaseConfig.includes('file_size_limit = "512MiB"'), "Android release bucket must allow expected APK/AAB artifacts");
assert.ok(androidStorageMigration.includes("'android-releases'"), "A production migration must provision the Android release bucket");
assert.ok(androidStorageMigration.includes("ON CONFLICT (id) DO UPDATE"), "Android release bucket migration must be safe to re-apply");

const publish = read(".github/workflows/publish-android-release-assets.yml");
assert.ok(publish.includes("github.ref_type == 'tag'"), "Android publisher must support semantic release tags");
assert.ok(publish.includes("'android-release-v*.*.*'"), "Android publisher must recover assets from canonical Android release branches");
assert.ok(publish.includes("GITHUB_REF_NAME#android-release-"), "Android publisher must map recovery branch names to the exact semantic release tag");
assert.ok(publish.includes("seq 1 120") && publish.includes("sleep 30"), "Android publisher must wait long enough for CircleCI's signed build to finish");
assert.ok(publish.includes("--clobber"), "Android publisher must replace stale assets after checksum verification");
assert.ok(publish.includes("statuses: read"), "Android publisher must be able to inspect CircleCI status");
assert.ok(publish.includes('select(.context == "ci/circleci: android-rebuild")'), "Android publisher must inspect the canonical Android build status");
assert.ok(publish.includes("failure|error"), "Android publisher must stop promptly when the signed build fails");
assert.ok(publish.includes("within 20 minutes"), "Android publisher must bound CircleCI status preflight");
assert.ok(!publish.includes("branches:\n      - main"), "Android publisher must not trigger directly from main");
assert.ok(publish.includes("EXPECTED_TAG=\"v$(jq -r '.version' package.json)\""), "Android publisher must revalidate tag/version parity");
assert.ok(publish.includes("com.zikr.app"), "Android publisher must verify the canonical application id");
assert.ok(publish.includes("SHA256SUMS"), "Android publisher must verify and publish checksums");
assert.ok(publish.includes("release-metadata.json"), "Android publisher must verify and publish release metadata");
assert.ok(publish.includes('gh release edit "$TAG"'), "Android publisher must finalize the GitHub release");

const circle = read(".circleci/config.yml");
assert.ok(circle.includes(`releaseUrl": "https://github.com/${repo}/releases/tag/`), "CircleCI Android release metadata must use the canonical repository");
const androidJob = circle.split("  android-rebuild:")[1]?.split("\n  security-audit:")[0] ?? "";
assert.ok(androidJob.includes("NEXT_PUBLIC_SUPABASE_URL: https://wvetcauyerlkqvmntajq.supabase.co"), "Android job must use the canonical public Supabase URL");
assert.ok(androidJob.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY:"), "Android job must declare the public Supabase anon key required by preflight");
assert.ok(androidJob.includes("SUPABASE_URL: https://wvetcauyerlkqvmntajq.supabase.co"), "Android job must pin the canonical Supabase project URL");
assert.ok(androidJob.includes("SUPABASE_SERVICE_ROLE_KEY"), "Android job must validate the protected Supabase service-role key");
assert.ok(circle.includes("ANDROID_KEYSTORE_BASE64"), "Android release must require protected signing material");
assert.ok(circle.includes("Detected Android versionName"), "Android release must validate the generated version");
assert.ok(circle.includes('"$AAPT" dump badging "$APK"'), "Android release must inspect APK metadata with JAXB-independent aapt");
assert.ok(circle.includes('test -x "$AAPT"'), "Android release must fail closed if APK metadata tooling is missing");
assert.ok(circle.includes("APK versionCode ($VERSION_CODE) does not match Gradle ($EXPECTED_VERSION_CODE)."), "Android release must validate the APK versionCode");
assert.ok(!circle.includes('VERSION_CODE="56"'), "Android release must not silently substitute an obsolete versionCode");

const finalization = read(".github/workflows/release-finalization.yml");
assert.ok(finalization.includes("github.ref == 'refs/heads/main'"), "web production release must be main-only");
assert.ok(finalization.includes("environment:\n      name: production"), "web production release must use the protected production environment");
assert.ok(finalization.includes("pnpm production:smoke"), "web production release must verify its deployment");

console.log("✅ Release contract checks passed");
