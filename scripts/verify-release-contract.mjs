#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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
assert.ok(releaseManager.includes("getAndroidReleaseSigningPreflightStatus"), "Admin release manager must check protected GPG readiness");
assert.ok(releaseManager.includes("requestAndroidReleaseSigningPreflight"), "Admin release manager must expose the protected no-mutation signing preflight");
assert.ok(releaseManager.includes("sign-android-release-tag.yml"), "Admin release manager must delegate signed tag creation to the protected runner");
assert.ok(!releaseManager.includes('"/git/tags"'), "Admin release manager must never create an unsigned tag through the REST API");
assert.ok(!releaseManager.includes('"/git/refs"'), "Admin release manager must never publish a tag ref directly");
assert.ok(!releaseManager.includes('"/releases"'), "Admin release manager must not create a draft before signature verification");
assert.ok(releaseManager.includes('const REPO = process.env.GITHUB_REPOSITORY?.trim() || "zikrofficial-X/Zikr";'), "Admin release manager must use the canonical repository");
assert.equal(releaseAction.includes("SIGNED_RELEASE_BLOCKER"), false, "Admin release action must no longer contain the permanent hard-coded blocker");
assert.ok(releaseAction.includes("prepareAndroidRelease"), "Android release action must invoke the canonical release manager");
assert.ok(releaseAction.includes("getAndroidReleaseSigningPreflightStatus"), "Android release action must enforce the signing preflight");
assert.ok(releaseAction.includes("requestAndroidReleaseSigningPreflight"), "Android release action must expose a no-mutation preflight action");
assert.ok(releaseAction.includes("recordAdminAuditEventSafely"), "Android release preparation must be audited after commit");

const releaseAdminRecoveryPage = read("src/app/admin/release/page.tsx");
assert.ok(releaseManager.includes("recreateStuckAndroidRelease"), "Android release manager must expose guarded stuck-release recovery");
assert.ok(releaseManager.includes('method: "DELETE"'), "Stuck-release recovery must remove the exact draft release and tag before retrying");
assert.ok(releaseManager.includes("release.draft !== true") && releaseManager.includes("release.immutable === true"), "Stuck Android recovery must refuse published or immutable GitHub Releases");
assert.ok(releaseManager.includes('tagRef.object?.type === "tag"') && releaseManager.includes("tagObject.object.sha !== commitSha"), "Stuck Android recovery must verify the annotated tag target before deleting it, even when signature verification is what failed");
assert.ok(releaseManager.includes("tagObject.object.sha !== commitSha") && releaseManager.includes("currentMainSha !== commitSha"), "Stuck Android recovery must bind deletion and recreation to the exact current main commit");
assert.ok(releaseManager.includes("cancelWorkflowRunsForReleaseCommit"), "Stuck Android recovery must stop in-flight signing/publishing workflows before cleanup");
assert.ok(releaseManager.includes("dispatch-android-release-recovery.yml"), "Stuck Android recovery must cancel a stale publisher dispatcher before re-creating the tag");
assert.ok(releaseAction.includes("formData.get(\"confirmCleanup\") !== \"yes\""), "Destructive release recovery must require explicit confirmation");
assert.ok(releaseAction.includes("Number.isFinite(startedAt)") && releaseAction.includes("Date.now() - startedAt >= 6 * 60 * 60 * 1000"), "Release cleanup must require a valid timestamp older than six hours or a known dispatch failure");
assert.ok(releaseAction.includes('action: "android.release.recreate.retry"'), "Release cleanup and retry must be recorded in the admin audit log");
assert.ok(releaseAdminRecoveryPage.includes("operationCanRecover") && releaseAdminRecoveryPage.includes('name="confirmCleanup"'), "Admin Release Center must expose a confirmation-gated recovery button");
assert.ok(releaseAdminRecoveryPage.includes("لن يتم حذف أي Release منشور"), "Admin Release Center must explain that published releases are protected");
assert.ok(releaseAction.includes('requireAdminStepUp("release.manage", "/admin/release")'), "Android release preparation must honor step-up authentication");
assert.ok(releaseAction.includes("assertNoActiveReleaseOperation"), "Android release action must prevent overlapping operations");
const androidAdminAction = read("src/app/admin/android/actions.ts");
assert.ok(androidAdminAction.includes('requireAdminStepUp("android.manage", "/admin/android")'), "Android release-setting changes must honor the destructive-action step-up policy");
assert.ok(androidAdminAction.includes("getStableReleaseByTag"), "Pinned Android releases must be validated against a published stable GitHub release");
assert.ok(androidAdminAction.includes("لا يمكن تثبيت إصدار غير منشور"), "Pinned Android releases must fail closed when APK/AAB artifacts are missing");
const androidAdminPage = read("src/app/admin/android/page.tsx");
assert.ok(androidAdminPage.includes('endsWith(".apk")') && androidAdminPage.includes('endsWith(".aab")'), "Admin Android release choices must contain both APK and AAB artifacts");
assert.ok(!releaseManager.includes("buildTag"), "Android release manager must not create a redundant -build tag");
const androidTagSigningWorkflow = read(".github/workflows/sign-android-release-tag.yml");
const expectedNotesGuard = 'grep -Fq "Release tag: \\`$TAG\\`" "$NOTES"';
assert.ok(androidTagSigningWorkflow.includes(expectedNotesGuard), "Signed release workflow must compare literal backtick-delimited notes without shell command substitution");
assert.ok(androidTagSigningWorkflow.includes('android-release-sign-v*'), "Protected Android signer must support the guarded branch-triggered signing path");
assert.ok(androidTagSigningWorkflow.includes('GITHUB_REF_NAME#android-release-sign-'), "Push-triggered signing must derive its tag only from the canonical release-sign branch name");
assert.ok(androidTagSigningWorkflow.includes("Release commit is not the current main HEAD"), "Branch-triggered signing must bind the signed tag to the exact current main commit");
assert.ok(androidTagSigningWorkflow.includes("Verify protected Android Git-tag signing configuration"), "Tag signing must require a successful preflight for the exact release commit");
assert.ok(androidTagSigningWorkflow.includes("checks: read"), "Tag signing must have read-only permission to verify the exact-commit preflight result");
assert.ok(androidTagSigningWorkflow.includes("github.actor == 'zikrofficial-X'"), "Push-triggered signing must be restricted to the repository owner identity");


