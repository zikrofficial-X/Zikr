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
type VideoAutomationSettings = {
  enabled: boolean;
  batchSize: number;
  aiEnabled: boolean;
  autoPublish: boolean;
  facebookEnabled: boolean;
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

function parseNumberSetting(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.min(10, Math.floor(numeric))) : fallback;
}

async function getVideoAutomationSettings(): Promise<VideoAutomationSettings> {
  const rows = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
    "/rest/v1/admin_settings?key=in.(video_automation_enabled,video_automation_batch_size,video_automation_ai_enabled,video_automation_auto_publish,video_automation_facebook_enabled)&select=key,value",
  ).catch(() => []);

  const values = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
  return {
    enabled: parseBoolSetting(values.video_automation_enabled, true),
    batchSize: parseNumberSetting(
      values.video_automation_batch_size,
      Math.max(1, Number(process.env.AUTO_VIDEO_BATCH_SIZE ?? 5) || 5),
    ),
    aiEnabled: parseBoolSetting(values.video_automation_ai_enabled, true),
    autoPublish: parseBoolSetting(
      values.video_automation_auto_publish,
      process.env.AUTO_VIDEO_PUBLISH_ENABLED !== "false",
    ),
    facebookEnabled: parseBoolSetting(
      values.video_automation_facebook_enabled,
      process.env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === "true",
    ),
  };
}

function applyVideoAutomationSettings(settings: VideoAutomationSettings) {
  process.env.VIDEO_AI_ENABLED = String(settings.aiEnabled);
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
  const seeded = await seedAutomatedVideoRequests(settings.batchSize);
  console.log(`[background-jobs] Seeded ${seeded} video request(s) across Quran, Hadith, Dua, Adhkar, verified stories, and editorial reminders.`);
  const result = await processTemplateVideoQueue(settings.batchSize);
  return {
    processed: result.processed || 0,
    succeeded: result.succeeded || 0,
    authBlocked: 0,
    failed: result.failed || 0,
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
