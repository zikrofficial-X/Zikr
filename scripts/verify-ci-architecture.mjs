#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (file) => {
  assert.ok(existsSync(file), "Missing CI/CD source file: " + file);
  return readFileSync(file, "utf8");
};

const quality = read(".github/workflows/quality-gate.yml");
const video = read(".github/workflows/generate-ai-video.yml");
const social = read(".github/workflows/publish-social.yml");
const english = read(".github/workflows/english-content-sync.yml");
const release = read(".github/workflows/release-finalization.yml");
const smoke = read(".github/workflows/release-vercel.yml");
const androidPublish = read(".github/workflows/publish-android-release-assets.yml");
const insightsWorkflow = read(".github/workflows/sync-social-insights.yml");
const backgroundRunner = read("scripts/run-background-jobs.ts");
const socialWorker = read("scripts/jobs/social-publishing.ts");
assert.ok(!androidPublish.includes("branches:\n      - main"), "Android asset publishing must not trigger directly from main");
assert.ok(androidPublish.includes("workflow_dispatch:"), "Android asset publishing must retain explicit manual recovery");
assert.ok(androidPublish.includes("inputs.retry"), "Android manual recovery must require an explicit retry input");
assert.ok(androidPublish.includes("github.ref_type == 'tag'"), "Android publishing must support release tags");
assert.ok(
  androidPublish.includes("github.event_name == 'workflow_dispatch'") &&
    androidPublish.includes("inputs.retry == true") &&
    androidPublish.includes("startsWith(github.ref_name, 'android-release-v')"),
  "Android recovery branches must require an explicit workflow_dispatch retry",
);
assert.ok(
  androidPublish.includes("TAG_TARGET_SHA") &&
    androidPublish.includes("ci/circleci: source-verify") &&
    androidPublish.includes("ci/circleci: supabase-production-gate") &&
    androidPublish.includes("ci/circleci: android-rebuild") &&
    androidPublish.includes("ci/circleci: application-build-docs") &&
    androidPublish.includes("ci/circleci: config-guard") &&
    androidPublish.includes("ci/circleci: android-release-draft") &&
    androidPublish.includes("ci/circleci: android-release-dispatch") &&
    androidPublish.includes("ZIKR / Quality Gate") &&
    !androidPublish.includes("github.event_name != 'workflow_dispatch'"),
  "Every Android publish/retry path must verify the exact tag source commit and all CI gates",
);

const circle = read(".circleci/config.yml");
const sourceVerifyJob = circle.slice(circle.indexOf("  source-verify:"), circle.indexOf("  application-build-docs:"));
for (const contract of [
  "NEXT_PUBLIC_SITE_URL: https://zikrmediaofficial.vercel.app",
  "NEXT_PUBLIC_SUPABASE_URL: https://zqtssvlvmkzeeyqghqfk.supabase.co",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
  "NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID:",
  "AUTH_CALLBACK_URL: https://zikrmediaofficial.vercel.app/auth/callback",
]) {
  assert.ok(sourceVerifyJob.includes(contract), "CircleCI source-verify must receive the canonical non-secret verification environment: " + contract);
}
const ownership = read("docs/AUTOMATION_OWNERSHIP_2026-10-08.md");
const supabaseConfig = read("supabase/config.toml");
const articleTranslation = read("scripts/translate-published-articles-en.ts");
const hadithTranslation = read("scripts/sync-hadith-english.ts");
const androidRecovery = read(".github/workflows/dispatch-android-release-recovery.yml");
assert.ok(androidRecovery.includes("workflow_dispatch:"), "Android recovery must be explicitly dispatched by the successful CircleCI release pipeline");
assert.ok(!androidRecovery.includes("\n  status:") && !androidRecovery.includes("\n  push:"), "Android recovery must not subscribe to every repository status or push event");
assert.ok(androidRecovery.includes("github.event_name == 'workflow_dispatch'"), "Android recovery must accept only an explicit workflow dispatch");
assert.ok(circle.includes("android-release-dispatch:"), "CircleCI must dispatch Android recovery only after android-rebuild succeeds");
assert.ok(circle.includes("api.github.com/repos/zikrofficial-X/Zikr/actions/workflows/dispatch-android-release-recovery.yml/dispatches"), "CircleCI must invoke the guarded Android recovery workflow");


