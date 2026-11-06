import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const route = read("src/app/api/admin/video-purge/route.ts");
const socialWorker = read("scripts/jobs/social-publishing.ts");
const videoWorker = read("scripts/jobs/template-video-automation.ts");
const videoQueuePage = read("src/features/admin/video-requests/components/admin-video-requests-client.tsx");
const socialPage = read("src/app/admin/social/social-client.tsx");
const generationStudio = read("src/app/admin/video/studio/page.tsx");
const control = read("src/features/admin/components/purge-generated-videos-control.tsx");
const apiGuards = read("scripts/verify-admin-api-guards.mjs");

for (const token of [
  'requireAdminApi("video.delete")',
  'CONFIRMATION_PHRASE = "امسح كل الفيديوهات"',
  "resource_type:video AND tags=automated",
  'asset.public_id.startsWith("auto-")',
  'tags.has("zikr-generated")',
  'tags.has("automated")',
  'tags.has("cloudinary-migration")',
  'asset.format === "mp4"',
  "VIDEO_CONTENT_TYPES",
  "video_generation_requests",
  "video_automation_runs",
  "siteVideoRowsDeleted",
  'action: "video.library.purge"',
  "externalSocialPostsDeleted: false",
]) {
  assert.ok(route.includes(token), "Missing purge route safety contract: " + token);
}
assert.ok(!/drop\s+table|supabase_migrations|android-releases/i.test(route), "Purge must not alter schema, migration history, or Android releases.");
assert.ok(socialWorker.includes("isVideoPurgeInProgress"));
assert.ok(socialWorker.includes("video_purge_in_progress"));
assert.ok(videoWorker.includes("isVideoGenerationPaused"));
assert.ok(videoWorker.includes("video_automation_enabled,video_purge_in_progress"));
assert.ok(videoQueuePage.includes("PurgeGeneratedVideosControl"));
assert.ok(generationStudio.includes("PurgeGeneratedVideosControl"));
assert.ok(socialPage.includes("PurgeGeneratedVideosControl"));
assert.ok(control.includes("امسح كل الفيديوهات"));
assert.ok(control.includes("YouTube وFacebook"));
assert.ok(apiGuards.includes('src/app/api/admin/video-purge/route.ts POST'));

console.log("Generated-video purge contracts passed.");
