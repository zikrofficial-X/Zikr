import {
  processTemplateVideoQueue,
  reconcileCompletedVideoSocialQueue,
  seedAutomatedVideoRequests,
} from "./jobs/template-video-automation";
import { processSocialPublishQueue } from "./jobs/social-publishing";

const SOCIAL_PUBLISH_ENABLED = process.env.SOCIAL_PUBLISH_ENABLED !== "false";

function validateRequiredEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
  }
}

async function processVideos() {
  const seeded = await seedAutomatedVideoRequests();
  console.log(`[background-jobs] Seeded ${seeded} free Quran video request(s).`);
  return processTemplateVideoQueue();
}

async function processSocial() {
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

async function main() {
  validateRequiredEnv();
  const target = process.env.BACKGROUND_JOB_TARGET ?? "all";
  if (!["all", "videos", "social"].includes(target)) {
    throw new Error(`Invalid BACKGROUND_JOB_TARGET: ${target}`);
  }

  console.log(
    `[background-jobs] Starting autonomous background job runner (target=${target}, generator=template, social=${SOCIAL_PUBLISH_ENABLED ? "enabled" : "disabled"}).`
  );
  const startedAt = Date.now();

  const videos = target === "all" || target === "videos"
    ? await processVideos()
    : { processed: 0, succeeded: 0, authBlocked: 0, failed: 0 };

  const reconciledSocialQueue = target === "all" || target === "social"
    ? await reconcileCompletedVideoSocialQueue(100)
    : 0;
  console.log(
    `[background-jobs] Reconciled ${reconciledSocialQueue} completed video(s) with the current social publishing targets.`
  );

  const social = target === "all" || target === "social"
    ? await processSocial()
    : { processed: 0, succeeded: 0, authBlocked: 0, failed: 0 };
  const failed = videos.failed + social.failed;

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