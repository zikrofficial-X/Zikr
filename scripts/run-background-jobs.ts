import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { processTemplateVideoQueue, seedAutomatedVideoRequests } from "./jobs/template-video-automation";
import { processScheduledContent } from "./jobs/content-publishing";
import { processSocialPublishQueue, syncSocialInsights } from "./jobs/social-publishing";
import { getVideoEngineConfig } from "../src/features/videos/providers/types";
import { evaluateBackgroundJobOutcome, shouldClearRunNowRequest } from "../src/features/videos/services/background-job-outcome";
import { supabaseServerAdminRequest } from "../src/lib/supabase/admin-rest";
import { notifyNewQueueFailures } from "./jobs/admin-queue-alerts";
type VideoAutomationRunNow = {
  requestedAt: string;
  requestedBy?: string | null;
  dispatchedAt?: string | null;
};

type VideoAutomationSettings = {
  enabled: boolean;
  batchSize: number;
  aiEnabled: boolean;
  autoPublish: boolean;
  dailyTarget: number;
  aiAttemptsPerRun: number;
  videoSeconds: number;
  runNowRequest: VideoAutomationRunNow | null;
};

function parseBoolSetting(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function parseBoundedNumberSetting(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, Math.floor(numeric))) : fallback;
}

function parseRunNowRequest(value: unknown): VideoAutomationRunNow | null {
  if (typeof value === "string" && value.trim()) {
    return { requestedAt: value.trim() };
  }
  if (!value || typeof value !== "object") return null;
  const requestedAt = (value as { requestedAt?: unknown }).requestedAt;
  if (typeof requestedAt !== "string" || !requestedAt.trim()) return null;
  const requestedBy = (value as { requestedBy?: unknown }).requestedBy;
  const dispatchedAt = (value as { dispatchedAt?: unknown }).dispatchedAt;
  return {
    requestedAt: requestedAt.trim(),
    requestedBy: typeof requestedBy === "string" ? requestedBy : null,
    dispatchedAt: typeof dispatchedAt === "string" ? dispatchedAt : null,
  };
}

async function getVideoAutomationSettings(): Promise<VideoAutomationSettings> {
  const rows = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
    "/rest/v1/admin_settings?key=in.(video_automation_enabled,video_automation_batch_size,video_automation_ai_enabled,video_automation_auto_publish,video_automation_daily_target,video_automation_ai_attempts_per_run,video_automation_video_seconds,video_automation_run_now,video_custom_spaces)&select=key,value",
  ).catch(() => []);

  const values = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
  if (Array.isArray(values.video_custom_spaces)) {
    process.env.HF_VIDEO_CUSTOM_SPACES = JSON.stringify(values.video_custom_spaces);
  } else if (typeof values.video_custom_spaces === "string" && values.video_custom_spaces.trim()) {
    process.env.HF_VIDEO_CUSTOM_SPACES = values.video_custom_spaces;
  }
  return {
    enabled: parseBoolSetting(values.video_automation_enabled, true),
    batchSize: parseBoundedNumberSetting(
      values.video_automation_batch_size,
      Math.max(1, Number(process.env.AUTO_VIDEO_BATCH_SIZE ?? 3) || 3),
      1,
      10,
    ),
    aiEnabled: parseBoolSetting(values.video_automation_ai_enabled, true),
    autoPublish: parseBoolSetting(values.video_automation_auto_publish, false),
    dailyTarget: parseBoundedNumberSetting(
      values.video_automation_daily_target,
      Math.max(1, Number(process.env.DAILY_VIDEO_TARGET ?? 12) || 12),
      1,
      24,
    ),
    aiAttemptsPerRun: parseBoundedNumberSetting(
      values.video_automation_ai_attempts_per_run,
      Math.max(1, Number(process.env.VIDEO_AI_ATTEMPTS_PER_RUN ?? 3) || 3),
      0,
      4,
    ),
    videoSeconds: parseBoundedNumberSetting(
      values.video_automation_video_seconds,
      Math.max(10, Number(process.env.AUTO_VIDEO_SECONDS ?? 18) || 18),
      10,
      45,
    ),
    runNowRequest: parseRunNowRequest(values.video_automation_run_now),
  };
}