const androidCircle = read(".circleci/config.yml");
const androidDraftJob = androidCircle.split("  android-release-draft:")[1]?.split("\n  android-rebuild:")[0] ?? "";
const androidRebuildJob = androidCircle.split("  android-rebuild:")[1]?.split("\n  security-audit:")[0] ?? "";

assert.ok(androidDraftJob.length > 0, "CircleCI main pipeline must verify the canonical Android draft release");
assert.ok(androidDraftJob.includes('"/releases?per_page=100&page=1"'), "CircleCI must inspect the complete GitHub release collection");
assert.ok(androidDraftJob.includes("matchingReleases.length > 1"), "CircleCI must reject ambiguous duplicate releases before a release build");
assert.ok(androidDraftJob.includes("if (isReleasePreparationCommit)") && androidDraftJob.includes("Android release preparation is blocked until an owner resolves the duplicate drafts.") && androidDraftJob.includes("process.exit(0)"), "Legacy duplicate drafts must warn but not fail ordinary main CI; explicit release preparation must fail closed.");
assert.ok(androidDraftJob.includes("isReleasePreparationCommit") && androidDraftJob.includes('commitMessage.startsWith("release: prepare Android ")'), "CircleCI must distinguish atomic Admin Release preparation commits from ordinary main updates");
assert.ok(androidDraftJob.includes("existingTargetSha !== sourceSha") && androidDraftJob.includes("refusing to publish mismatched Android artifacts"), "Release-preparation artifacts must remain pinned to the exact immutable tag commit");
assert.ok(androidDraftJob.includes("maxAttempts") && androidDraftJob.includes("setTimeout"), "CircleCI must allow the Admin Release manager a bounded window to create the tag/draft before verification");
assert.ok(!androidDraftJob.includes('api("/releases", "POST"') && !androidDraftJob.includes('api("/git/tags", "POST"') && !androidDraftJob.includes('api("/git/refs", "POST"'), "CircleCI must verify, never create, a Git tag or GitHub draft release");
const androidSingleOwnerFilters = androidCircle.match(/android-release-draft-single-owner-20261110/g) ?? [];
assert.equal(androidSingleOwnerFilters.length, 2, "CircleCI source/build filters must both include the single-owner Android release branch");
assert.ok(androidRebuildJob.includes("Upload verified Android assets to GitHub Draft Release"), "CircleCI must upload verified signed Android assets to the existing draft release");
assert.ok(androidRebuildJob.includes("gh release upload"), "CircleCI Android artifacts must be uploaded through GitHub Releases");
assert.ok(!androidRebuildJob.includes("Upload verified Android assets to Supabase Storage"), "CircleCI must not upload Android release assets to Supabase Storage");

const siteContentService = read("src/features/site-content/services/site-content.ts");
assert.ok(siteContentService.includes("supabaseServerAnonRequest"), "Public site settings must use the shared server-side REST cache");
assert.ok(siteContentService.includes("key=eq.${encodeURIComponent(key)}&limit=1"), "Public site-setting lookup must filter to the requested key and a single row");
assert.ok(siteContentService.includes('["seo", "social", "homepage", "section_visibility"].includes(key) ? 86400 : 300'), "Public editorial settings must use the one-day cache while Android release metadata keeps its short TTL");
assert.ok(siteContentService.includes("tags: [`site-setting:${key}`]"), "Cached site settings must remain immediately invalidatable by admin writes");
assert.ok(siteContentService.includes("rows?.[0]?.value"), "Optional site settings must return null when the filtered REST response contains no row");

