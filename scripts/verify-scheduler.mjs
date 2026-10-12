#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing scheduler file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const workflow = read(".github/workflows/generate-ai-video.yml");
if (!workflow.includes('cron: "17 3,9,15,21 * * *"')) failures.push("GitHub video worker must own the four-times-daily production schedule");
if (workflow.includes("\n  push:")) failures.push("production video generation must not start automatically on source pushes");
if (!workflow.includes("if: github.ref == 'refs/heads/main'")) failures.push("video worker must restrict production secrets to main");
if (!workflow.includes("environment: production")) failures.push("video worker must use the existing production-secret environment");
if (!workflow.includes("concurrency:")) failures.push("video worker must define concurrency protection");
if (!workflow.includes("group: zikr-autonomous-video-worker")) failures.push("video worker concurrency group is missing");
if (!workflow.includes("cancel-in-progress: false")) failures.push("video worker must not cancel an active generation run");
if (!workflow.includes("workflow_dispatch:")) failures.push("video worker must retain manual recovery dispatch");
if (!workflow.includes("urgent:")) failures.push("video worker must support an urgent dispatch input");

const vercel = existsSync("vercel.json") ? readFileSync("vercel.json", "utf8") : "";
if (vercel.includes('"crons"') || vercel.includes("crons:")) failures.push("Vercel must not own production video scheduling");

const contentSync = read(".github/workflows/english-content-sync.yml");
if (contentSync.includes("\n  schedule:")) failures.push("GitHub English content sync must not own an automatic schedule");
if (!contentSync.includes("pnpm translate:articles:en") || !contentSync.includes("pnpm sync:hadith:en")) failures.push("English article/Hadith sync commands are incomplete");
if (contentSync.includes("seq 1 10")) failures.push("article translation must not rerun the same bounded batch ten times");
if (!contentSync.includes("environment: production") || !contentSync.includes("if: github.ref == 'refs/heads/main'")) failures.push("English content sync must use production secrets on main only");
if (contentSync.includes("\n  push:")) failures.push("English content sync must not write to production on every source push");
if (!contentSync.includes("workflow_dispatch:")) failures.push("English content sync must retain deliberate manual dispatch");
const articleTranslator = read("scripts/translate-published-articles-en.ts");
if (articleTranslator.includes("GEMINI_API_KEY_")) failures.push("article translation must not rotate through quota-pooling Gemini keys");
if (articleTranslator.includes("gemini-3.5-flash-lite")) failures.push("article translation must not make a second model call after a failed primary call");

const publisher = read(".github/workflows/publish-social.yml");
const adminSocial = read("src/app/api/admin/social/route.ts");
if (existsSync("src/app/api/internal/video-processing/route.ts")) failures.push("retired /api/internal/video-processing endpoint must remain deleted");
if (existsSync("src/app/api/internal/video-generation/daily/route.ts")) failures.push("retired /api/internal/video-generation/daily endpoint must remain deleted");
if (existsSync("src/app/api/internal/youtube-sync/route.ts")) failures.push("retired /api/internal/youtube-sync endpoint must remain deleted");
if (adminSocial.includes("/api/internal/video-processing")) failures.push("admin social must not call the retired video-processing compatibility endpoint");
if (!adminSocial.includes('dispatchGitHubWorkflow("publish-social.yml")')) failures.push("admin social retry must dispatch the canonical publish-social workflow");
if (!publisher.includes('cron: "*/15 * * * *"')) failures.push("GitHub social publisher must own the recurring publishing schedule");
if (!publisher.includes('BACKGROUND_JOB_TARGET: "social"')) failures.push("GitHub social publisher must execute only the social target");

const circleci = read(".circleci/config.yml");
if (circleci.includes('cron: "17 3,9,15,21 * * *"')) failures.push("CircleCI must not own video generation scheduling");
if (circleci.includes("background-jobs:")) failures.push("CircleCI must not contain the production video/social worker job");
if (circleci.includes("android-release-on-build-tag:")) failures.push("CircleCI must not retain the redundant Android build-tag workflow");
const androidReleaseManager = read("src/features/releases/services/github-release-manager.ts");
if (!androidReleaseManager.includes("/git/tags")) failures.push("Admin Android release manager must create the Git tag object");
if (!androidReleaseManager.includes("/git/refs")) failures.push("Admin Android release manager must publish the Git tag ref");
if (!androidReleaseManager.includes("/releases")) failures.push("Admin Android release manager must create the draft GitHub release");
if (!androidReleaseManager.includes("draft: true")) failures.push("Admin Android release manager must create a draft release until artifacts pass");
if (androidReleaseManager.includes("buildTag")) failures.push("Android release manager must not create a redundant -build tag");
const androidPublish = read(".github/workflows/publish-android-release-assets.yml");
if (androidPublish.includes("branches:\n      - main")) failures.push("Android release publishing must not trigger directly from main");
if (!androidPublish.includes("workflow_dispatch:")) failures.push("Android release publishing must retain explicit manual recovery");
if (!androidPublish.includes("inputs.retry")) failures.push("Android manual recovery must require an explicit retry input");
if (!androidPublish.includes("docs/finalization/RELEASE_RETRY.flag")) failures.push("Android asset retries must remain tied to an explicit release flag");
if (!androidPublish.includes("github.ref_type == 'tag'")) failures.push("tagged Android release publishing must remain enabled");

