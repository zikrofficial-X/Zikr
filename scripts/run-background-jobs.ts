import {
  processTemplateVideoQueue,
  reconcileCompletedVideoSocialQueue,
  seedAutomatedVideoRequests,
} from "./jobs/template-video-automation";
import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
} from "../src/features/social/services/social-publishing";

const VIDEO_BATCH_SIZE = Number(process.env.VIDEO_BACKGROUND_BATCH_SIZE ?? 3);
const SOCIAL_BATCH_SIZE = Number(process.env.SOCIAL_BACKGROUND_BATCH_SIZE ?? 10);
const SOCIAL_PUBLISH_ENABLED =
  (process.env.SOCIAL_PUBLISH_ENABLED ?? "false").toLowerCase() === "true";

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

function validateRequiredEnv() {
  const missing = REQUIRED_ENV.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required background-worker environment variable(s): ${missing.join(", ")}`);
  }

  if (SOCIAL_PUBLISH_ENABLED) {
    const youtubeReady = Boolean(
      process.env.YOUTUBE_CLIENT_ID?.trim() &&
        process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
        process.env.YOUTUBE_REFRESH_TOKEN?.trim(),
    );
    const facebookReady = Boolean(
      process.env.FACEBOOK_PAGE_ID?.trim() &&
        process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim(),
    );
    if (!youtubeReady && !facebookReady) {
      throw new Error(
        "SOCIAL_PUBLISH_ENABLED=true requires either the complete YouTube OAuth set (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN) or the Facebook page set (FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN).",
      );
    }
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL ||= process.env.SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= process.env.SUPABASE_ANON_KEY;
}

async function processVideos() {
  // Production video generation is intentionally locked to the free,
  // deterministic FFmpeg renderer. A legacy VIDEO_GENERATOR value can no
  // longer route production work to HeyGen or any paid provider.
  const configuredGenerator = (process.env.VIDEO_GENERATOR ?? "template").toLowerCase();
  if (configuredGenerator !== "template") {
    console.warn(
      `[background-jobs] Ignoring unsupported VIDEO_GENERATOR=${configuredGenerator}; production is locked to template.`
    );
  }

  const queued = await seedAutomatedVideoRequests();
  console.log(`[background-jobs] Seeded ${queued} free Quran video request(s).`);
  return processTemplateVideoQueue(VIDEO_BATCH_SIZE);
}

async function processSocial() {
  if (!SOCIAL_PUBLISH_ENABLED) {
    console.log(
      "[background-jobs] Social publishing is disabled; leaving queued social items untouched."
    );
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0 };
  }

  console.log(`[background-jobs] Claiming up to ${SOCIAL_BATCH_SIZE} queued social publish item(s).`);
  const items = await claimPendingSocialPublishItems(SOCIAL_BATCH_SIZE);
  if (items.length === 0) {
    console.log("[background-jobs] No queued social publish items claimed.");
    return { processed: 0, succeeded: 0, authBlocked: 0, failed: 0 };
  }

  let succeeded = 0;
  let authBlocked = 0;
  let failed = 0;
  for (const item of items) {
    console.log(`[background-jobs] Processing social publish item ${item.id}.`);
    try {
      const result = await processSocialPublishItem(item, { alreadyClaimed: true });
      if (result === "published") succeeded += 1;
      else if (result === "auth_blocked") authBlocked += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
      console.error(`[background-jobs] Social publish item ${item.id} failed unexpectedly:`, error);
    }
  }

  return { processed: items.length, succeeded, authBlocked, failed };
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
  const social = target === "all" || target === "social"
    ? await processSocial()
    : { processed: 0, succeeded: 0, failed: 0 };
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