async function clearRunNowRequest(requestedAt: string) {
  const current = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
    "/rest/v1/admin_settings?key=eq.video_automation_run_now&select=key,value&limit=1",
  ).catch(() => []);

  const parsed = parseRunNowRequest(current?.[0]?.value);
  if (!parsed || parsed.requestedAt !== requestedAt) return;

  await supabaseServerAdminRequest(
    "/rest/v1/admin_settings?key=eq.video_automation_run_now",
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    },
  );
}

function applyVideoAutomationSettings(settings: VideoAutomationSettings) {
  process.env.VIDEO_AI_ENABLED = String(settings.aiEnabled);
  process.env.AUTO_VIDEO_PUBLISH_ENABLED = String(settings.autoPublish);
  process.env.DAILY_VIDEO_TARGET = String(settings.dailyTarget);
  process.env.VIDEO_AI_ATTEMPTS_PER_RUN = String(settings.aiAttemptsPerRun);
  process.env.AUTO_VIDEO_SECONDS = String(settings.videoSeconds);
}


const VIDEO_DRY_RUN = (process.env.VIDEO_AUTOMATION_DRY_RUN ?? "true").toLowerCase() === "true";

async function isVideoGenerationPaused(): Promise<boolean> {
  try {
    const rows = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
      "/rest/v1/admin_settings?key=in.(video_automation_enabled,video_purge_in_progress)&select=key,value",
    );
    const values = Object.fromEntries((rows ?? []).map(row => [row.key, row.value]));
    return values.video_purge_in_progress === true || values.video_automation_enabled === false;
  } catch (error) {
    console.error("[background-jobs] Could not verify the live video-generation lock; failing closed:", error);
    return true;
  }
}

const EDGE_TTS_VERSION = "7.3.1";
const TTS_VENV_DIR = process.env.ARABIC_TTS_VENV?.trim() || join(process.cwd(), ".tts-venv");

function hasArabicTtsRuntime(python: string) {
  try {
    execFileSync(python, ["-c", "import edge_tts, gtts"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ensureArabicTtsRuntime() {
  const configuredPython = process.env.ARABIC_TTS_PYTHON?.trim();
  if (configuredPython && hasArabicTtsRuntime(configuredPython)) {
    return;
  }

  const venvPython = join(TTS_VENV_DIR, "bin", "python3");
  if (!hasArabicTtsRuntime(venvPython)) {
    console.log(`[background-jobs] Arabic TTS runtime missing; bootstrapping edge-tts==${EDGE_TTS_VERSION} in ${TTS_VENV_DIR}.`);
    execFileSync("python3", ["-m", "venv", TTS_VENV_DIR], { stdio: "inherit" });
    execFileSync(
      venvPython,
      ["-m", "pip", "install", "--disable-pip-version-check", "--no-cache-dir", `edge-tts==${EDGE_TTS_VERSION}`, "gTTS==2.5.4"],
      { stdio: "inherit" },
    );
  }

  if (!hasArabicTtsRuntime(venvPython)) {
    throw new Error(`Arabic TTS runtime (Edge TTS + gTTS fallback) could not be initialized at ${venvPython}.`);
  }

  process.env.ARABIC_TTS_PYTHON = venvPython;
  console.log(`[background-jobs] Arabic TTS ready: ${venvPython} (edge-tts ${EDGE_TTS_VERSION} + gTTS fallback).`);
}

function validateRequiredEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
  }
}

async function processVideos(settings: VideoAutomationSettings) {
  if (!settings.enabled || await isVideoGenerationPaused()) {
    console.log("[background-jobs] Video automation disabled from Admin settings.");
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0, seeded: 0 };
  }
  if (VIDEO_DRY_RUN) {
    console.log("[background-jobs] VIDEO_AUTOMATION_DRY_RUN=true; planning only.");
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0, seeded: 0 };
  }

  applyVideoAutomationSettings(settings);
  ensureArabicTtsRuntime();

  const configuredBatchSize = Number(
    process.env.VIDEO_WORKER_BATCH_SIZE ?? process.env.VIDEO_WORKER_CONCURRENCY ?? 2,
  );
  const processingBatchSize = Math.max(
    1,
    Math.min(10, Number.isFinite(configuredBatchSize) ? Math.floor(configuredBatchSize) : 2),
  );
  console.log(`[background-jobs] Video processing batch size: ${processingBatchSize}`);
  // Keep this in sync with the UTC day index used by seedAutomatedVideoRequests.
  const priorityDay = Math.floor(Date.now() / 86_400_000);

  const drainQueue = async (capacity: number) => {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let remaining = Math.max(0, capacity);

    while (remaining > 0) {
      if (await isVideoGenerationPaused()) {
        console.log("[background-jobs] Video generation lock activated during the run; stopping before the next batch.");
        break;
      }
      const waveSize = Math.min(processingBatchSize, remaining);
      // Process a bounded candidate batch in one worker invocation. Independent
      // concurrent reads selected the same oldest row and wasted capacity.
      const wave = [await processTemplateVideoQueue(waveSize, priorityDay)];

      const waveProcessed = wave.reduce((sum, result) => sum + (result.processed || 0), 0);
      const waveSucceeded = wave.reduce((sum, result) => sum + (result.succeeded || 0), 0);
      const waveFailed = wave.reduce((sum, result) => sum + (result.failed || 0), 0);

      processed += waveProcessed;
      succeeded += waveSucceeded;
      failed += waveFailed;

      if (waveProcessed === 0) break;
      remaining = Math.max(0, capacity - processed);
    }

    return { processed, succeeded, failed };
  };

  // Seed first so an old backlog cannot indefinitely starve today's scheduled requests.
  // Queue claiming remains atomic inside processTemplateVideoQueue().
  const seeded = await isVideoGenerationPaused() ? 0 : await seedAutomatedVideoRequests(settings.batchSize);
  console.log(`[background-jobs] Seeded ${seeded} new video request(s) before queue processing.`);

  const result = await drainQueue(settings.batchSize);
  const processed = result.processed;
  const succeeded = result.succeeded;
  const failed = result.failed;

  return {
    processed,
    succeeded,
    authBlocked: 0,
    failed,
    seeded,
  };
}



