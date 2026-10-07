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
if (!workflow.includes('cron: "0 * * * *"')) failures.push("video worker must remain on the documented hourly cadence");
if (!workflow.includes("concurrency:")) failures.push("video worker must define concurrency protection");
if (!workflow.includes("group: zikr-autonomous-video-worker")) failures.push("video worker concurrency group is missing");
if (!workflow.includes("cancel-in-progress: false")) failures.push("video worker must not cancel an active generation run");
if (!workflow.includes("workflow_dispatch:")) failures.push("video worker must retain manual recovery dispatch");
if (!workflow.includes("urgent:")) failures.push("video worker must support an urgent dispatch input");

const vercel = existsSync("vercel.json") ? readFileSync("vercel.json", "utf8") : "";
if (vercel.includes('"crons"') || vercel.includes("crons:")) failures.push("Vercel must not own production video scheduling");

const urgentDispatcher = read(".github/workflows/urgent-video-dispatcher.yml");
if (!urgentDispatcher.includes('cron: "*/5 * * * *"')) failures.push("urgent dispatcher must poll every 5 minutes");
if (!urgentDispatcher.includes("actions: write")) failures.push("urgent dispatcher must be allowed to dispatch GitHub workflows");
if (!urgentDispatcher.includes("video_automation_run_now")) failures.push("urgent dispatcher must consume the admin run-now flag");
if (!urgentDispatcher.includes("generate-ai-video.yml/dispatches")) failures.push("urgent dispatcher must dispatch the canonical video worker");

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
if (!scheduling.includes("GitHub Actions is the authoritative automatic video/social worker")) failures.push("production scheduler ownership documentation is stale");
if (scheduling.includes("GitHub Actions are not the active scheduler in the current repository.")) failures.push("stale contradictory scheduler documentation remains");

const mig1 = read("supabase/migrations/20261002113000_scheduler_hardening_20261002.sql");
if (!mig1.includes("nmdeazfmtncelykzxkhs.supabase.co/functions/v1/prayer-notification-worker")) failures.push("scheduler hardening migration must pin prayer worker to canonical Supabase");
if (!mig1.includes("nmdeazfmtncelykzxkhs.supabase.co/functions/v1/source-verified-content-agent")) failures.push("scheduler hardening migration must pin source agent to canonical Supabase");

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
