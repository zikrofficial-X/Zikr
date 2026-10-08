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
if (workflow.includes("\n  schedule:")) failures.push("GitHub video worker must not own an automatic schedule");
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

const urgentDispatcher = read(".github/workflows/urgent-video-dispatcher.yml");
if (urgentDispatcher.includes("\n  schedule:")) failures.push("urgent video recovery workflow must not poll on a schedule");
if (!urgentDispatcher.includes("if: github.ref == 'refs/heads/main'")) failures.push("urgent dispatcher must restrict production secrets to main");
if (!urgentDispatcher.includes("environment: production")) failures.push("urgent dispatcher must use the existing production-secret environment");
if (!urgentDispatcher.includes("actions: write")) failures.push("urgent dispatcher must be allowed to dispatch GitHub workflows");
if (!urgentDispatcher.includes("video_automation_run_now")) failures.push("urgent dispatcher must consume the admin run-now flag");
if (!urgentDispatcher.includes("generate-ai-video.yml/dispatches")) failures.push("urgent dispatcher must dispatch the canonical video worker");

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

const circleci = read(".circleci/config.yml");
if (circleci.includes("main-source-verification:")) failures.push("CircleCI must not duplicate GitHub source verification on main");
if (!circleci.includes('cron: "17 3,9,15,21 * * *"')) failures.push("CircleCI must own the four-times-daily video schedule");
if (!circleci.includes('cron: "17 4 * * *"')) failures.push("CircleCI must own the daily English content schedule");
if (existsSync(".github/workflows/global-localization-verify.yml")) failures.push("standalone localization verification duplicates the canonical PR gate");
const releaseWorkflow = read(".github/workflows/release-finalization.yml");
if (!releaseWorkflow.includes("github.ref == 'refs/heads/main'")) failures.push("production release secrets must be restricted to main");
const androidPublish = read(".github/workflows/publish-android-release-assets.yml");
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
if (!scheduling.includes("CircleCI is the authoritative automatic video/social worker")) failures.push("production scheduler ownership documentation is stale");
if (scheduling.includes("GitHub Actions is the authoritative automatic video/social worker")) failures.push("stale GitHub-owned scheduler documentation remains");
if (scheduling.includes("GitHub Actions are not the active scheduler in the current repository.")) failures.push("stale contradictory scheduler documentation remains");

const mig1 = read("supabase/migrations/20261008050000_repoint_production_cron_to_current_project.sql");
if (!mig1.includes("wvetcauyerlkqvmntajq.supabase.co/functions/v1/prayer-notification-worker")) failures.push("cron migration must pin prayer worker to current Supabase project");
if (!mig1.includes("wvetcauyerlkqvmntajq.supabase.co/functions/v1/source-verified-content-agent")) failures.push("cron migration must pin source agent to current Supabase project");
if (!mig1.includes("job_id => 4") || !mig1.includes("active => false")) failures.push("cron migration must retire the obsolete cleanup job");

const mig2 = read("supabase/migrations/20261002114000_retire_dead_media_cleanup_cron_20261002.sql");
if (!mig2.includes("cron.unschedule(4)")) failures.push("dead media cleanup cron retirement migration is missing");

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
