#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const repo = "zikrofficial-X/Zikr";
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
assert.ok(releaseManager.includes('const REPO = process.env.GITHUB_REPOSITORY?.trim() || "zikrofficial-X/Zikr";'), "Admin release manager must use the canonical repository");
assert.ok(releaseAction.includes("prepareAndroidRelease"), "Admin release action must use the canonical Android release manager");
assert.ok(!releaseManager.includes("buildTag"), "Android release manager must not create a redundant -build tag");

const supabaseConfig = read("supabase/config.toml");
const androidStorageMigration = read("supabase/migrations/20261009145051_android_releases_storage_bucket.sql");
const androidStorageLimitMigration = read("supabase/migrations/20261009180000_android_release_bucket_free_tier_limit.sql");
assert.ok(supabaseConfig.includes("[storage]\nenabled = true\nfile_size_limit = \"50MiB\""), "The project-wide Supabase Free-tier upload limit must remain 50 MiB");
const androidBucketConfig = supabaseConfig.split("[storage.buckets.android-releases]")[1] ?? "";
assert.ok(androidBucketConfig.includes('file_size_limit = "50MiB"'), "Android release bucket must not exceed the project-wide Free-tier upload limit");
assert.ok(androidStorageMigration.includes("'android-releases'"), "A production migration must provision the Android release bucket");
assert.ok(androidStorageMigration.includes("ON CONFLICT (id) DO UPDATE"), "Android release bucket migration must be safe to re-apply");
assert.ok(androidStorageLimitMigration.includes("SET file_size_limit = 52428800"), "A forward migration must align the already-applied Android bucket limit with Supabase Free tier");
assert.ok(androidStorageLimitMigration.includes("WHERE id = 'android-releases'"), "The bucket limit repair must target only the Android release bucket");

const siteContentService = read("src/features/site-content/services/site-content.ts");
assert.ok(siteContentService.includes(".limit(1)\n      .maybeSingle()"), "Optional homepage settings must return null for missing keys without raising PostgREST 406 errors");
assert.ok(!siteContentService.includes(".limit(1)\n      .single()"), "Optional homepage settings must not require a row to exist");

const publish = read(".github/workflows/publish-android-release-assets.yml");
assert.ok(publish.includes("github.ref_type == 'tag'"), "Android publisher must support semantic release tags");
assert.ok(publish.includes("inputs.retry == true"), "Android publisher must support an explicit guarded recovery retry");
assert.ok(publish.includes("docs/finalization/RELEASE_RETRY.flag"), "Android publisher retry must require the repository release guard");
assert.ok(publish.includes("seq 1 120") && publish.includes("sleep 30"), "Android publisher must wait long enough for CircleCI's signed build to finish");
assert.ok(publish.includes("--clobber"), "Android publisher must replace stale assets after checksum verification");
assert.ok(publish.includes("statuses: read"), "Android publisher must be able to inspect CircleCI status");
assert.ok(publish.includes('select(.context == "ci/circleci: android-rebuild")'), "Android publisher must inspect the canonical Android build status");
assert.ok(publish.includes("failure|error"), "Android publisher must stop promptly when the signed build fails");
assert.ok(publish.includes("seq 1 240") && publish.includes("sleep 15") && publish.includes("within 60 minutes"), "Android publisher must allow up to 60 minutes for CircleCI status preflight");
assert.ok(publish.includes('AAPT="$ANDROID_HOME/build-tools/36.0.0/aapt"'), "Android publisher must verify the APK manifest with JAXB-independent aapt");
assert.ok(!publish.includes("apkanalyzer"), "Android publisher must not use JAXB-dependent APK Analyzer with Java 21");
assert.ok(!publish.includes("branches:\n      - main"), "Android publisher must not trigger directly from main");
assert.ok(publish.includes("EXPECTED_TAG=\"v$(jq -r '.version' package.json)\""), "Android publisher must revalidate tag/version parity");
assert.ok(publish.includes("com.zikr.app"), "Android publisher must verify the canonical application id");
assert.ok(publish.includes(".sourceCommit"), "Android publisher must validate the artifact source commit");
assert.ok(publish.includes('test "${SOURCE_COMMIT}" = "${GITHUB_SHA}"'), "Tag and branch publication must use artifacts from the exact release commit");
assert.ok(publish.includes("source_status") && publish.includes("ci/circleci: android-rebuild"), "Manual retry must validate CircleCI success for the artifact source commit");
assert.ok(publish.includes("SHA256SUMS"), "Android publisher must verify and publish checksums");
assert.ok(publish.includes("release-metadata.json"), "Android publisher must verify and publish release metadata");
assert.ok(publish.includes('gh release edit "$TAG"'), "Android publisher must finalize the GitHub release");