const runner = read("scripts/run-background-jobs.ts");
if (!runner.includes("processTemplateVideoQueue")) failures.push("background runner must invoke the canonical video queue");
if (!runner.includes("reconcileCompletedVideoSocialQueue")) failures.push("background runner must reconcile completed video social rows");
if (!runner.includes("ensureArabicTtsRuntime")) failures.push("background runner must initialize Arabic TTS");
if (!runner.includes("runNowRequest")) failures.push("background runner must consume the admin run-now request");
if (!runner.includes("clearRunNowRequest")) failures.push("background runner must clear fulfilled run-now requests");

const queue = read("scripts/jobs/template-video-automation.ts");
if (!queue.includes("engineConfig().staleAfterMinutes")) failures.push("video queue must enforce stale-processing recovery");
if (!queue.includes("status=eq.processing")) failures.push("video queue stale recovery query is missing");
if (!queue.includes('status: "pending"')) failures.push("stale processing requests must return to pending");
if (!queue.includes("status=in.(pending,retry_wait)")) failures.push("queue must claim pending and due retry_wait requests");
if (!queue.includes('terminalStatus = attempts >= engineConfig().maxRetries ? "failed" : "retry_wait"')) failures.push("retry policy must remain bounded");

const env = read(".env.example");
if (!env.includes("VIDEO_MAX_RETRIES=3")) failures.push("video retry default is not documented");
if (!env.includes("VIDEO_STALE_AFTER_MINUTES=30")) failures.push("video stale timeout default is not documented");

const scheduling = read("docs/production-scheduling.md");
if (!scheduling.includes("GitHub Actions is the authoritative automatic video generation worker")) failures.push("production scheduler ownership documentation is stale");
if (!scheduling.includes("GitHub Actions is the authoritative automatic social publisher")) failures.push("social publisher ownership documentation is stale");
if (scheduling.includes("GitHub Actions is the authoritative automatic video/social worker")) failures.push("stale GitHub-owned scheduler documentation remains");
if (scheduling.includes("GitHub Actions are not the active scheduler in the current repository.")) failures.push("stale contradictory scheduler documentation remains");

const mig1 = read("supabase/migrations/20261008050000_repoint_production_cron_to_current_project.sql");
const migCurrent = read("supabase/migrations/20261012200000_repoint_cron_to_zikrofficial_project.sql");
if (!migCurrent.includes("bbdpitxvfxgephaaqtqj.supabase.co/functions/v1/prayer-notification-worker")) failures.push("cron migration must pin prayer worker to current Supabase project");
if (!migCurrent.includes("bbdpitxvfxgephaaqtqj.supabase.co/functions/v1/source-verified-content-agent")) failures.push("cron migration must pin source agent to current Supabase project");
if (!mig1.includes("job_id => 4") || !mig1.includes("active => false")) failures.push("cron migration must retire the obsolete cleanup job");

const mig2 = read("supabase/migrations/20261002114000_retire_dead_media_cleanup_cron_20261002.sql");
if (!mig2.includes("cron.unschedule(4)")) failures.push("dead media cleanup cron retirement migration is missing");

const socialSyncMigration = read("supabase/migrations/20261008074605_reconcile_social_sync_cron_and_child_rls.sql");
if (!socialSyncMigration.includes("active := false")) failures.push("legacy social sync cron must remain disabled");
if (existsSync("supabase/functions/sync-youtube-facebook/index.ts")) failures.push("retired sync-youtube-facebook Edge Function source must not remain in the runtime tree");
for (const table of ["companion_stories", "battle_events", "conquest_events"]) {
  if (!socialSyncMigration.includes(`DROP POLICY IF EXISTS allow_public_read ON public.${table}`)) {
    failures.push(`unscoped public read policy must be removed from ${table}`);
  }
}

const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts["scheduler:check"]) failures.push("scheduler:check must be registered");
if (!pkg.scripts["verify:pr"]?.includes("pnpm scheduler:check")) failures.push("verify:pr must include scheduler verification");
if (!pkg.scripts["verify"]?.includes("pnpm scheduler:check")) failures.push("verify must include scheduler verification");

if (failures.length) {
  console.error("SCHEDULER_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 13 Scheduler checks passed");
