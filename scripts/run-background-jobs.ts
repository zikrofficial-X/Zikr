import {
  claimPendingVideoRequests,
  getSubmittedVideoRequests,
  processVideoGenerationRequest,
} from "../lib/services/video-automation";
import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
} from "../lib/services/social-publishing";
import {
  processTemplateVideoQueue,
  seedAutomatedVideoRequests,
} from "./jobs/template-video-automation";

const VIDEO_BATCH_SIZE = Number(process.env.VIDEO_BACKGROUND_BATCH_SIZE ?? 3);
const SOCIAL_BATCH_SIZE = Number(process.env.SOCIAL_BACKGROUND_BATCH_SIZE ?? 10);

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

function validateRequiredEnv() {
  const missing = REQUIRED_ENV.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required GitHub Secret(s): ${missing.join(", ")}`);
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL ||= process.env.SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= process.env.SUPABASE_ANON_KEY;
}

async function processVideos() {
  const generator = (process.env.VIDEO_GENERATOR ?? "template").toLowerCase();
  if (generator === "template") {
    const queued = await seedAutomatedVideoRequests();
    console.log(`[background-jobs] Seeded ${queued} deterministic Quran video request(s).`);
    return processTemplateVideoQueue(VIDEO_BATCH_SIZE);
  }
  if (generator !== "heygen") {
    throw new Error(`Invalid VIDEO_GENERATOR: ${generator}. Use template or heygen.`);
  }
  console.log(`[background-jobs] Loading up to ${VIDEO_BATCH_SIZE} submitted HeyGen job(s).`);
  const submitted = await getSubmittedVideoRequests(VIDEO_BATCH_SIZE);
  console.log(`[background-jobs] Claiming up to ${VIDEO_BATCH_SIZE} pending video request(s).`);
  const claimed = await claimPendingVideoRequests(VIDEO_BATCH_SIZE);
  const requests = [...submitted, ...claimed];

  if (requests.length === 0) {
    console.log("[background-jobs] No pending or submitted video requests found.");
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  for (const request of requests) {
    console.log(`[background-jobs] Processing video request ${request.id}.`);
    try {
      const ok = await processVideoGenerationRequest(request, { alreadyClaimed: true });
      if (ok) succeeded += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
      console.error(`[background-jobs] Video request ${request.id} failed unexpectedly:`, error);
    }
  }

  return { processed: requests.length, succeeded, failed };
}

async function processSocial() {
  console.log(`[background-jobs] Claiming up to ${SOCIAL_BATCH_SIZE} queued social publish item(s).`);
  const items = await claimPendingSocialPublishItems(SOCIAL_BATCH_SIZE);
  if (items.length === 0) {
    console.log("[background-jobs] No queued social publish items claimed.");
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  for (const item of items) {
    console.log(`[background-jobs] Processing social publish item ${item.id}.`);
    try {
      const ok = await processSocialPublishItem(item, { alreadyClaimed: true });
      if (ok) succeeded += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
      console.error(`[background-jobs] Social publish item ${item.id} failed unexpectedly:`, error);
    }
  }

  return { processed: items.length, succeeded, failed };
}

async function main() {
  validateRequiredEnv();
  const target = process.env.BACKGROUND_JOB_TARGET ?? "all";
  if (!["all", "videos", "social"].includes(target)) {
    throw new Error(`Invalid BACKGROUND_JOB_TARGET: ${target}`);
  }

  console.log(`[background-jobs] Starting autonomous background job runner (target=${target}, generator=${(process.env.VIDEO_GENERATOR ?? "template").toLowerCase()}).`);
  const startedAt = Date.now();

  const videos = target === "all" || target === "videos"
    ? await processVideos()
    : { processed: 0, succeeded: 0, failed: 0 };
  const social = target === "all" || target === "social"
    ? await processSocial()
    : { processed: 0, succeeded: 0, failed: 0 };
  const failed = videos.failed + social.failed;

  console.log("[background-jobs] Summary:", JSON.stringify({ target, videos, social, durationMs: Date.now() - startedAt }, null, 2));

  if (failed > 0) {
    throw new Error(`Background jobs completed with ${failed} failed item(s).`);
  }
}

main().catch(error => {
  console.error("[background-jobs] Run failed:", error);
  process.exit(1);
});