const circle = read(".circleci/config.yml");
assert.ok(circle.includes(`releaseUrl": "https://github.com/${repo}/releases/tag/`), "CircleCI Android release metadata must use the canonical repository");
const androidJob = circle.split("  android-rebuild:")[1]?.split("\n  security-audit:")[0] ?? "";
assert.ok(androidJob.includes("NEXT_PUBLIC_SUPABASE_URL: https://ymxdswkaxafakugktsim.supabase.co"), "Android job must use the canonical public Supabase URL");
assert.ok(androidJob.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY:"), "Android job must declare the public Supabase anon key required by preflight");
assert.ok(androidJob.includes("SUPABASE_URL: https://ymxdswkaxafakugktsim.supabase.co"), "Android job must pin the canonical Supabase project URL");
assert.ok(androidJob.includes("SUPABASE_SERVICE_ROLE_KEY"), "Android job must validate the protected Supabase service-role key");
const releaseWorkflow = circle.split("workflows:\n")[1] ?? "";
const androidWorkflowJob = releaseWorkflow.split("- android-rebuild:")[1]?.split("\n      - ")[0] ?? "";
assert.ok(androidWorkflowJob.includes("context:\n            - android-signing"), "Signed Android build must use the protected android-signing context");
assert.ok(androidWorkflowJob.includes("requires:\n            - source-verify\n            - supabase-production-gate"), "Signed Android build must wait for both source validation and Supabase production preflight");
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
assert.ok(finalization.includes("fetch-depth: 0"), "schema-baseline verification must have the parent commit available");
assert.ok(finalization.includes('git worktree add --detach "${baseline}" "${GITHUB_SHA}^"'), "schema baseline must be checked against the commit before this release");
assert.ok(finalization.includes('supabase db push --db-url "${SUPABASE_DB_URL}" --yes'), "pending SQL migrations must be applied through the controlled production release");
const baselineStep = finalization.indexOf("Verify production data and baseline schema against parent commit");
const buildStep = finalization.indexOf("Build production artifact");
const deployStep = finalization.indexOf("Deploy prebuilt artifact to production");
const migrationStep = finalization.indexOf("Apply pending production migrations after deployment");
const schemaStep = finalization.indexOf("Verify production schema after migration");
const finalSmokeStep = finalization.indexOf("Post-migration production smoke test");
assert.ok(baselineStep >= 0 && baselineStep < buildStep, "pre-release schema/data preflight must occur before building");
assert.ok(buildStep < deployStep && deployStep < migrationStep && migrationStep < schemaStep && schemaStep < finalSmokeStep, "deploy compatible code before applying breaking access-policy changes, then verify schema and smoke-test");

const gameRegistry = read("src/lib/games/registry.ts");
const productionSmoke = read("scripts/verify-production-smoke.mjs");
const canonicalGameIds = [...gameRegistry.matchAll(/^  "([^"]+)": \{\n    id:/gm)].map((match) => match[1]);
assert.equal(canonicalGameIds.length, 12, "the current canonical kids game registry should expose twelve games");
for (const id of canonicalGameIds) {
  assert.ok(productionSmoke.includes(`"${id}"`), `production smoke must cover kids game slug ${id}`);
}
assert.ok(productionSmoke.includes("/kids/${slug}"), "production smoke must test the detail page for each kids game");
assert.ok(productionSmoke.includes("/api/kids/content/${slug}"), "production smoke must test the API backing each kids game page");
assert.ok(productionSmoke.includes("payload.metadata?.gameId === slug"), "production smoke must verify game metadata, not just HTTP status");

console.log("✅ Release contract checks passed");
