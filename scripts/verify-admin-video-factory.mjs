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

const createRoute = read("src/app/api/admin/videos/create/route.ts");
if (!createRoute.includes('requireAdminApi("video.manage")')) failures.push("video create API must require video.manage");
if (!createRoute.includes("SOURCE_LOCKED_CATEGORIES")) failures.push("video create API must enforce source-locked categories");
if (!createRoute.includes("resolveVideoSource")) failures.push("video create API must resolve the canonical source");
if (!createRoute.includes("sourceVerifiedAtRequest: true")) failures.push("video create API must stamp source verification");
if (!createRoute.includes("ownCloudinaryAudioUrl")) failures.push("human narration must be restricted to ZIKR-owned Cloudinary uploads");
if (!createRoute.includes("category === \"quran\"")) failures.push("Quran audio substitution must remain blocked");

const generation = read("src/app/api/admin/video-generation/route.ts");
if (!generation.includes("requireAdminApi('video.manage')")) failures.push("video generation GET/PATCH must require video.manage");
if (!generation.includes("requireAdminApi('video.delete')")) failures.push("video generation DELETE must require video.delete");
if (!generation.includes("updated_at=eq.") || !generation.includes("current.updated_at")) failures.push("admin publish retry must use optimistic concurrency");

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

const permissions = read("src/features/admin/services/permissions.ts");
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
if (!legacyPublishing.includes('requireAdminPermission("social.manage")')) {
  failures.push("Legacy publishing redirect must preserve the destination social.manage permission");
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
  ["src/app/admin/video-factory/publishing/page.tsx", "/admin/social"],
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

const worker = read("scripts/jobs/template-video-automation.ts");

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
