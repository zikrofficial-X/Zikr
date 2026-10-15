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
assert.ok(!androidPublish.includes("branches:\n      - main"), "Android asset publishing must not trigger directly from main");
assert.ok(androidPublish.includes("workflow_dispatch:"), "Android asset publishing must retain explicit manual recovery");
assert.ok(androidPublish.includes("inputs.retry"), "Android manual recovery must require an explicit retry input");
assert.ok(androidPublish.includes("github.ref_type == 'tag'"), "Android publishing must support release tags");

const circle = read(".circleci/config.yml");
const ownership = read("docs/AUTOMATION_OWNERSHIP_2026-10-08.md");
const supabaseConfig = read("supabase/config.toml");

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
assert.ok(social.includes('cron: "*/15 * * * *"'), "GitHub must own the recurring social publishing schedule");
assert.ok(circle.includes('cron: "17 4 * * *"'), "CircleCI must retain the recurring English content schedule");
assert.ok(!circle.includes('cron: "17 3,9,15,21 * * *"'), "CircleCI must not own the video generation schedule");

assert.ok(quality.includes('name: "ZIKR / Quality Gate"'), "Canonical GitHub quality check name is incorrect");
assert.ok(quality.includes("run: pnpm verify:pr"), "GitHub Quality Gate must remain verification-only and not own the application build");
assert.ok(!quality.includes("run: pnpm verify\\n"), "GitHub Quality Gate must not run the full build-bearing verification chain");
assert.ok(!quality.includes("ci/circleci: ci-check"), "GitHub quality gate must not impersonate CircleCI");

assert.ok(video.includes("workflow_dispatch:"), "Video worker must retain manual recovery");
assert.ok(!video.includes("\n  push:"), "Production video worker must not run on source pushes");
assert.ok(video.includes("environment: production"), "Video worker must use protected production environment");
assert.ok(video.includes("github.ref == 'refs/heads/main'"), "Video worker must be main-only");

assert.ok(social.includes('BACKGROUND_JOB_TARGET: "social"'), "Social publisher must target the social queue only");
assert.ok(social.includes('SOCIAL_PUBLISH_ENABLED: "true"'), "Social publisher must explicitly enable publishing");
assert.ok(social.includes("environment: production"), "Social publisher must use protected production environment");
assert.ok(social.includes("github.ref == 'refs/heads/main'"), "Social publisher must be main-only");

assert.ok(!english.includes("\n  schedule:"), "GitHub English sync must not own an automatic schedule");
assert.ok(english.includes("environment: production"), "English sync must use protected production environment");
assert.ok(english.includes("github.ref == 'refs/heads/main'"), "English sync must be main-only");

assert.ok(release.includes("github.ref == 'refs/heads/main'"), "Controlled Vercel release must be main-only");
assert.ok(release.includes("Production smoke test on deployed artifact"), "Controlled release must verify the deployment it just created");
assert.ok(release.includes("pnpm release:contract:check"), "Controlled release must use the canonical release contract check");
assert.ok(release.includes("pnpm production:smoke"), "Controlled release must use the canonical production smoke script");
assert.ok(!release.includes("--token"), "Controlled Vercel release must not pass credentials through CLI arguments");
assert.ok(release.includes("environment:\n      name: production"), "Controlled release must use the protected production environment");
assert.ok(release.includes("workflow_dispatch:"), "Production release must remain manually triggerable");
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
assert.ok(release.includes("bash scripts/reconcile-supabase-migration-history.sh"), "Production release must audit and safely reconcile Supabase migration history before deploy");
const reconciliation = read("scripts/reconcile-supabase-migration-history.sh");
assert.ok(reconciliation.includes("SUPABASE_DB_URL") && reconciliation.includes("EXPECTED_PROJECT_REF"), "Migration reconciliation must require and verify an explicit production project target");
assert.ok(reconciliation.indexOf("supabase db diff") >= 0 && reconciliation.indexOf("supabase db diff") < reconciliation.indexOf("supabase migration repair"), "Migration history must not be repaired before schema-diff verification");
assert.ok(reconciliation.includes("--use-pg-delta") && reconciliation.includes("--strict-coverage"), "Migration reconciliation must use strict schema diff coverage rather than the legacy diff engine");
assert.ok(reconciliation.includes("consumes role:zikr_seed_loader") && reconciliation.includes("--use-migra") && reconciliation.includes("role_exists"), "Legacy migra fallback must be limited to the retired-role dependency and require the role to be absent on the live target");
assert.ok(reconciliation.includes("env -u PGSSLMODE supabase db diff"), "Schema diff must not leak the remote TLS requirement into the local shadow database");
assert.ok(reconciliation.includes("SCHEMA DRIFT DETECTED") && reconciliation.includes("public.quran_ayahs"), "Migration repair must fail closed on schema drift and check canonical Quran data");
assert.ok(reconciliation.includes("SUPABASE_MIGRATION_HISTORY_RECONCILED"), "Migration reconciliation must verify the final local/remote version count");

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
console.log("✅ CI/CD architecture checks passed");