const publish = read(".github/workflows/publish-android-release-assets.yml");
assert.ok(publish.includes("Wait for GitHub Release Android artifacts"), "GitHub publisher must consume Android assets from GitHub Releases");
assert.ok(!publish.includes("SUPABASE_PUBLIC_ROOT") && !publish.includes("SUPABASE_PUBLIC_BASE"), "GitHub publisher must not consume Android release assets from Supabase Storage");

const recoveryDispatch = read(".github/workflows/dispatch-android-release-recovery.yml");
assert.ok(recoveryDispatch.includes("ci/circleci: android-rebuild"), "Android recovery publisher must wait for signed CircleCI build success");
assert.ok(recoveryDispatch.includes("listReleases"), "Android recovery dispatch must find a draft release through the releases list API");
assert.ok(recoveryDispatch.includes("release_id: 413815658"), "Android recovery must recover the existing v1.1.4 draft by its verified ID when the list endpoint omits it");
assert.ok(recoveryDispatch.includes("release.draft !== true"), "Android recovery dispatch must only target an unpublished draft");
assert.ok(recoveryDispatch.includes("branchData.commit.sha"), "Android recovery dispatch must bind publication to the release branch commit");

assert.ok(recoveryDispatch.includes("RELEASE_RETRY.flag"), "Android recovery dispatch must require the repository release retry guard");
assert.ok(recoveryDispatch.includes("createWorkflowDispatch"), "Android recovery dispatch must start the guarded publisher workflow");
assert.ok(recoveryDispatch.includes("github.event_name == 'workflow_dispatch'") && recoveryDispatch.includes("isPushRecoveryTrigger"), "Android recovery must retain explicit CircleCI dispatch and owner-only push fallback");
assert.ok(recoveryDispatch.includes("getCombinedStatusForRef"), "Dispatched recovery must confirm success of the exact CircleCI Android build");
assert.ok(recoveryDispatch.includes("  statuses: read"), "Android recovery must have read permission for CircleCI commit statuses");
assert.ok(recoveryDispatch.includes("  actions: write"), "Android recovery must have permission to dispatch the guarded publisher");
assert.ok(recoveryDispatch.includes("  contents: write"), "owner-only Android recovery must have push visibility to inspect the private draft release");
assert.ok(recoveryDispatch.includes("github.actor == 'zikrofficial-X'"), "Android recovery write visibility must be restricted to the canonical repository owner");
assert.ok(recoveryDispatch.includes("android-release-dispatch-v*"), "Android recovery must retain an owner-only push fallback for an already-built exact release");
assert.ok(recoveryDispatch.includes("sourceSha !== eventSha") && recoveryDispatch.includes("isPushRecoveryTrigger"), "manual and push recovery paths must bind publication to the immutable tag target rather than the trigger commit");

assert.ok(!recoveryDispatch.includes('const core = require("@actions/core")'), "github-script must not redeclare its built-in core binding");
assert.ok(recoveryDispatch.includes("getRef") && recoveryDispatch.includes("getTag"), "Android recovery must resolve annotated tags to their target commits");
assert.ok(recoveryDispatch.includes("tagTargetSha !== sourceSha"), "Android recovery must refuse publication when the recovery branch differs from the tag target");
assert.ok(publish.includes("TAG_TARGET_SHA") && publish.includes("Android artifact/tag provenance mismatch"), "Android publisher must verify that the artifact source SHA equals the canonical tag target");
assert.ok(publish.includes("Android release tag/source mismatch"), "Android publisher must reject recovery-branch commits that differ from the canonical tag target");
assert.ok(releaseManager.includes("Preparation base commit"), "New release notes must not label the pre-release baseline SHA as the binary source SHA");



