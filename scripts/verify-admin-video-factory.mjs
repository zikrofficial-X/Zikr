#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing Admin Video Factory file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const systemActions = read("src/app/admin/system-actions.ts");
if (/video_automation_ai_enabled"\s*\|\|\s*\)/.test(systemActions)) {
  failures.push("video automation boolean setting guard must not contain a trailing logical OR");
}
const permissions = read("src/features/admin/services/permissions.ts");
const createRoute = read("src/app/api/admin/videos/create/route.ts");
if (!createRoute.includes('requireAdminApi("video.manage")')) failures.push("video create API must require video.manage");
if (!createRoute.includes("SOURCE_LOCKED_CATEGORIES")) failures.push("video create API must enforce source-locked categories");
if (!createRoute.includes("resolveVideoSource")) failures.push("video create API must resolve the canonical source");
if (!createRoute.includes("sourceVerifiedAtRequest: true")) failures.push("video create API must stamp source verification");
if (!createRoute.includes("ownCloudinaryAudioUrl")) failures.push("human narration must be restricted to ZIKR-owned Cloudinary uploads");
if (!createRoute.includes("category === \"quran\"")) failures.push("Quran audio substitution must remain blocked");

const approvalHelper = read("src/features/videos/services/video-publish-approval.ts");
const socialPublishing = read("src/features/social/services/social-publishing.ts");
if (!approvalHelper.includes("approvalReviewerId") || !approvalHelper.includes("approvalSnapshotHash")) {
  failures.push("video approval must be attributed to a reviewer and bound to a snapshot hash");
}
if (!approvalHelper.includes("sourceHash") || !approvalHelper.includes("contentHash") || !approvalHelper.includes("templateVersion")) {
  failures.push("video approval snapshot must bind source, content and template versions");
}
if (!approvalHelper.includes("buildVideoApprovalSnapshotHash")) {
  failures.push("video approval snapshot hashing helper is missing");
}
if (!socialPublishing.includes("source_hash,content_hash,template_version")) {
  failures.push("social publisher must fetch current video source/content/template hashes before sending");
}
if (!socialPublishing.includes("hasVideoApprovalForQueueItem(item)")) {
  failures.push("social publisher must revalidate approval after queue claim and before provider calls");
}

const generation = read("src/app/api/admin/video-generation/route.ts");
if (!generation.includes("requireAdminApi('video.manage')")) failures.push("video generation GET/PATCH must require video.manage");
if (!generation.includes("requireAdminApi('video.delete')")) failures.push("video generation DELETE must require video.delete");
if (!generation.includes("updated_at=eq.") || !generation.includes("current.updated_at")) failures.push("admin publish retry must use optimistic concurrency");