async function processSocial(settings: VideoAutomationSettings) {
  if (!settings.autoPublish || process.env.SOCIAL_PUBLISH_ENABLED !== "true") {
    console.log("[background-jobs] Social publishing remains paused by Admin settings or workflow policy.");
    return { processed: 0, succeeded: 0, deferred: 0, authBlocked: 0, approvalBlocked: 0, failed: 0, enabled: false, insights: null };
  }

  // Expensive provider insights are refreshed only by an explicit maintenance run,
  // not every time a video is generated or a queue is drained.
  const insights = process.env.SOCIAL_SYNC_INSIGHTS === "true"
    ? await syncSocialInsights()
    : null;
  const configuredBatchSize = Number(process.env.SOCIAL_PUBLISH_BATCH_SIZE ?? 2);
  const batchSize = Math.max(1, Math.min(5, Number.isFinite(configuredBatchSize) ? Math.floor(configuredBatchSize) : 2));
  const result = await processSocialPublishQueue(batchSize);
  console.log("[background-jobs] Social publish batch:", JSON.stringify({
    processed: result.processed,
    succeeded: result.succeeded,
    deferred: result.deferred,
    authBlocked: result.authBlocked,
    approvalBlocked: result.approvalBlocked,
    failed: result.failed,
    enabledPlatforms: result.enabledPlatforms,
  }));
  return { ...result, enabled: true, insights };
}