assert.ok(publish.includes("github.ref_type == 'tag'"), "Android publisher must support semantic release tags");
assert.ok(publish.includes("inputs.retry == true"), "Android publisher must support an explicit guarded recovery retry");
assert.ok(publish.includes("docs/finalization/RELEASE_RETRY.flag"), "Android publisher retry must require the repository release guard");
assert.ok(publish.includes("seq 1 120") && publish.includes("sleep 30"), "Android publisher must wait long enough for CircleCI's signed build to finish");
assert.ok(publish.includes('group: android-release-publish-global'), "Android publisher must serialize all tag/branch retries with a single release-wide concurrency lock");
assert.ok(publish.includes('gh release upload "$TAG" "$asset"') && publish.includes("--clobber"), "Android publisher must use the idempotent GitHub CLI upload path for same-named assets");
assert.ok(publish.includes("statuses: read"), "Android publisher must be able to inspect CircleCI status");
assert.ok(
  publish.includes("select(.context == $context)") &&
    publish.includes('"ci/circleci: android-rebuild"') &&
    publish.includes("required_contexts=("),
  "Android publisher must inspect the canonical Android build status through its complete required-context gate",
);
assert.ok(publish.includes("failure|error|cancelled"), "Android publisher must stop promptly when a required signed build fails or is cancelled");
assert.ok(
  publish.includes("unexpected_failures") &&
    publish.includes("draft_gate_state") &&
    publish.includes("non_draft_pending") &&
    publish.includes("quality_conclusion") &&
    publish.includes("Unexpected failing commit status(es)"),
  "Android publisher must block every unexpected failed/pending status while narrowly tolerating only the authenticated private-draft visibility fallback",
);
assert.ok(publish.includes("seq 1 240") && publish.includes("sleep 15") && publish.includes("within 60 minutes"), "Android publisher must allow up to 60 minutes for CircleCI status preflight");
assert.ok(publish.includes('AAPT="$ANDROID_HOME/build-tools/36.0.0/aapt"'), "Android publisher must verify the APK manifest with JAXB-independent aapt");
assert.ok(!publish.includes("apkanalyzer"), "Android publisher must not use JAXB-dependent APK Analyzer with Java 21");
assert.ok(!publish.includes("branches:\n      - main"), "Android publisher must not trigger directly from main");
assert.ok(publish.includes("EXPECTED_TAG=\"v$(jq -r '.version' package.json)\""), "Android publisher must revalidate tag/version parity");
assert.ok(publish.includes("com.zikr.app"), "Android publisher must verify the canonical application id");
assert.ok(publish.includes("source_commit:"), "Android publisher must accept an exact immutable source SHA for owner-authorized main recovery");
assert.ok(publish.includes("SOURCE_COMMIT_INPUT") && publish.includes('GITHUB_REF}" == "refs/heads/main"') && publish.includes('SOURCE_COMMIT_INPUT}" != "$TAG_TARGET_SHA"'), "main recovery must be dispatched only with the explicit tag-target source SHA");
assert.ok(publish.includes("contents/${release_path}?ref=${TAG_TARGET_SHA}") && publish.includes("base64 --decode") && publish.includes("cmp -s") && publish.includes("RELEASE_SOURCE_PATHS"), "main recovery must compare every release identity/version file with GitHub contents at the immutable tag target before publishing");
assert.ok(publish.includes("RELEASE_SOURCE_SHA=$TAG_TARGET_SHA"), "release provenance must remain bound to the tag target, not the newer workflow dispatch commit");

assert.ok(publish.includes(".sourceCommit"), "Android publisher must validate the artifact source commit");
assert.ok(
  publish.includes('if [[ "${SOURCE_COMMIT}" != "${TAG_TARGET_SHA}" ]]') &&
    publish.includes("Android artifact/tag provenance mismatch"),
  "Every Android release path must bind signed artifact metadata to the immutable tag target commit",
);
const requiredReleaseContexts = publish.split("required_contexts=(")[1]?.split(")")[0] ?? "";
assert.ok(
  publish.includes("required_contexts=(") &&
    requiredReleaseContexts.includes("ci/circleci: config-guard") &&
    requiredReleaseContexts.includes("ci/circleci: source-verify") &&
    requiredReleaseContexts.includes("ci/circleci: application-build-docs") &&
    !requiredReleaseContexts.includes("ci/circleci: android-release-draft") &&
    requiredReleaseContexts.includes("ci/circleci: supabase-production-gate") &&
    requiredReleaseContexts.includes("ci/circleci: android-rebuild") &&
    requiredReleaseContexts.includes("ci/circleci: android-release-dispatch") &&
    publish.includes('select(.context != "ci/circleci: android-release-draft")') &&
    publish.includes("authenticated release preflight verified the single eligible draft") &&
    publish.includes("ZIKR / Quality Gate") &&
    publish.includes("check-runs?per_page=100") &&
    !publish.includes("github.event_name != 'workflow_dispatch'"),
  "Android publishing must require every substantive CircleCI/GitHub gate and allow only the private-draft visibility check to be replaced by its authenticated release preflight",
);
assert.ok(publish.includes("checks: read") && publish.includes("statuses: read"), "Android publisher must have read-only permissions for commit statuses and check runs");
assert.ok(
  publish.includes("github.event_name == 'workflow_dispatch'") &&
    publish.includes("inputs.retry == true") &&
    publish.includes("startsWith(github.ref_name, 'android-release-v')"),
  "Android recovery branch dispatch must require an explicit retry input",
);
assert.ok(publish.includes("SHA256SUMS"), "Android publisher must verify and publish checksums");
assert.ok(publish.includes("release-metadata.json"), "Android publisher must verify and publish release metadata");
assert.ok(publish.includes('gh api --method PATCH "repos/${GITHUB_REPOSITORY}/releases/${RELEASE_ID}"'), "Android publisher must publish the resolved GitHub release ID after asset verification");
assert.ok(publish.includes('repos/${GITHUB_REPOSITORY}/releases?per_page=100'), "Android publisher must resolve draft releases from the releases list API");
assert.ok(publish.includes("MATCH_COUNT > 1") && publish.includes("Ambiguous Android release draft"), "Android publisher must refuse to select an arbitrary release when duplicate drafts share a tag");
assert.ok(publish.includes("Found ${MATCH_COUNT} GitHub releases for ${TAG}"), "Android publisher duplicate-release diagnostics must include the actual tag and count");
assert.ok(publish.includes('releases/413815658'), "Android publisher must recover the existing v1.1.4 draft by ID if the release list omits it");
assert.ok(publish.includes('gh release upload "$TAG" "$asset"') && publish.includes('--repo "$GITHUB_REPOSITORY"'), "Android publisher must upload verified binaries to the canonical repository and release tag through GitHub CLI");
assert.ok(!publish.includes('https://uploads.github.com/'), "Android publisher must not use the legacy direct upload endpoint that caused the 404 race");
assert.ok(publish.includes('repos/${GITHUB_REPOSITORY}/releases/${RELEASE_ID}'), "Android publisher must read the release by immutable ID");
assert.ok(!publish.includes('gh release view "$TAG"'), "Android publisher must not rely on tag lookup to resolve a draft release");
assert.ok(!publish.includes('gh release download "$TAG"'), "Android publisher must verify binaries by direct asset URLs rather than draft tag lookup");