const workflowDir = ".github/workflows";
const workflowFiles = readdirSync(workflowDir)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .sort();

const workflowNames = workflowFiles.map((file) => {
  const content = read(`${workflowDir}/${file}`);
  const match = content.match(/^name:\s*(.+)$/m);
  assert.ok(match, `Workflow name missing: ${file}`);
  return { file, name: match[1].trim().replace(/^['"]|['"]$/g, ""), content };
});

const seenWorkflowNames = new Set();
for (const item of workflowNames) {
  assert.ok(!seenWorkflowNames.has(item.name), `Duplicate GitHub workflow name: ${item.file}`);
  seenWorkflowNames.add(item.name);
}

assert.ok(video.includes('cron: "17 3,9,15,21 * * *"'), "GitHub must own the recurring video generation schedule");
assert.ok(social.includes('cron: "7,22,37,52 * * * *"') && social.includes("github.event_name == 'schedule'") && !social.includes("\n  push:") && social.includes("workflow_run:"), "social publisher must retry the bounded queue every 15 minutes on main, while preserving the immediate post-generation trigger and avoiding push triggers");
assert.ok(circle.includes('cron: "17 4 * * *"'), "CircleCI must retain the recurring English content schedule");
assert.ok(!circle.includes('cron: "17 3,9,15,21 * * *"'), "CircleCI must not own the video generation schedule");
assert.ok(
  circle.includes("cat > release-metadata.json " + String.fromCharCode(92) + "<<EOF"),
  "Literal heredocs in CircleCI commands must escape the config parameter marker.",
);
assert.ok(!circle.includes("<<<"), "CircleCI shell commands must not contain unescaped here-string markers.");
const englishCredentialCheck = circle.slice(
  circle.indexOf("name: Validate production content-sync credentials"),
  circle.indexOf("name: Run bounded English content sync"),
);
const englishSyncCommand = circle.slice(
  circle.indexOf("name: Run bounded English content sync"),
  circle.indexOf("android-rebuild:"),
);
assert.ok(
  !englishCredentialCheck.includes("GEMINI_API_KEY") &&
    englishSyncCommand.includes('if [[ -n "${GEMINI_API_KEY:-}" ]]') &&
    englishSyncCommand.includes("pnpm translate:articles:en || article_status=$?") &&
    englishSyncCommand.includes("pnpm sync:hadith:en || hadith_status=$?") &&
    englishSyncCommand.includes("English sync incomplete"),
  "Daily English sync must attempt Hadith even when article translation lacks Gemini or fails.",
);
assert.ok(
  articleTranslation.includes("title_en.eq.") &&
    articleTranslation.includes("summary_en.eq.") &&
    articleTranslation.includes("content_en.eq.") &&
    articleTranslation.includes("if (!article.title_en?.trim())") &&
    articleTranslation.includes("if (!article.summary_en?.trim())") &&
    articleTranslation.includes("if (!article.content_en?.trim())") &&
    articleTranslation.includes("&or=(${field}.is.null,${field}.eq.)"),
  "English article sync must include empty fields and conditionally preserve concurrent human translations.",
);
assert.ok(
  articleTranslation.includes("Number.isInteger(value)") &&
    hadithTranslation.includes("Number.isInteger(value)"),
  "English sync batch inputs must be validated before building Supabase requests.",
);

assert.ok(quality.includes('name: "ZIKR / Quality Gate"'), "Canonical GitHub quality check name is incorrect");
assert.ok(
  quality.includes("QUALITY_GATE_FULL_SCOPE: ${{") &&
    quality.includes("github.event_name == 'workflow_dispatch'") &&
    quality.includes("github.event_name == 'push' && github.ref == 'refs/heads/main'") &&
    quality.includes("startsWith(github.head_ref, 'codex/zikr-comprehensive-repair-')") &&
    quality.includes("startsWith(github.head_ref, 'codex/zikr-final-cleanup-')") &&
    quality.includes('if [[ "${QUALITY_GATE_FULL_SCOPE}" == "true" ]]') &&
    quality.includes("pnpm verify") &&
    quality.includes("pnpm verify:pr"),
  "GitHub Quality Gate must derive the full verification scope from the GitHub event/ref context and run full verification on main, manual dispatch, and comprehensive repair PRs",
);
assert.ok(quality.includes("timeout-minutes: 30"), "Full main-branch verification must have an explicit bounded timeout");
assert.ok(quality.includes("QUALITY_GATE=PASSED_FULL"), "The main-branch gate must report full verification scope");
assert.ok(!quality.includes("ci/circleci: ci-check"), "GitHub quality gate must not impersonate CircleCI");

assert.ok(video.includes("workflow_dispatch:"), "Video worker must retain manual recovery");
assert.ok(!video.includes("\n  push:"), "Production video worker must not run on source pushes");
assert.ok(video.includes("environment: production"), "Video worker must use protected production environment");
assert.ok(video.includes("github.ref == 'refs/heads/main'"), "Video worker must be main-only");

assert.ok(social.includes('BACKGROUND_JOB_TARGET: "social"'), "Social publisher must target the social queue only");
assert.ok(social.includes('SOCIAL_PUBLISH_ENABLED: "true"'), "Social publisher must be explicitly enabled behind the protected production environment");
assert.ok(social.includes('SOCIAL_SYNC_INSIGHTS: "false"'), "Social publisher must not run expensive insights sync on every delivery");
assert.ok(social.includes("SOCIAL_PUBLISH_AFTER: \"2026-11-06T20:00:00Z\""), "Social publisher must isolate new queue rows from the historical backlog");
assert.ok(social.includes("youtube.upload") && social.includes("SOCIAL_PUBLISH_FACEBOOK_ENABLED") && social.includes("SOCIAL_PUBLISH_YOUTUBE_ENABLED"), "Social preflight must validate provider readiness before delivery");
assert.ok(social.includes("environment: production"), "Social publisher must use protected production environment");
assert.ok(!social.includes("if: false"), "Social publishing must not retain the retired kill switch");
const socialEnvironment = social.slice(social.indexOf("    env:"), social.indexOf("    steps:"));
assert.ok(!socialEnvironment.includes("YOUTUBE_REFRESH_TOKEN"), "Stored OAuth refresh tokens must never be injected into GitHub Actions");
assert.ok(social.includes("workflow_dispatch:"), "Social publisher must retain explicit manual recovery");
assert.ok(
  insightsWorkflow.includes('BACKGROUND_JOB_TARGET: "insights"') &&
    insightsWorkflow.includes('SOCIAL_PUBLISH_ENABLED: "false"') &&
    insightsWorkflow.includes('SOCIAL_SYNC_INSIGHTS: "true"') &&
    insightsWorkflow.includes("run: pnpm background:jobs") &&
    !insightsWorkflow.includes("FACEBOOK_PUBLISHING_REQUESTED") &&
    !insightsWorkflow.includes("YOUTUBE_PUBLISHING_REQUESTED") &&
    !insightsWorkflow.includes("YOUTUBE_CLIENT_SECRET") &&
    !insightsWorkflow.includes("ADMIN_QUEUE_ALERT_WEBHOOK_URL") &&
    !insightsWorkflow.includes("RESEND_API_KEY") &&
    !insightsWorkflow.includes("pages_manage_posts") &&
    !insightsWorkflow.includes("youtube.upload"),
  "Daily insights workflow must use the isolated insights target, disable publishing, and receive no unused publishing-only credentials or upload scopes",
);
assert.ok(
  backgroundRunner.includes('const videos = target === "all" || target === "videos"') &&
    backgroundRunner.includes('const sitePublishing = target === "all" || target === "videos"') &&
    backgroundRunner.includes('const social = target === "all" || target === "social"') &&
    backgroundRunner.includes('const insights = target === "insights" ? await syncSocialInsights() : null'),
  "The insights target must not invoke video generation, site-content publishing, or social queue processing",
);
const insightsService = socialWorker.slice(
  socialWorker.indexOf("export async function syncSocialInsights()"),
  socialWorker.indexOf("export async function processSocialPublishQueue"),
);
assert.ok(
  insightsService.includes("syncFacebookReelsInsights") &&
    insightsService.includes("syncYoutubePublishedPostInsights") &&
    !insightsService.includes("claimPendingSocialPublishItems") &&
    !insightsService.includes("processSocialPublishItem"),
  "The analytics-only service must update published-post insights without claiming or publishing queue rows",
);
assert.ok(!english.includes("\n  schedule:"), "GitHub English sync must not own an automatic schedule");
assert.ok(english.includes("environment: production"), "English sync must use protected production environment");
assert.ok(english.includes("github.ref == 'refs/heads/main'"), "English sync must be main-only");

assert.ok(release.includes("github.ref == 'refs/heads/main'"), "Controlled Vercel release must be main-only");
assert.ok(
  release.includes("Smoke test deployed app before schema migration") &&
    release.includes("Post-migration production smoke test"),
  "Controlled release must smoke-test the deployed app before and after applying database migrations",
);
assert.ok(release.includes("Apply pending production migrations after deployment"), "Controlled release must apply access-restricting migrations only after compatible code is live");
assert.ok(release.includes("Verify production schema after migration"), "Controlled release must verify schema parity after applying migrations");
assert.ok(release.includes("pnpm release:contract:check"), "Controlled release must use the canonical release contract check");
assert.ok(release.includes("pnpm production:smoke"), "Controlled release must use the canonical production smoke script");
assert.ok(!release.includes("--token"), "Controlled Vercel release must not pass credentials through CLI arguments");
assert.ok(release.includes("environment:\n      name: production"), "Controlled release must use the protected production environment");
assert.ok(release.includes("workflow_dispatch:"), "Production release must remain manually triggerable");
assert.ok(release.includes("cancel-in-progress: false"), "An active production release must never be cancelled between deploy and schema migration");
assert.ok(release.includes("checks: read") && release.includes("statuses: read"), "Production release must have read-only permission to verify CI gates");
assert.ok(
  release.includes("ci/circleci: config-guard") &&
    release.includes("ci/circleci: source-verify") &&
    release.includes("ci/circleci: application-build-docs") &&
    release.includes("ci/circleci: android-release-draft") &&
    release.includes("ZIKR / Quality Gate"),
  "Production release must verify the exact commit's required CircleCI contexts and GitHub Quality Gate",
);
assert.ok(
  release.includes("git rev-parse origin/main") &&
    release.includes("Verify the approved main commit and required CI gates") &&
    release.includes("Recheck approved main SHA immediately before production deployment"),
  "Production release must reject stale queued commits and recheck main before deploying",
);
assert.ok(!release.includes("\n  push:"), "Production release must not be enqueued on ordinary source pushes");
assert.ok(release.includes("github.event_name == 'workflow_dispatch' && inputs.confirmation == 'RELEASE'"), "Manual production deployment must retain explicit RELEASE confirmation");
assert.ok(release.includes("Missing Vercel deployment credential"), "Controlled release must fail before build when VERCEL_TOKEN is missing");
assert.ok(release.includes("python3 scripts/verify-supabase-db-url.py"), "Controlled release must validate the effective Supabase URL user before connecting");
const reconciliationWorkflow = read(".github/workflows/reconcile-supabase-migration-history.yml");
assert.ok(reconciliationWorkflow.includes("python3 scripts/verify-supabase-db-url.py"), "Migration-history reconciliation must validate the effective Supabase URL user before connecting");
assert.ok(reconciliationWorkflow.includes("PGSSLMODE: require"), "Migration-history reconciliation must require TLS for PostgreSQL connections");
const dbUrlValidator = read("scripts/verify-supabase-db-url.py");
assert.ok(dbUrlValidator.includes("zikr_seed_loader") && dbUrlValidator.includes("sslmode"), "Supabase connection validation must block the retired role and weak TLS settings");
assert.ok(release.indexOf("Fail fast on missing or unsafe production credentials") < release.indexOf("Install dependencies"), "Production credential checks must run before dependency installation");
assert.ok(!release.includes("\n  push:"), "The release workflow must not enqueue guarded skipped jobs on ordinary pushes");
assert.ok(release.includes("bash scripts/reconcile-supabase-migration-history.sh"), "Production release must audit and reconcile Supabase migration history against the checked schema baseline and again after applying pending SQL");
const reconciliation = read("scripts/reconcile-supabase-migration-history.sh");
assert.ok(reconciliation.includes("SUPABASE_DB_URL") && reconciliation.includes("EXPECTED_PROJECT_REF"), "Migration reconciliation must require and verify an explicit production project target");
assert.ok(reconciliation.indexOf("supabase db diff") >= 0 && reconciliation.indexOf("supabase db diff") < reconciliation.indexOf("supabase migration repair"), "Migration history must not be repaired before schema-diff verification");
assert.ok(reconciliation.includes("--use-pg-delta") && reconciliation.includes("--strict-coverage"), "Migration reconciliation must use strict schema diff coverage rather than the legacy diff engine");
assert.ok(reconciliation.includes("consumes role:zikr_seed_loader") && reconciliation.includes("--use-migra") && reconciliation.includes("role_exists"), "Legacy migra fallback must be limited to the retired-role dependency and require the role to be absent on the live target");
assert.ok(reconciliation.includes("env -u PGSSLMODE supabase db diff"), "Schema diff must not leak the remote TLS requirement into the local shadow database");
assert.ok(reconciliation.includes("SCHEMA DRIFT DETECTED") && reconciliation.includes("public.quran_ayahs"), "Migration repair must fail closed on schema drift and check canonical Quran data");
assert.ok(reconciliation.includes("SUPABASE_MIGRATION_HISTORY_RECONCILED"), "Migration reconciliation must verify the final local/remote version count");
const tafsirRestore = read("scripts/restore-quran-tafsir.sh");
const tafsirVerifier = read("scripts/verify-quran-tafsir-backfill.mjs");
assert.ok(tafsirRestore.includes("--single-transaction"), "Quran tafsir source chunks must be restored atomically");
assert.ok(tafsirRestore.includes("التفسير الميسر") && tafsirRestore.includes("6236"), "Quran tafsir restore must target only the verified 6,236-row Muyassar corpus");
assert.ok(release.includes("TAFSIR_EXPECTED_COUNT=0,6236"), "Baseline release verification must accept an absent or complete corpus, not partial data");
assert.ok(release.includes("bash scripts/restore-quran-tafsir.sh"), "Production release must restore the canonical source-verified tafsir corpus after migrations");
assert.ok(release.indexOf("bash scripts/restore-quran-tafsir.sh") > release.indexOf("supabase db push") && release.indexOf("bash scripts/restore-quran-tafsir.sh") < release.indexOf('TAFSIR_EXPECTED_COUNT: "6236"'), "Tafsir restore must run after migration push and before strict production verification");
assert.ok(reconciliationWorkflow.includes('TAFSIR_EXPECTED_COUNT: "0,6236"'), "History-only reconciliation must allow only the current absent or complete tafsir state");
assert.ok(tafsirVerifier.includes("6236") && tafsirVerifier.includes("114"), "CI must verify all 6,236 source rows across 114 Quran surahs");

assert.ok(smoke.includes("name: ZIKR Production Smoke Verification"), "Manual production smoke workflow name is incorrect");
assert.ok(smoke.includes("node scripts/verify-production-smoke.mjs"), "Manual smoke workflow must use the canonical production smoke script");
assert.ok(smoke.includes("workflow_dispatch:"), "Live production smoke must remain manually available");
assert.ok(!smoke.includes("\n  push:"), "Live production smoke must not be enqueued on ordinary source pushes");
assert.ok(smoke.includes("github.event_name == 'workflow_dispatch' && inputs.confirmation == 'RELEASE'"), "Manual live production smoke must retain explicit confirmation");
assert.ok(!smoke.includes("vercel deploy"), "The read-only smoke workflow must never deploy");

assert.ok(androidPublish.includes("github.ref_type == 'tag'"), "Android publishing must support release tags");
assert.ok(androidPublish.includes("docs/finalization/RELEASE_RETRY.flag"), "Android publishing must require explicit release state for non-tag recovery");

assert.ok(!circle.includes("main-source-verification:"), "CircleCI must not duplicate main source verification");
assert.ok(!circle.includes("android-release-on-build-tag:"), "CircleCI must not retain the redundant Android build-tag workflow");
const androidReleaseManager = read("src/features/releases/services/github-release-manager.ts");
assert.ok(androidReleaseManager.includes("/git/tags"), "Admin Android release manager must create the tag object");
assert.ok(androidReleaseManager.includes("/git/refs"), "Admin Android release manager must create the tag ref");
assert.ok(androidReleaseManager.includes("/releases"), "Admin Android release manager must create the draft GitHub release");
assert.ok(androidReleaseManager.includes("draft: true"), "Admin Android release manager must create a draft release before artifact verification");
assert.ok(!androidReleaseManager.includes("buildTag"), "Admin Android release manager must not create a redundant -build tag");
assert.ok(circle.includes("  source-verify:"), "CircleCI source verification job name must be explicit");
assert.ok(circle.includes("  application-build-docs:"), "CircleCI must own the application build/documentation artifact job");
assert.ok(circle.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY:"), "CircleCI application builds must receive the canonical public Supabase key");
assert.ok(circle.includes("pnpm ci:build:report"), "CircleCI must use the canonical application build report command");
const pkg = JSON.parse(read("package.json"));
assert.ok(pkg.scripts["ci:build:report"], "package.json must register the canonical application build report command");
assert.ok(!circle.includes("  background-jobs:"), "CircleCI must not own the production video/social worker");
assert.ok(ownership.includes("GitHub Actions is the only production scheduler"), "automation ownership map must declare single video/social scheduler ownership");
assert.ok(ownership.includes("CircleCI must never execute `scripts/run-background-jobs.ts`"), "automation ownership map must prohibit CircleCI video/social execution");
for (const fn of ["health", "spiritual-ai", "prayer-notification-worker", "source-verified-content-agent"]) {
  assert.ok(supabaseConfig.includes(`[functions.${fn}]`), `Supabase config must declare active Edge Function: ${fn}`);
}
assert.ok(!supabaseConfig.includes("[functions.sync-youtube-facebook]"), "retired social sync Edge Function must not be reintroduced");

for (const file of [
  ".github/workflows/generate-ai-video.yml",
  ".github/workflows/publish-social.yml",
  ".github/workflows/english-content-sync.yml",
  ".github/workflows/release-finalization.yml",
]) {
  const content = read(file);
  assert.ok(
    content.includes("environment: production") || content.includes("environment:\n      name: production"),
    file + " must bind the production environment",
  );
}


assert.ok(!quality.includes("paths-ignore:"), "Markdown/content-only changes must not bypass the canonical quality gate");

const productionSmoke = read("scripts/verify-production-smoke.mjs");
for (const route of [
  "/",
  "/about",
  "/contact",
  "/editorial-policy",
  "/faq",
  "/privacy",
  "/terms",
  "/quran",
  "/hadith",
  "/adhkar",
  "/dua",
  "/duas",
  "/stories",
  "/prophets",
  "/companions",
  "/scholars",
  "/battles",
  "/conquests",
  "/articles",
  "/videos",
  "/audio",
  "/radio",
  "/reciters",
  "/poetry",
  "/memorization",
  "/kids",
  "/prayer-times",
  "/qibla",
  "/spiritual-ai",
  "/tafsir",
  "/tasbeeh",
  "/tawasheeh",
  "/wird",
  "/zakat",
  "/youtube",
  "/search",
  "/sections",
  "/knowledge",
  "/library",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap-index.xml",
]) {
  assert.ok(
    productionSmoke.includes(`"${route}"`),
    `Production smoke must cover ${route}`,
  );
}

const duaPage = read("src/app/dua/page.tsx");
assert.ok(duaPage.includes('{isEnglish ? "Islamic Duas" : "الأدعية الإسلامية"}'), "Dua hero heading must respect the selected language");
const articlesPage = read("src/app/articles/page.tsx");
assert.ok(articlesPage.includes('{isEnglish ? "Islamic Articles" : "المقالات الإسلامية"}'), "Articles hero heading must respect the selected language");
assert.ok(productionSmoke.includes("sort((left, right) => right.length - left.length)"), "Production smoke must select substantive content over a streamed loading fallback");
assert.ok(productionSmoke.includes("return extractText(withoutNonContent);"), "Production smoke must account for streamed content emitted outside the first main block");
assert.ok(productionSmoke.includes("bestMain.length >= 35"), "Production smoke must use full document text when the main element is only a streaming fallback");
assert.ok(productionSmoke.includes("expectedMain: /نتعلم|الأطفال|الاطفال/i"), "Kids smoke check must accept the actual localized page title");
const backfillSafetyWorkflow = read(".github/workflows/backfill-legacy-video-qa.yml");
assert.ok(
  backfillSafetyWorkflow.includes("inputs.confirmation == 'APPLY_QA_BACKFILL'") &&
    !backfillSafetyWorkflow.includes("[apply-legacy-kids-qa]") &&
    !backfillSafetyWorkflow.includes("github.event.head_commit.message"),
  "Production legacy QA backfill must require manual typed confirmation and never use a commit-message apply trigger",
);
const storageSafetyWorkflow = read(".github/workflows/storage-retention.yml");
assert.ok(
  storageSafetyWorkflow.includes("if: github.ref == 'refs/heads/main'") &&
    storageSafetyWorkflow.includes("ref: main"),
  "Storage retention must run only from canonical main and check out that exact branch before reading production credentials",
);
assert.ok(
  storageSafetyWorkflow.includes("inputs.confirmation == 'DELETE_STAGING_COPIES'") &&
    !storageSafetyWorkflow.includes("github.event_name == 'schedule' ||"),
  "Scheduled storage retention must remain dry-run and deletion must require typed manual confirmation",
);
const offlineSafetyWorkflow = read(".github/workflows/refresh-offline-content.yml");
assert.ok(
  offlineSafetyWorkflow.includes("if: github.ref == 'refs/heads/main'") &&
  offlineSafetyWorkflow.includes("pull-requests: write") &&
    offlineSafetyWorkflow.includes("automation/offline-content-snapshot") &&
    offlineSafetyWorkflow.includes("gh pr create") &&
    offlineSafetyWorkflow.includes("gh workflow run quality-gate.yml") &&
    !offlineSafetyWorkflow.includes("git push origin HEAD:main"),
  "Offline snapshot automation must publish through a reviewable PR, never directly to main",
);
const circleSafetyBranches = read(".circleci/config.yml");
assert.ok(
  circleSafetyBranches.includes("comprehensive-repair-safety-20261110") &&
    circleSafetyBranches.includes("offline-content-snapshot"),
  "CircleCI source and application build gates must cover the safety remediation and generated offline snapshot branches",
);

console.log("✅ CI/CD architecture checks passed");
