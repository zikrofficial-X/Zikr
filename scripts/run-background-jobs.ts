import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  processTemplateVideoQueue,
  reconcileCompletedVideoSocialQueue,
  seedAutomatedVideoRequests,
} from "./jobs/template-video-automation";
import { processSocialPublishQueue } from "./jobs/social-publishing";
import { getVideoEngineConfig } from "../src/features/videos/providers/types";
import { supabaseServerAdminRequest } from "../src/lib/supabase/admin-rest";
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
  facebookEnabled: boolean;
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
    "/rest/v1/admin_settings?key=in.(video_automation_enabled,video_automation_batch_size,video_automation_ai_enabled,video_automation_auto_publish,video_automation_facebook_enabled,video_automation_daily_target,video_automation_ai_attempts_per_run,video_automation_video_seconds,video_automation_run_now)&select=key,value",
  ).catch(() => []);

  const values = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
  return {
    enabled: parseBoolSetting(values.video_automation_enabled, true),
    batchSize: parseBoundedNumberSetting(
      values.video_automation_batch_size,
      Math.max(1, Number(process.env.AUTO_VIDEO_BATCH_SIZE ?? 3) || 3),
      1,
      10,
    ),
    aiEnabled: parseBoolSetting(values.video_automation_ai_enabled, true),
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
    autoPublish: parseBoolSetting(
      values.video_automation_auto_publish,
      process.env.AUTO_VIDEO_PUBLISH_ENABLED !== "false",
    ),
    facebookEnabled: parseBoolSetting(
      values.video_automation_facebook_enabled,
      process.env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === "true",
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
  process.env.DAILY_VIDEO_TARGET = String(settings.dailyTarget);
  process.env.VIDEO_AI_ATTEMPTS_PER_RUN = String(settings.aiAttemptsPerRun);
  process.env.AUTO_VIDEO_SECONDS = String(settings.videoSeconds);
  process.env.AUTO_VIDEO_PUBLISH_ENABLED = String(settings.autoPublish);
  process.env.AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL = String(!settings.autoPublish);
  process.env.SOCIAL_PUBLISH_FACEBOOK_ENABLED = String(settings.facebookEnabled);
}


const SOCIAL_PUBLISH_ENABLED = process.env.SOCIAL_PUBLISH_ENABLED !== "false";
const VIDEO_DRY_RUN = (process.env.VIDEO_AUTOMATION_DRY_RUN ?? "true").toLowerCase() === "true";

const EDGE_TTS_VERSION = "7.2.8";
const TTS_VENV_DIR = process.env.ARABIC_TTS_VENV?.trim() || join(process.cwd(), ".tts-venv");

function hasEdgeTts(python: string) {
  try {
    execFileSync(python, ["-c", "import edge_tts"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ensureArabicTtsRuntime() {
  const configuredPython = process.env.ARABIC_TTS_PYTHON?.trim();
  if (configuredPython && hasEdgeTts(configuredPython)) {
    return;
  }

  const venvPython = join(TTS_VENV_DIR, "bin", "python3");
  if (!hasEdgeTts(venvPython)) {
    console.log(`[background-jobs] Arabic TTS runtime missing; bootstrapping edge-tts==${EDGE_TTS_VERSION} in ${TTS_VENV_DIR}.`);
    execFileSync("python3", ["-m", "venv", TTS_VENV_DIR], { stdio: "inherit" });
    execFileSync(
      venvPython,
      ["-m", "pip", "install", "--disable-pip-version-check", "--no-cache-dir", `edge-tts==${EDGE_TTS_VERSION}`],
      { stdio: "inherit" },
    );
  }

  if (!hasEdgeTts(venvPython)) {
    throw new Error(`Arabic TTS runtime could not be initialized at ${venvPython}.`);
  }

  process.env.ARABIC_TTS_PYTHON = venvPython;
  console.log(`[background-jobs] Arabic TTS ready: ${venvPython} (edge-tts ${EDGE_TTS_VERSION}).`);
}

function validateRequiredEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
  }
}

async function processVideos(settings: VideoAutomationSettings) {
  if (!settings.enabled) {
    console.log("[background-jobs] Video automation disabled from Admin settings.");
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0, seeded: 0 };
  }
  if (VIDEO_DRY_RUN) {
    console.log("[background-jobs] VIDEO_AUTOMATION_DRY_RUN=true; planning only.");
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0, seeded: 0 };
  }

  applyVideoAutomationSettings(settings);
  ensureArabicTtsRuntime();

  const configuredConcurrency = Number(process.env.VIDEO_WORKER_CONCURRENCY ?? 2);
  const concurrency = Math.max(1, Math.min(3, Number.isFinite(configuredConcurrency) ? Math.floor(configuredConcurrency) : 2));
  console.log(`[background-jobs] Video worker concurrency: ${concurrency}`);
  // Keep this in sync with the UTC day index used by seedAutomatedVideoRequests.
  const priorityDay = Math.floor(Date.now() / 86_400_000);

  const drainQueue = async (capacity: number) => {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let remaining = Math.max(0, capacity);

    while (remaining > 0) {
      const waveSize = Math.min(concurrency, remaining);
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
  const seeded = await seedAutomatedVideoRequests(settings.batchSize);
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
  if (!settings.autoPublish) {
    console.log("[background-jobs] Automatic social publishing is paused from Admin settings.");
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0 };
  }
  if (!SOCIAL_PUBLISH_ENABLED) {
    console.log("[background-jobs] Social publishing disabled.");
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0 };
  }

  console.log("[background-jobs] Claiming up to 10 queued social publish item(s).");
  const result = await processSocialPublishQueue(10);
  if (result.processed === 0) {
    console.log("[background-jobs] No queued social publish items claimed.");
  }
  return result;
}


async function recordAutomationRun(summary: {
  target: string;
  seeded: number;
  processed: number;
  completed: number;
  failed: number;
  socialProcessed: number;
  socialSucceeded: number;
  urgentRunRequestedAt: string | null;
}) {
  try {
    const config = getVideoEngineConfig();
    await supabaseServerAdminRequest("/rest/v1/video_automation_runs", {
      method: "POST",
      headers: { Prefer: "return=minimal", "Content-Type": "application/json" },
      body: JSON.stringify({
        run_type: "github_actions_video_worker",
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
  const target = process.env.BACKGROUND_JOB_TARGET ?? "all";
  const videoSettings = await getVideoAutomationSettings();
  const runNowRequestedAt = videoSettings.runNowRequest?.requestedAt ?? null;
  applyVideoAutomationSettings(videoSettings);
  console.log("[background-jobs] Admin video settings:", JSON.stringify(videoSettings));
  if (!["all", "videos", "social"].includes(target)) {
    throw new Error(`Invalid BACKGROUND_JOB_TARGET: ${target}`);
  }

  console.log(
    `[background-jobs] Starting autonomous background job runner (target=${target}, generator=multi-provider-free-ai, social=${SOCIAL_PUBLISH_ENABLED ? "enabled" : "disabled"}).`
  );
  const startedAt = Date.now();

  const videos = target === "all" || target === "videos"
    ? await processVideos(videoSettings)
    : { processed: 0, succeeded: 0, authBlocked: 0, failed: 0, seeded: 0 };

  const reconciledSocialQueue = target === "all" || target === "social"
    ? await reconcileCompletedVideoSocialQueue(100)
    : 0;
  console.log(
    `[background-jobs] Reconciled ${reconciledSocialQueue} completed video(s) with the current social publishing targets.`
  );

  if (runNowRequestedAt && (target === "all" || target === "videos") && videos.failed === 0) {
    await clearRunNowRequest(runNowRequestedAt);
    console.log(`[background-jobs] Cleared completed urgent video run request ${runNowRequestedAt}.`);
  }

  const social = target === "all" || target === "social"
    ? await processSocial(videoSettings)
    : { processed: 0, succeeded: 0, authBlocked: 0, failed: 0 };
  const failed = videos.failed + social.failed;

  await recordAutomationRun({
    target,
    seeded: videos.seeded || 0,
    processed: videos.processed,
    completed: videos.succeeded,
    failed,
    socialProcessed: social.processed,
    socialSucceeded: social.succeeded,
    urgentRunRequestedAt: runNowRequestedAt,
  });

  console.log(
    "[background-jobs] Summary:",
    JSON.stringify({ target, videos, reconciledSocialQueue, social, durationMs: Date.now() - startedAt }, null, 2)
  );

  if (failed > 0) {
    throw new Error(`Background jobs completed with ${failed} failed item(s).`);
  }
}

main().catch(error => {
  console.error("[background-jobs] Run failed:", error);
  process.exit(1);
});