assert.ok(publish.includes("Published immutable release is missing Android assets"), "Android publisher must refuse to mutate a published immutable release that lacks APK/AAB assets");
assert.ok(publish.includes('steps.release_state.outputs.upload_allowed == \'true\''), "Android asset upload must be restricted to draft releases");
assert.ok(publish.includes("Verify published GitHub Release contains the exact signed assets"), "Android publisher must verify assets after publication");
assert.ok(publish.includes("cmp -s"), "Android publisher must compare the downloaded GitHub assets with the checksum-verified build files");
assert.ok(publish.includes("Fail fast if a published immutable release is missing APK/AAB"), "Android publisher must not waste an hour waiting for artifacts when the release is already immutable and incomplete");
assert.ok(publish.includes("keep it in draft until the signed artifacts pass verification"), "Android release must stay in draft until assets are ready");
const androidApkDownload = read("src/app/api/download/android/route.ts");
const androidAabDownload = read("src/app/api/download/android/aab/route.ts");
const androidAppVersion = read("src/app/api/app-version/route.ts");
for (const [name, source] of [["APK download", androidApkDownload], ["AAB download", androidAabDownload], ["App version metadata", androidAppVersion]]) {
  assert.ok(!source.includes("verifiedSupabaseUrl"), name + " must never redirect Android binaries to Supabase Storage");
  assert.ok(!source.includes("storage/v1/object/public/android-releases"), name + " must keep binary delivery on GitHub Releases");
}
assert.ok(androidApkDownload.includes("getSignedGitHubAssetUrl") && androidAabDownload.includes("getSignedGitHubAssetUrl"), "APK and AAB download endpoints must resolve assets through GitHub Releases");
assert.ok(androidAppVersion.includes("RELEASE_DOWNLOAD_ENDPOINT") && androidAppVersion.includes("getSelectedAndroidRelease"), "Native app update metadata must advertise GitHub-backed release endpoints using the shared selected release");
for (const [name, source] of [["APK download", androidApkDownload], ["AAB download", androidAabDownload], ["App version metadata", androidAppVersion]]) {
  assert.ok(source.includes("getSelectedAndroidRelease"), name + " must use the same admin-selected stable release");
}
const androidReleaseService = read("src/features/releases/services/github-android-release.ts");
assert.ok(androidReleaseService.includes("return selectAndroidRelease(latestStable, pinnedRelease)"), "The shared Android release resolver must honor the validated admin pin before automatic latest selection");
assert.ok(androidReleaseService.includes("function hasAab("), "Android release discovery must explicitly detect AAB assets");
assert.ok(androidReleaseService.includes("hasApk(release) &&\n        hasAab(release)"), "Latest stable Android release must have both APK and AAB assets");
assert.ok(androidReleaseService.includes("!hasApk(release) || !hasAab(release)"), "Pinned Android releases missing either APK or AAB must be rejected");

const circle = read(".circleci/config.yml");
assert.ok(androidDraftJob.includes('"/releases?per_page=100&page=1"'), "CircleCI must inspect all draft and published release records for the canonical tag");
assert.ok(androidDraftJob.includes("matchingReleases.length > 1"), "CircleCI must fail closed when multiple release drafts share one tag");
assert.ok(androidDraftJob.includes("isReleasePreparationCommit"), "CircleCI must wait for the Admin Release service only on its atomic release-preparation commit");
assert.ok(!androidDraftJob.includes('api("/releases", "POST"'), "CircleCI must not create a second GitHub draft release");
assert.ok(!androidDraftJob.includes('api("/git/tags", "POST"'), "CircleCI must not race the Admin Release service to create immutable tags");
const androidDispatchJob = circle.split("  android-release-dispatch:")[1]?.split("\nworkflows:")[0] ?? "";
assert.ok(androidDispatchJob.includes("GH_TOKEN"), "Android recovery dispatch must use a protected GitHub token");
assert.ok(androidDispatchJob.includes("actions/workflows/dispatch-android-release-recovery.yml/dispatches"), "CircleCI must dispatch the guarded recovery workflow after the signed build");
assert.ok(androidDispatchJob.includes('RECOVERY_REF="$CIRCLE_TAG"'), "CircleCI tag releases must dispatch the exact release tag, not a synthetic branch");
assert.ok(androidDispatchJob.includes('RECOVERY_REF="$CIRCLE_BRANCH"'), "CircleCI branch recovery must preserve the exact guarded branch");
assert.ok(recoveryDispatch.includes("startsWith(github.ref, 'refs/tags/v')"), "Android recovery must accept the canonical release tag ref");
assert.ok(recoveryDispatch.includes('const isTagDispatch = context.ref === "refs/tags/" + tag;'), "Android recovery must distinguish exact tag dispatch from branch recovery");
assert.ok(recoveryDispatch.includes('ref: isPushRecoveryTrigger ? "main" : (isTagDispatch ? tag : recoveryBranch)') && recoveryDispatch.includes("source_commit: sourceSha"), "owner-only recovery must run the latest publisher from main while passing the exact immutable tag source SHA");