const retryPublishStart = generation.search(/if\s*\(action\s*===\s*["']retry_publish["']\)/);
const retryPublishEnd = generation.indexOf("if (!ALLOWED_STATUSES.has(status))", retryPublishStart);
const retryPublishBlock = retryPublishStart >= 0 && retryPublishEnd > retryPublishStart
  ? generation.slice(retryPublishStart, retryPublishEnd)
  : "";
if (!retryPublishBlock.includes("EXTERNAL_VIDEO_PUBLISHING_RETIRED") || !retryPublishBlock.includes("status: 410")) {
  failures.push("external video publish retry must be retired; internal generation remains available");
}
const videoManagerRole = permissions.match(/video_manager:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
const socialManagerRole = permissions.match(/social_manager:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
if (videoManagerRole.includes("'social.publish'")) {
  failures.push("video_manager must not receive social.publish through the role matrix");
}
if (!socialManagerRole.includes("'social.publish'")) {
  failures.push("social_manager must retain the explicit social.publish permission");
}

const sources = read("src/app/api/admin/video-generation/sources/route.ts");
if (!sources.includes('requireAdminApi("video.manage")')) failures.push("video source API must require video.manage");

const upload = read("src/app/api/admin/video-generation/narration-upload/route.ts");
if (!upload.includes('requireAdminApi("video.manage")')) failures.push("narration upload must require video.manage");
if (!upload.includes("hasValidAudioSignature")) failures.push("narration upload must validate file signatures");
for (const token of ["ID3", "ftyp", "RIFF", "WAVE", "OggS", "0x1a", "0x45", "0xdf", "0xa3"]) if (!upload.includes(token)) failures.push(`audio signature contract missing: ${token}`);
if (!upload.includes("audio-human-") || !upload.includes("/video/upload")) failures.push("narration upload must use the dedicated Cloudinary audio prefix");
if (upload.includes("/storage/v1/object/videos/")) failures.push("narration upload must not stage audio in Supabase Storage");

const service = read("src/features/videos/services/video-automation.ts");
if (!service.includes("updated_at=eq.") || !service.includes("request.updated_at")) failures.push("video queue claims must include optimistic updated_at");

if (!permissions.includes("'video.manage'")) failures.push("video.manage permission missing");
if (!permissions.includes("'video.delete'")) failures.push("video.delete permission missing");
if (!permissions.includes("'video.manage', 'video.delete'")) failures.push("video_manager role must own video permissions");

const hub = read("src/app/admin/video/page.tsx");
for (const [href, route] of [
  ["/admin/video/requests", "src/app/admin/video/requests/page.tsx"],
  ["/admin/video/studio", "src/app/admin/video/studio/page.tsx"],
  ["/admin/video/sources", "src/app/admin/video/sources/page.tsx"],
  ["/admin/video/scripts", "src/app/admin/video/scripts/page.tsx"],
  ["/admin/video/voices", "src/app/admin/video/voices/page.tsx"],
  ["/admin/video/visuals", "src/app/admin/video/visuals/page.tsx"],
  ["/admin/video/templates", "src/app/admin/video/templates/page.tsx"],
  ["/admin/video/qa", "src/app/admin/video/qa/page.tsx"],
]) {
  if (!hub.includes(href)) failures.push(`Canonical Video Hub destination is missing: ${href}`);
  read(route);
}

if (hub.includes("/admin/video-factory/")) {
  failures.push("Canonical Video Hub must not link into the legacy video-factory route tree");
}

const legacyScheduler = read("src/app/admin/video-factory/scheduler/page.tsx");
if (!legacyScheduler.includes('requireAdminPermission("system.manage")')) {
  failures.push("Legacy video scheduler redirect must preserve the destination system.manage permission");
}
const legacyPublishing = read("src/app/admin/video-factory/publishing/page.tsx");
if (!legacyPublishing.includes('requireAdminPermission("media.manage")')) {
  failures.push("Legacy video publishing route must redirect to the protected internal media library");
}

for (const [legacyPath, destination] of [
  ["src/app/admin/video-factory/page.tsx", "/admin/video"],
  ["src/app/admin/video-factory/sources/page.tsx", "/admin/video/sources"],
  ["src/app/admin/video-factory/scripts/page.tsx", "/admin/video/scripts"],
  ["src/app/admin/video-factory/voices/page.tsx", "/admin/video/voices"],
  ["src/app/admin/video-factory/visuals/page.tsx", "/admin/video/visuals"],
  ["src/app/admin/video-factory/templates/page.tsx", "/admin/video/templates"],
  ["src/app/admin/video-factory/qa/page.tsx", "/admin/video/qa"],
  ["src/app/admin/video-factory/queue/page.tsx", "/admin/video/requests"],
  ["src/app/admin/video-factory/scheduler/page.tsx", "/admin/automation"],
  ["src/app/admin/video-factory/publishing/page.tsx", "/admin/memory"],
]) {
  const legacy = read(legacyPath);
  if (!legacy.includes(`redirect("${destination}")`)) failures.push(`Legacy Video Factory route must redirect to ${destination}: ${legacyPath}`);
}

const page = read("src/app/admin/video/studio/page.tsx");
if (!page.includes('requireAdminPermission("video.manage")')) failures.push("Video Studio admin page must require video.manage");

const canonicalQueue = read("src/app/admin/video/requests/page.tsx");
if (!canonicalQueue.includes("AdminVideoRequestsClient")) failures.push("Video Factory queue must render the feature-owned queue client");
if (!canonicalQueue.includes('requireAdminPermission("video.manage")')) failures.push("Video Factory queue must require video.manage");

const legacyQueue = read("src/app/admin/videos/page.tsx");
if (!legacyQueue.includes('redirect("/admin/video/requests")')) failures.push("Legacy /admin/videos route must redirect to /admin/video/requests");

for (const adminPage of [
  "src/app/admin/video/page.tsx",
  "src/app/admin/video-factory/page.tsx",
  "src/app/admin/video-factory/sources/page.tsx",
  "src/app/admin/video-factory/scripts/page.tsx",
  "src/app/admin/video-factory/voices/page.tsx",
  "src/app/admin/video-factory/visuals/page.tsx",
  "src/app/admin/video-factory/templates/page.tsx",
  "src/app/admin/video-factory/qa/page.tsx",
  "src/app/admin/audio/tts/page.tsx",
  "src/app/admin/audio/quran/page.tsx",
]) {
  const source = read(adminPage);
  if (!source.includes('requireAdminPermission("video.manage")') && !source.includes('requireAdminPermission("audio.manage")')) {
    failures.push(`${adminPage} must be protected by its canonical admin permission`);
  }
}

const client = read("src/features/admin/video-studio/components/admin-video-studio-client.tsx");
if (client.includes("SUPABASE_SERVICE_ROLE_KEY") || client.includes("createAdminClient")) failures.push("AI video client must not contain service-role access");
const studioClientRoute = read("src/app/admin/video/studio/page.tsx");
if (!studioClientRoute.includes('@/features/admin/video-studio/components/admin-video-studio-client')) failures.push("Video Studio must import its client from feature ownership");
if (!canonicalQueue.includes('@/features/admin/video-requests/components/admin-video-requests-client')) failures.push("Video Requests page must import its client from feature ownership");
if (existsSync("src/app/admin/ai-video/ai-video-client.tsx")) failures.push("Legacy AI video client must be moved out of app route folders");
if (existsSync("src/app/admin/videos/videos-client.tsx")) failures.push("Legacy Video Requests client must be moved out of app route folders");

const templateApi = read("src/app/api/admin/video/templates/route.ts");
const templateStudio = read("src/features/admin/video-templates/components/template-studio-client.tsx");
const templateConfig = read("src/features/videos/services/template-config.ts");
const templateVersion = read("src/features/videos/services/video-template-version.ts");
if (!templateApi.includes('requireAdminApi("video.manage")')) failures.push("template registry API must require video.manage");
for (const action of ["create-version", "approve-version", "activate-version", "preview-version"]) {
  if (!templateApi.includes(action)) failures.push(`template registry API action is missing: ${action}`);
}
if (!templateApi.includes("created_by === auth.profile.id")) failures.push("template review must require a reviewer different from the author");
if (!templateApi.includes("skipSocialPublish: true") || !templateApi.includes("templatePreview: true")) failures.push("template previews must be marked internal and excluded from social publishing");
if (!templateStudio.includes("TemplateStudioClient") || !templateStudio.includes("معاينات الرندر الأخيرة")) failures.push("Admin must render the versioned Template Studio and preview history");
for (const token of ["parseVideoTemplateConfig", "isVideoTemplateAssetAllowedForAudience", "videoTemplateAssetPath"]) {
  if (!templateConfig.includes("export function " + token)) failures.push(`template renderer config validation missing: ${token}`);
}
if (!templateVersion.includes("CURRENT_VIDEO_RENDERER_VERSION")) failures.push("a shared immutable renderer version identifier is required");
const createVideoApi = read("src/app/api/admin/videos/create/route.ts");
if (!createVideoApi.includes("templateVersion.status !== \"active\"")) failures.push("normal video creation must pin an active template version only");
if (!createVideoApi.includes("versionedTemplateLabel")) failures.push("normal video requests must persist the exact template version label");
const videoAutomation = read("src/features/videos/services/video-automation.ts");
for (const token of ["source_hash: sourceHashValue", "content_hash: contentHashValue", "template_version: templateVersion"]) {
  if (!videoAutomation.includes(token)) failures.push(`manual video requests must persist ${token}`);
}
if (!templateApi.includes("/rest/v1/rpc/admin_create_video_template_version") || !templateApi.includes("/rest/v1/rpc/activate_video_template_version")) {
  failures.push("template version creation/activation must use atomic database functions");
}
if (!templateApi.includes("recordAdminAuditEvent")) failures.push("template actions must be included in the admin audit stream");

const worker = read("scripts/jobs/template-video-automation.ts");
if (!worker.includes("async function bindTemplateVersion")) failures.push("video worker must bind requests to an immutable template version");
if (!worker.includes("request.content.templatePreview === true")) failures.push("template preview mode must be recognized by the renderer");
if (!worker.includes("if (!isTemplatePreview) aiPlan = await generateAiVideoPlan(request)")) failures.push("internal template previews must avoid external generative planning");
if (!worker.includes("registerGeneratedVideoOnSite(request, rendered)") || !worker.includes('generator: "zikr_internal_video_factory"')) {
  failures.push("successfully generated videos must be persisted in the internal ZIKR catalog");
}
if (!read("scripts/jobs/content-publishing.ts").includes('"videos"')) failures.push("scheduled site publisher must support videos records");
const internalVideoQueueMigration = read("supabase/migrations/20261106160000_allow_internal_videos_in_content_publish_queue.sql");
if (!internalVideoQueueMigration.includes("'videos'") || !internalVideoQueueMigration.includes("content_publish_queue_content_table_check")) {
  failures.push("Supabase content publication queue constraint must explicitly allow internal videos");
}
if (!worker.includes("source_hash: rendered.sourceHash") || !worker.includes("content_hash: rendered.contentHash") || !worker.includes("template_version: rendered.templateVersion")) {
  failures.push("completed manual renders must persist source, content and template integrity fingerprints");
}
if (worker.includes("social_publish_queue") || worker.includes("getFacebookPageCredentials") || worker.includes("queueSocialItems")) failures.push("video generation must never enqueue or query external social platforms");
if (!worker.includes("!isTemplatePreview &&") || !worker.includes("!boundTemplate &&")) failures.push("pinned template renders must not be handed to external video providers");
for (const [path, destinations] of [
  ["src/app/admin/audio/tts/page.tsx", ["/admin/video/voices", "/admin/video/scripts"]],
  ["src/app/admin/audio/quran/page.tsx", ["/admin/video/voices"]],
  ["src/app/admin/automation/page.tsx", ["/admin/video/voices", "/admin/video/scripts", "/admin/video/qa"]],
]) {
  const source = read(path);
  if (source.includes("/admin/video-factory/")) failures.push(`${path} still links into the legacy video-factory tree`);
  for (const destination of destinations) {
    if (!source.includes(destination)) failures.push(`${path} is missing canonical destination ${destination}`);
  }
}

const routeManifest = JSON.parse(read("public/manus-routes.json"));
for (const route of [
  "/admin/queues",
  "/admin/video",
  "/admin/video/requests",
  "/admin/video/studio",
  "/admin/video/studio/curated",
  "/admin/video/sources",
  "/admin/video/scripts",
  "/admin/video/voices",
  "/admin/video/visuals",
  "/admin/video/templates",
  "/admin/video/qa",
  "/data-deletion",
  "/kids/parent-dashboard",
]) {
  if (!routeManifest.routes.some((entry) => entry.path === route)) {
    failures.push(`Manus route manifest is missing canonical route: ${route}`);
  }
}

const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts["admin:video:check"]) failures.push("admin:video:check must be registered");
if (!pkg.scripts["verify:pr"]?.includes("pnpm admin:video:check")) failures.push("verify:pr must include Admin Video Factory verification");
if (!pkg.scripts["verify"]?.includes("pnpm admin:video:check")) failures.push("verify must include Admin Video Factory verification");
if (!read("src/features/videos/services/voice-profiles.ts").includes("hadith_male_msa")) failures.push("canonical hadith male voice profile missing");
if (!read("src/features/videos/services/narration-quality.ts").includes("evaluateArabicNarrationText")) failures.push("Arabic narration quality validator missing");
if (!worker.includes("wordsPerSecond")) failures.push("Video worker missing speaking-rate checks");

if (failures.length) {
  console.error("ADMIN_VIDEO_FACTORY_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 15 Admin Video Factory checks passed");
