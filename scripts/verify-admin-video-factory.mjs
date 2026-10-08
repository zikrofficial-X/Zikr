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
if (!createRoute.includes("ownStorageAudioUrl")) failures.push("human narration must be restricted to owned storage");
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
if (!upload.includes("human-narration/")) failures.push("narration upload must use the dedicated storage prefix");

const service = read("src/features/videos/services/video-automation.ts");
if (!service.includes("updated_at=eq.") || !service.includes("request.updated_at")) failures.push("video queue claims must include optimistic updated_at");

const permissions = read("src/features/admin/services/permissions.ts");
if (!permissions.includes("'video.manage'")) failures.push("video.manage permission missing");
if (!permissions.includes("'video.delete'")) failures.push("video.delete permission missing");
if (!permissions.includes("'video.manage', 'video.delete'")) failures.push("video_manager role must own video permissions");

const page = read("src/app/admin/ai-video/page.tsx");
if (!page.includes('requireAdminPermission("video.manage")')) failures.push("AI video admin page must require video.manage");

const canonicalQueue = read("src/app/admin/video-factory/queue/page.tsx");
if (!canonicalQueue.includes("AdminVideosClient")) failures.push("Video Factory queue must render the canonical queue client");
if (!canonicalQueue.includes('requireAdminPermission("video.manage")')) failures.push("Video Factory queue must require video.manage");

const legacyQueue = read("src/app/admin/videos/page.tsx");
if (!legacyQueue.includes('redirect("/admin/video-factory/queue")')) failures.push("Legacy /admin/videos route must redirect to /admin/video-factory/queue");

for (const adminPage of [
  "src/app/admin/video-factory/page.tsx",
  "src/app/admin/video-factory/scripts/page.tsx",
  "src/app/admin/video-factory/voices/page.tsx",
  "src/app/admin/video-factory/qa/page.tsx",
  "src/app/admin/audio/tts/page.tsx",
  "src/app/admin/audio/quran/page.tsx",
]) {
  const source = read(adminPage);
  if (!source.includes('requireAdminPermission("video.manage")') && !source.includes('requireAdminPermission("audio.manage")')) {
    failures.push(`${adminPage} must be protected by its canonical admin permission`);
  }
}

const client = read("src/app/admin/ai-video/ai-video-client.tsx");
if (client.includes("SUPABASE_SERVICE_ROLE_KEY") || client.includes("createAdminClient")) failures.push("AI video client must not contain service-role access");

const worker = read("scripts/jobs/template-video-automation.ts");

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