assert.ok(circle.includes('REPOSITORY="zikrofficial-X/Zikr"') && circle.includes('https://github.com/${REPOSITORY}/releases/download/'), "CircleCI Android release metadata must use GitHub Releases in the canonical repository");
const androidJob =
  circle.match(/^  android-rebuild:\n([\s\S]*?)(?=^  [a-z0-9_-]+:\n|^workflows:\n)/m)?.[1] ?? "";
assert.match(
  androidJob,
  /NEXT_PUBLIC_SUPABASE_URL:\s*"?https:\/\/zqtssvlvmkzeeyqghqfk\.supabase\.co"?/,
  "Android job must use the canonical public Supabase URL",
);
assert.ok(androidJob.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY:"), "Android job must declare the public Supabase anon key required by preflight");
assert.ok(!androidJob.includes("\n      SUPABASE_URL: https://zqtssvlvmkzeeyqghqfk.supabase.co"), "Android artifact publisher must not configure a Supabase storage URL");
const androidSupabaseCredentialLines = androidJob
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^(?:SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY):/.test(line));
assert.deepEqual(
  androidSupabaseCredentialLines.sort(),
  ['SUPABASE_SERVICE_ROLE_KEY: ""', 'SUPABASE_URL: ""'],
  "Android artifact publisher must explicitly shadow inherited Supabase credentials",
);
assert.ok(androidJob.includes("GH_TOKEN"), "Android artifact publisher must use a protected GitHub token");
const releaseWorkflow = circle.split("workflows:\n")[1] ?? "";
const androidWorkflowJob = releaseWorkflow.split("- android-rebuild:")[1]?.split("\n      - ")[0] ?? "";
assert.ok(androidWorkflowJob.includes("context:\n            - android-signing"), "Signed Android build must use the protected android-signing context");
assert.ok(androidWorkflowJob.includes("requires:\n            - source-verify\n            - supabase-production-gate"), "Signed Android build must wait for both source validation and Supabase production preflight");
const dispatchWorkflowJob = releaseWorkflow.split("- android-release-dispatch:")[1]?.split("\n      - ")[0] ?? "";
assert.ok(dispatchWorkflowJob.includes("requires:\n            - android-rebuild"), "Android recovery dispatch must wait for the signed Android build to finish successfully");

assert.ok(circle.includes("ANDROID_KEYSTORE_BASE64"), "Android release must require protected signing material");
assert.ok(circle.includes("Detected Android versionName"), "Android release must validate the generated version");
assert.ok(circle.includes('"$AAPT" dump badging "$APK"'), "Android release must inspect APK metadata with JAXB-independent aapt");
assert.ok(circle.includes('test -x "$AAPT"'), "Android release must fail closed if APK metadata tooling is missing");
assert.ok(circle.includes("APK versionCode ($VERSION_CODE) does not match Gradle ($EXPECTED_VERSION_CODE)."), "Android release must validate the APK versionCode");
assert.ok(!circle.includes('VERSION_CODE="56"'), "Android release must not silently substitute an obsolete versionCode");

