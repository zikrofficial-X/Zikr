import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const route = read("src/app/api/admin/video-purge/route.ts");
const videoMediaContract = read("src/features/videos/services/video-media-contract.ts");
const videosService = read("src/features/videos/services/videos.ts");
const socialWorker = read("scripts/jobs/social-publishing.ts");
const videoWorker = read("scripts/jobs/template-video-automation.ts");
const videoQueuePage = read("src/features/admin/video-requests/components/admin-video-requests-client.tsx");
const generationStudio = read("src/app/admin/video/studio/page.tsx");
const control = read("src/features/admin/components/purge-generated-videos-control.tsx");
const apiGuards = read("scripts/verify-admin-api-guards.mjs");

for (const token of [
  'requireAdminApi("video.delete")',
  'CONFIRMATION_PHRASE = "امسح الفيديوهات المولّدة فقط"',
  "resource_type:video AND tags=automated",
  'asset.public_id.startsWith("auto-")',
  'tags.has("zikr-generated")',
  'tags.has("automated")',
  'tags.has("cloudinary-migration")',
  'asset.format === "mp4"',
  "video_generation_requests",
  "video_automation_runs",
  "publicVideoCatalogPreserved: true",
  "socialQueueRowsPreserved,",
  'action: "video.library.purge"',
  "externalSocialPostsDeleted: false",
]) {
  assert.ok(route.includes(token), "Missing purge route safety contract: " + token);
}
assert.ok(!/drop\s+table|supabase_migrations|android-releases/i.test(route), "Purge must not alter schema, migration history, or Android releases.");
assert.ok(!route.includes('deleteRows("videos", "id=not.is.null")'), "Purge must preserve unrelated/manual video records.");
assert.ok(route.includes('metadata->>generator=eq.zikr_internal_video_factory'), "Purge must select only internally generated video catalog rows.");
assert.ok(route.includes('mediaState: "purged"'), "Purge must mark removed generated media records.");
assert.ok(videoMediaContract.includes('"cloudinary_missing", "unavailable", "purged"'), "purged internal media must never fall through to stale Cloudinary source URLs.");
assert.ok(videoMediaContract.includes("metadata.mediaFallbackAvailable !== true"), "YouTube fallback must require the explicit publisher-confirmed flag.");
assert.ok(videosService.includes("resolveVideoYoutubeId"), "all public video adapters must expose only the validated YouTube fallback ID.");
assert.ok(route.includes("published: keepPublishedFallback"), "Purge must preserve an already-published catalog row only when a verified YouTube fallback exists.");
assert.ok(route.includes("getConfirmedYoutubeFallbackId") && route.includes("shouldKeepPublishedVideoAfterMediaPurge"), "Purge must rely on a verified YouTube publication fallback, not an untrusted row.youtube_id.");
assert.ok(route.includes("catalogFallbackRowsKeptPublished"), "Purge audit metadata must report the fallback rows it kept public.");
assert.ok(route.includes('generatedVideoUrl: null') && route.includes('videoUrl: null'), "Purge must clear dead media URLs.");
assert.ok(route.includes("status=neq.published&video_url=not.is.null&select=video_url&limit=1000"), "file purge must inspect every non-published social queue media reference before deleting assets.");
assert.ok(
  route.includes("pendingSocialGenerationRefs") &&
    route.includes("status=neq.published&or=(content_type.like.*video*,video_url.not.is.null)&select=id&limit=1000") &&
    route.includes("const pendingSocialGenerationRefs = (includeFiles || includeMemory)") &&
    route.includes("(includeFiles || includeMemory) && (pendingSocialGenerationRefs ?? []).length > 0"),
  "file-only and memory cleanup must both stop while any unfinished social video row remains, including rows without video_url",
);
assert.ok(route.includes("isGeneratedCloudinaryVideoUrl") && route.includes("protectedSocialQueueMedia.size > 0"), "file purge must protect generated Cloudinary media referenced by unfinished social posts.");
assert.ok(route.includes("/^v\\d+$/"), "Cloudinary delivery URL parsing must strip version segments before protecting generated media.");
assert.ok(route.includes("deletionStarted: false") && route.includes("retryRequired: true"), "a protected queue reference must stop purge before destructive work.");
assert.ok(
  !/social_publish_queue[^\n]*method:\s*["'](?:POST|PATCH|DELETE)/i.test(route),
  "purge must never mutate historical social queue rows.",
);
const queueMediaGuardPosition = route.indexOf("const pendingSocialQueueMedia");
const cloudinaryInventoryPosition = route.indexOf("const assets = includeFiles");
assert.ok(
  queueMediaGuardPosition >= 0 && queueMediaGuardPosition < cloudinaryInventoryPosition,
  "pending social media must be checked before the Cloudinary deletion inventory is processed.",
);
assert.ok(route.includes("const socialQueueRowsPreserved = true"), "historical social queue records must be explicitly preserved.");
assert.ok(route.includes("getActiveVideoWork"), "purge must inspect active internal generation before deleting media.");
assert.ok(route.includes("processing.generation > 0"), "only active internal video generation must block the purge.");
assert.ok(route.includes("getVideoAutomationEnabled") && route.includes("restoreVideoAutomation(automationWasEnabled)"), "cleanup must restore the previous automation state after the temporary lock");
assert.ok(route.includes("purgeLockAttempted") && route.includes("await setPurgeLock(false)"), "purge failures must attempt to release the temporary worker lock");
assert.ok(route.includes("partialPurge: destructiveWorkStarted && !dataCleanupFinished"), "partial destructive failure must be explicitly reported");
assert.ok(route.includes("metadata->>generator=eq.multi-provider-free-ai"), "purge must select only run records created by the internal video worker");
assert.ok(!route.includes('deleteRows("video_automation_runs", "id=not.is.null")'), "purge must not delete unrelated or unclassified automation-run records");
assert.ok(route.includes('body.scope === "files"') && route.includes('body.scope === "memory"') && route.includes('body.scope === "both"'), "the cleanup endpoint must expose distinct files, memory, and combined scopes");
assert.ok(route.includes("includeFiles") && route.includes("includeMemory"), "the cleanup endpoint must honor the selected scope");
assert.ok(route.includes("automation_key=not.is.null"), "project-memory cleanup must only delete automated generation requests");
assert.ok(socialWorker.includes("isVideoPurgeInProgress"));
assert.ok(socialWorker.includes("video_purge_in_progress"));
assert.ok(videoWorker.includes("isVideoGenerationPaused"));
assert.ok(videoWorker.includes("video_automation_enabled,video_purge_in_progress"));
assert.ok(videoQueuePage.includes("PurgeGeneratedVideosControl"));
assert.ok(generationStudio.includes("PurgeGeneratedVideosControl"));
assert.ok(read("src/app/admin/media/media-client.tsx").includes("PurgeGeneratedVideosControl"));
assert.ok(read("src/app/admin/memory/page.tsx").includes("AdminMediaClient"));
assert.ok(control.includes("امسح الفيديوهات المولّدة فقط"));
assert.ok(control.includes('fetch("/api/admin/video-purge"'));
assert.ok(control.includes("setAuthorized(allowed)"));
assert.ok(control.includes('value="files"') && control.includes('value="memory"') && control.includes('value="both"'));
assert.ok(control.includes('JSON.stringify({ confirmation, scope })'));
assert.ok(control.includes("سجلات النشر الاجتماعي التاريخية"));
assert.ok(apiGuards.includes('src/app/api/admin/video-purge/route.ts GET'));
assert.ok(apiGuards.includes('src/app/api/admin/video-purge/route.ts POST'));

console.log("Generated-video purge contracts passed.");