async function recordAutomationRun(summary: {
  startedAt: number;
  target: string;
  seeded: number;
  processed: number;
  completed: number;
  failed: number;
  socialProcessed: number;
  socialSucceeded: number;
  siteContentPublished: number;
  urgentRunRequestedAt: string | null;
}) {
  try {
    const config = getVideoEngineConfig();
    await supabaseServerAdminRequest("/rest/v1/video_automation_runs", {
      method: "POST",
      headers: { Prefer: "return=minimal", "Content-Type": "application/json" },
      body: JSON.stringify({
        run_type: "github_actions_video_worker",
        started_at: new Date(summary.startedAt).toISOString(),
        finished_at: new Date().toISOString(),
        created_count: summary.seeded,
        processed_count: summary.processed,
        completed_count: summary.completed,
        failed_count: summary.failed,
        provider_stats: {
          order: config.order,
          aiEnabled: config.aiEnabled,
          aiAttemptsPerRun: process.env.VIDEO_AI_ATTEMPTS_PER_RUN || "2",
        },
        error_summary: summary.failed > 0 ? "One or more background items failed." : null,
        metadata: {
          target: summary.target,
          socialProcessed: summary.socialProcessed,
          socialSucceeded: summary.socialSucceeded,
          siteContentPublished: summary.siteContentPublished,
          generator: "multi-provider-free-ai",
          urgentRunRequestedAt: summary.urgentRunRequestedAt,
        },
      }),
    });
  } catch (error) {
    console.error(
      "[background-jobs] Failed to persist automation audit:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
async function main() {
  validateRequiredEnv();
  const target = process.env.BACKGROUND_JOB_TARGET ?? "videos";
  const videoSettings = await getVideoAutomationSettings();
  const runNowRequestedAt = videoSettings.runNowRequest?.requestedAt ?? null;
  applyVideoAutomationSettings(videoSettings);
  console.log("[background-jobs] Admin video settings:", JSON.stringify(videoSettings));
  if (!["all", "videos", "social"].includes(target)) {
    throw new Error(`Invalid BACKGROUND_JOB_TARGET: ${target}`);
  }

  console.log(`[background-jobs] Starting ZIKR worker (target=${target}, autoPublish=${videoSettings.autoPublish}, socialPolicy=${process.env.SOCIAL_PUBLISH_ENABLED === "true"}).`);
  const startedAt = Date.now();
  const videos = target === "all" || target === "videos"
    ? await processVideos(videoSettings)
    : { processed: 0, succeeded: 0, authBlocked: 0, failed: 0, seeded: 0 };

  if (shouldClearRunNowRequest({
    hasRequest: Boolean(runNowRequestedAt),
    target,
    automationEnabled: videoSettings.enabled,
    videosProcessed: videos.processed,
  })) {
    await clearRunNowRequest(runNowRequestedAt);
    console.log(`[background-jobs] Cleared completed urgent video run request ${runNowRequestedAt}.`);
  }

  const sitePublishing = target === "all" || target === "videos"
    ? await processScheduledContent(20).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[background-jobs] Internal site publishing queue failed:", message);
        return { claimed: 0, published: 0, error: message };
      })
    : { claimed: 0, published: 0 };

  const social = target === "all" || target === "social"
    ? await processSocial(videoSettings)
    : { processed: 0, succeeded: 0, deferred: 0, authBlocked: 0, approvalBlocked: 0, failed: 0, enabled: false, insights: null };

  const failed = videos.failed + social.failed + ("error" in sitePublishing ? 1 : 0);
  const queueAlerts = await notifyNewQueueFailures(new Date(startedAt).toISOString()).catch((error) => {
    console.error("[background-jobs] Queue failure alert delivery unavailable:", error instanceof Error ? error.message : String(error));
    return { alerts: 0, delivered: 0 };
  });

  // Social batches already persist platform status/remote IDs in the social queue
  // and GitHub Actions logs. Do not add a video_automation_runs row per social run.
  if (target !== "social") {
    await recordAutomationRun({
      startedAt,
      target,
      seeded: videos.seeded || 0,
      processed: videos.processed + social.processed,
      completed: videos.succeeded + social.succeeded,
      failed,
      socialProcessed: social.processed,
      socialSucceeded: social.succeeded,
      siteContentPublished: sitePublishing.published,
      urgentRunRequestedAt: runNowRequestedAt,
    });
  }

  console.log("[background-jobs] Summary:", JSON.stringify({
    target,
    videos,
    sitePublishing,
    social,
    queueAlerts,
    durationMs: Date.now() - startedAt,
  }, null, 2));

  const outcome = evaluateBackgroundJobOutcome({
    videoSucceeded: videos.succeeded,
    videoFailed: videos.failed,
    socialFailed: social.failed,
    sitePublishingFailed: "error" in sitePublishing,
  });
  if (outcome.hasPartialVideoFailures) {
    console.warn(
      `[background-jobs] ${videos.failed} video item(s) failed but ${videos.succeeded} passed QA and completed; preserving successful delivery and allowing the dependent social publisher to run.`,
    );
  }
  if (outcome.shouldFailRun) {
    throw new Error(`Background jobs completed with ${outcome.fatalFailureCount} fatal failure(s); per-item video failures remain recorded in the run audit.`);
  }
}

main().catch(error => {
  console.error("[background-jobs] Run failed:", error);
  process.exit(1);
});