const finalization = read(".github/workflows/release-finalization.yml");
const appleAssociationChecks = finalization.match(/- name: Verify Apple App Site Association configuration before production build/g) ?? [];
assert.equal(appleAssociationChecks.length, 1, "production release workflow must contain exactly one Apple App Site Association preflight");
assert.ok(finalization.includes("github.ref == 'refs/heads/main'"), "web production release must be main-only");
assert.ok(finalization.includes("environment:\n      name: production"), "web production release must use the protected production environment");
assert.ok(finalization.includes("secrets.ZIKR_VERCEL_TOKEN"), "web production release must prefer the dedicated Vercel credential secret");
assert.ok(finalization.includes("secrets.VERCEL_DEPLOY_TOKEN") && finalization.includes("secrets.VERCEL_TOKEN"), "web production release must support common alternate GitHub secret names");
assert.ok(finalization.includes("Add the token as a GitHub Actions SECRET named ZIKR_VERCEL_TOKEN (preferred), VERCEL_DEPLOY_TOKEN, or VERCEL_TOKEN"), "missing-token diagnostics must name all supported GitHub secret names");
assert.ok(finalization.includes("Vercel project Environment Variables are not available to this GitHub Actions workflow"), "missing-token diagnostics must distinguish GitHub Actions secrets from Vercel project variables");
assert.ok(finalization.split("secrets.ZIKR_VERCEL_TOKEN || secrets.VERCEL_DEPLOY_TOKEN || secrets.VERCEL_TOKEN").length - 1 === 7, "every Vercel release and inspection step must use the same secret fallback resolution");
assert.ok(finalization.includes("node scripts/verify-vercel-deployment-ready.mjs"), "web production release must verify Vercel READY state and approved deployment identity");
assert.ok(finalization.includes("node scripts/verify-supabase-edge-health.mjs"), "web production release must smoke-test the deployed Supabase health Edge Function");
assert.ok(finalization.includes("pnpm production:smoke"), "web production release must verify its deployment");
assert.ok(finalization.includes("fetch-depth: 0"), "schema-baseline verification must have the parent commit available");
assert.ok(finalization.includes('git worktree add --detach "${baseline}" "${GITHUB_SHA}^"'), "schema baseline must be checked against the commit before this release");
assert.ok(finalization.includes('supabase db push --db-url "${SUPABASE_DB_URL}" --yes'), "pending SQL migrations must be applied through the controlled production release");
assert.equal(finalization.split("secrets.SUPABASE_DB_URL || secrets.POSTGRES_URL_NON_POOLING").length - 1, 5, "the explicitly configured Supabase release URL must take precedence over a stale generic Postgres secret in every release phase");
assert.ok(!finalization.includes("secrets.POSTGRES_URL_NON_POOLING || secrets.SUPABASE_DB_URL"), "a generic Postgres secret must not silently override the dedicated Supabase release URL");
const baselineStep = finalization.indexOf("Verify production data and baseline schema against parent commit");
const vercelPullStep = finalization.indexOf("Pull production Vercel configuration");
const buildStep = finalization.indexOf("Build production artifact");
const preMigrationShaStep = finalization.indexOf("Recheck approved main SHA immediately before production database changes");
const deployStep = finalization.indexOf("Deploy prebuilt artifact to production");
const migrationStep = finalization.indexOf("Apply pending production migrations before deployment");
const schemaStep = finalization.indexOf("Verify production schema after migration");
const finalSmokeStep = finalization.indexOf("Production smoke test after schema migration and deployment");
assert.ok(baselineStep >= 0 && baselineStep < vercelPullStep && vercelPullStep < buildStep && buildStep < preMigrationShaStep && preMigrationShaStep < migrationStep, "Vercel configuration pull, production build, and exact-main recheck must complete before any production database mutation");
assert.ok(migrationStep < schemaStep && schemaStep < deployStep && deployStep < finalSmokeStep, "production migrations and schema verification must finish before deploying dependent code and smoke-testing it");
assert.ok(!finalization.includes("Smoke test deployed app before schema migration"), "the application must never be smoke-tested against a schema that has not received its pending migrations");

const gameRegistry = read("src/lib/games/registry.ts");
const productionSmoke = read("scripts/verify-production-smoke.mjs");
const canonicalGameIds = [...gameRegistry.matchAll(/^  "([^"]+)": \{\n    id:/gm)].map((match) => match[1]);
assert.equal(canonicalGameIds.length, 13, "the current canonical kids game registry should expose thirteen games");
for (const id of canonicalGameIds) {
  assert.ok(productionSmoke.includes(`"${id}"`), `production smoke must cover kids game slug ${id}`);
}
assert.ok(productionSmoke.includes("/kids/${slug}"), "production smoke must test the detail page for each kids game");
assert.ok(productionSmoke.includes("/api/kids/content/${slug}"), "production smoke must test the API backing each kids game page");
assert.ok(productionSmoke.includes("payload.metadata?.gameId === slug"), "production smoke must verify game metadata, not just HTTP status");

const atomicReleaseManager = read("src/features/releases/services/github-release-manager.ts");
assert.ok(atomicReleaseManager.includes('"/git/blobs"'), "Release metadata must be written as Git blobs, not sequential Contents API updates");
assert.ok(atomicReleaseManager.includes('"/git/trees"'), "Release metadata must be assembled into one Git tree");
assert.ok(atomicReleaseManager.includes('"/git/commits"'), "Release metadata must be committed through the Git Data API exactly once");
assert.ok(atomicReleaseManager.includes("parents: [baseSha]"), "The atomic release commit must be based on the single immutable main snapshot");
assert.ok(atomicReleaseManager.includes('"/git/refs/heads/main"'), "The atomic release commit must update the main ref directly");
assert.ok(atomicReleaseManager.includes('method: "PATCH"') && atomicReleaseManager.includes("force: false"), "The main ref update must be a non-force fast-forward");
assert.ok(atomicReleaseManager.includes("latestRef.object?.sha !== baseSha"), "Release preparation must reject a concurrent main update before moving the ref");
assert.ok(atomicReleaseManager.includes("preparedCommitSha"), "The release tag and release audit must use the exact atomic commit SHA");
assert.ok(!atomicReleaseManager.includes("upsertTextFile"), "Release preparation must not create one main commit per metadata file");
assert.ok(atomicReleaseManager.includes("Promise.all(["), "All release source files must be read from the same immutable base commit");
assert.ok(atomicReleaseManager.includes("replaceMatchesExactly"), "Release metadata updates must fail closed when an expected version field is missing or duplicated");
assert.ok(atomicReleaseManager.includes("assertAllVersionsMatch"), "Release preparation must reject pre-existing Android/iOS/footer version drift");

