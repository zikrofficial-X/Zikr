#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (file) => {
  if (!existsSync(file)) {
    failures.push("Missing legacy video QA backfill artifact: " + file);
    return "";
  }
  return readFileSync(file, "utf8");
};

const backfill = read("scripts/jobs/backfill-legacy-video-qa.ts");
for (const token of [
  "validateSourceContent",
  "assertKidsStoryContract",
  "sourceHash(",
  "videoContentHash(",
  "buildAutomatedVideoQaChecklist(",
  "createAutomatedVideoQaApproval(",
  "validateLegacyCloudinaryMaster",
  "verifyRemoteMedia",
  "content->automatedVideoQa=is.null",
  'approvalStatus: "qa_failed"',
  'status: "blocked"',
  "sourceRevalidated: true",
  "mediaVerified: true",
]) {
  if (!backfill.includes(token)) failures.push("Legacy QA backfill is missing safety check: " + token);
}
for (const forbidden of ["social_publish_queue", "processSocialPublishQueue", "publish-social.yml", "content_publish_queue"]) {
  if (backfill.includes(forbidden)) failures.push("Legacy QA backfill must never enqueue or publish content: " + forbidden);
}
if (!backfill.includes("process.argv.includes(\"--apply\")")) failures.push("Legacy QA backfill must default to dry-run unless --apply is explicit");
if (!backfill.includes("templateVersionId")) failures.push("Legacy QA backfill must block historical requests bound to mutable template IDs");
if (!backfill.includes("videoUrl") || !backfill.includes("Cloudinary")) failures.push("Legacy QA backfill must check media ownership and live asset availability");

const workflow = read(".github/workflows/backfill-legacy-video-qa.yml");
if (!workflow.includes("workflow_dispatch:") || !workflow.includes("push:") ||
    !workflow.includes("environment: production") ||
    !workflow.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    !workflow.includes("pnpm video:qa:backfill -- --apply")) {
  failures.push("Legacy QA backfill workflow must be production-scoped, credential-checked, and explicitly apply the idempotent backfill");
}

const videoService = read("src/features/videos/services/videos.ts");
for (const token of ["getKidsGeneratedVideos", "getKidsGeneratedVideoBySlug", "metadata->>audience=eq.kids", "slug=neq.kids-stories"]) {
  if (!videoService.includes(token)) failures.push("Dedicated Kids video library service is missing: " + token);
}
const kidsHome = read("src/app/kids/page.tsx");
if (!kidsHome.includes('href="/kids/videos"')) failures.push("Kids homepage must link to its separate story-video library");
read("src/app/kids/videos/page.tsx");
read("src/app/kids/videos/[slug]/page.tsx");

const dynamicWorker = read("scripts/jobs/template-video-automation.ts");
if (!dynamicWorker.includes("function getAiAttemptsPerRunLimit()") ||
    dynamicWorker.includes("const AI_ATTEMPTS_PER_RUN")) {
  failures.push("AI retry budget must be dynamically read after runtime settings injection");
}
const runtimeSettings = read("src/app/admin/automation/page.tsx");
if (!runtimeSettings.includes('? "4"')) failures.push("Admin AI-attempt fallback must match the four-attempt production setting");

const migration = read("supabase/migrations/20261110021309_kids_video_library_and_thumbnail_recovery.sql");
for (const token of ["kids-stories", "metadata->>'audience' = 'kids'", "hqdefault.jpg", "so_0/", "/branding/og-image.jpg"]) {
  if (!migration.includes(token)) failures.push("Kids/video thumbnail data migration is missing: " + token);
}

if (failures.length) {
  console.error("VIDEO_QA_BACKFILL_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Legacy video QA, Kids library, AI-budget and thumbnail contracts passed");
