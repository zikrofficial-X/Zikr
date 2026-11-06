import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const route = read("src/app/api/admin/video-purge/route.ts");
const socialWorker = read("scripts/jobs/social-publishing.ts");
const videoWorker = read("scripts/jobs/template-video-automation.ts");
const videoQueuePage = read("src/features/admin/video-requests/components/admin-video-requests-client.tsx");
const socialPage = read("src/app/admin/social/social-client.tsx");
const control = read("src/features/admin/components/purge-generated-videos-control.tsx");
const apiGuards = read("scripts/verify-admin-api-guards.mjs");

assert.match(route, /requireAdminApi\("video\.delete"\)/);
assert.match(route, /CONFIRMATION_PHRASE = "امسح كل الفيديوهات"/);
assert.match(route, /resource_type:video AND tags=automated/);
assert.match(route, /asset\.public_id\.startsWith\("auto-"\)/);
assert.match(route, /tags\.has\("zikr-generated"\)/);
assert.match(route, /tags\.has\("automated"\)/);
assert.match(route, /asset\.format === "mp4"/);
assert.match(route, /VIDEO_CONTENT_TYPES/);
assert.match(route, /video_generation_requests/);
assert.match(route, /video_automation_runs/);
assert.match(route, /siteVideoRowsDeleted/);
assert.match(route, /externalSocialPostsDeleted: false/);
assert.match(route, /admin_audit_events/ === false ? /never/ : /video\.library\.purge/); // keep the audit record
assert.doesNotMatch(route, /drop\s+table|supabase_migrations|android-releases/i);
assert.match(socialWorker, /isVideoPurgeInProgress/);
assert.match(socialWorker, /video_purge_in_progress/);
assert.match(videoWorker, /isVideoGenerationPaused/);
assert.match(videoWorker, /video_automation_enabled,video_purge_in_progress/);
assert.match(videoQueuePage, /PurgeGeneratedVideosControl/);
assert.match(socialPage, /PurgeGeneratedVideosControl/);
assert.match(control, /امسح كل الفيديوهات/);
assert.match(control, /YouTube وFacebook/);
assert.match(apiGuards, /src\/app\/api\/admin\/video-purge\/route\.ts POST/);

console.log("Generated-video purge contracts passed.");