const appVersionRoute = read("src/app/api/app-version/route.ts");
assert.ok(appVersionRoute.includes("sha256Url") && appVersionRoute.includes('"sha256sums"'), "The latest stable app-version response must expose the published SHA256SUMS asset");
const androidDownloadCard = read("src/components/platform/android-release-card.tsx");
assert.ok(androidDownloadCard.includes('id="android-download"') && androidDownloadCard.includes("release?.sha256Url"), "The Android download card must expose a stable anchor and checksum download");
const navbar = read("src/components/layout/navbar.tsx");
const mobileNav = read("src/components/layout/mobile-nav.tsx");
const footer = read("src/components/layout/footer.tsx");
const homePage = read("src/app/page.tsx");
assert.ok(navbar.includes('href="/api/download/android"') && navbar.includes("Download app"), "Desktop navigation must expose the direct Android APK download");
assert.ok(mobileNav.includes('href: "/api/download/android"'), "The mobile navigation menu must expose the direct Android APK download");
assert.ok(footer.includes('href="/api/download/android"') && footer.includes("Download APK"), "The global footer must expose the direct Android APK download");
assert.ok(homePage.includes("AndroidReleaseCard"), "The homepage must surface the Android release card");

const releaseAdminPage = read("src/app/admin/release/page.tsx");
assert.ok(releaseAdminPage.includes("operationIsStale") && releaseAdminPage.includes("operationNeedsReview"), "Release center must distinguish stale and unverified prior operations");
assert.ok(releaseAdminPage.includes("android-signing-preflight") && releaseAdminPage.includes("getAndroidReleaseSigningPreflightStatus"), "Release center must display exact-SHA signing preflight status");
assert.ok(releaseAdminPage.includes("disabled={!signingPreflight?.ready || operationIsActive || operationNeedsReview}"), "Release action must remain disabled until protected GPG preflight succeeds");
assert.equal(releaseAdminPage.includes("SIGNED_RELEASE_BLOCKER"), false, "Release page must not retain the permanent signing blocker");
const signingPreflightWorkflow = read(".github/workflows/android-release-signing-preflight.yml");
const signingWorkflow = read(".github/workflows/sign-android-release-tag.yml");
for (const workflow of [signingPreflightWorkflow, signingWorkflow]) {
  assert.ok(
    workflow.split("\n").some((line, index, lines) =>
      line.trim() === "environment:" && lines[index + 1]?.trim() === "name: android-release-signing",
    ),
    "GPG workflows must use the protected signing environment",
  );
  for (const secret of ["ANDROID_RELEASE_TAG_GPG_PRIVATE_KEY", "ANDROID_RELEASE_TAG_GPG_PASSPHRASE"]) {
    assert.ok(workflow.includes("secrets." + secret), "GPG workflows must use protected secret " + secret);
  }
  for (const variable of ["ANDROID_RELEASE_TAG_GPG_FINGERPRINT", "ANDROID_RELEASE_SIGNING_EMAIL", "ANDROID_RELEASE_SIGNING_NAME", "ANDROID_RELEASE_SIGNING_GITHUB_USER"]) {
    assert.ok(workflow.includes("vars." + variable), "GPG workflows must use protected variable " + variable);
  }
}
assert.ok(signingWorkflow.includes("git tag -s -u"), "Protected runner must create a cryptographically signed annotated tag");
assert.ok(signingWorkflow.includes("git verify-tag --raw"), "Protected runner must verify the tag locally");
assert.ok(signingWorkflow.includes(".verification.verified") && signingWorkflow.includes("reason"), "Protected runner must require GitHub cryptographic verification");
assert.ok(signingWorkflow.includes("Create the draft release only after GitHub tag verification"), "Draft Release creation must follow GitHub signature verification");
assert.ok(publish.includes("GitHub cryptographic tag signature and exact commit target"), "Publisher must re-check the signed tag before uploading APK/AAB");

const applicationBuildDocsJob = releaseWorkflow.split("- application-build-docs:")[1]?.split("\n      - ")[0] ?? "";
assert.ok(applicationBuildDocsJob.includes("branches:\n              only:\n                - main"), "Application build/docs verification must remain required for main");
assert.ok(applicationBuildDocsJob.includes("tags:\n              ignore: /.*/"), "Android semantic tags must not trigger the unrelated web application build/docs job");

console.log("✅ Release contract checks passed");
