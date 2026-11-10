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
  "contentSourceUrl(request)",
  "assertKidsStoryContract",
  "sourceHash(",
  "videoContentHash(",
  "buildAutomatedVideoQaChecklist(",
  "createAutomatedVideoQaApproval(",
  "validateLegacyCloudinaryMaster",
  "verifyRemoteMedia",
  "content->automatedVideoQa=is.null",
  "KIDS_CLASSIFICATION_BLOCK_REASON",
  "isKidsClassificationRevalidation",
  "content->automatedVideoQa->>blockedReason=eq.",
  "revalidatedAfterCanonicalKidsClassification",
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

const retryMigration = read("supabase/migrations/20261110031431_retry_false_blocked_legacy_qa_source_url_parity.sql");
for (const token of [
  "legacyVideoQaHistory",
  "automatedVideoQa",
  "approvalSnapshotHash",
  "source_hash",
  "content_hash",
  "template_version",
  "Revalidated current source text/URL no longer matches the original source hash.",
  "status = 'completed'",
]) {
  if (!retryMigration.includes(token)) failures.push("Legacy QA retry migration must preserve prior review history and narrowly match verified false-blocked records: " + token);
}
const workflow = read(".github/workflows/backfill-legacy-video-qa.yml");
if (!workflow.includes("20261110031431_retry_false_blocked_legacy_qa_source_url_parity.sql")) {
  failures.push("Legacy QA workflow must rerun after the safe false-blocked history-preserving migration");
}
if (!workflow.includes("workflow_dispatch:") || !workflow.includes("push:") ||
    !workflow.includes("environment: production") ||
    !workflow.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    !workflow.includes("inputs.apply == true") ||
    !workflow.includes("default: false") ||
    !workflow.includes("BACKFILL_APPLY") ||
    !workflow.includes("Mode: dry-run only; no production rows will be updated.") ||
    !workflow.includes("pnpm video:qa:backfill") ||
    !workflow.includes("pnpm video:qa:backfill -- --apply")) {
  failures.push("Legacy QA workflow must default to read-only dry-run and require a manual apply=true dispatch before production writes");
}

const videoService = read("src/features/videos/services/videos.ts");
for (const token of [
  "getKidsGeneratedVideos",
  "getKidsGeneratedVideoBySlug",
  "metadata->>audience=eq.kids",
  "slug=neq.kids-stories",
  "function hasPassedKidsVideoQa",
  'metadata.kidsVideoQaStatus === "passed"',
  'qa.status === "passed"',
]) {
  if (!videoService.includes(token)) failures.push("Dedicated Kids video library service is missing QA isolation: " + token);
}
const kidsHome = read("src/app/kids/page.tsx");
if (!kidsHome.includes('href="/kids/videos"')) failures.push("Kids homepage must link to its separate story-video library");
read("src/app/kids/videos/page.tsx");
read("src/app/kids/videos/[slug]/page.tsx");

const dynamicWorker = read("scripts/jobs/template-video-automation.ts");
for (const token of [
  'source.audience === "kids"',
  'source.generationMode === "free_deterministic_story_factory"',
  'aiMode: "original_kids_story"',
  'sourceType: "original_kids_fiction"',
  "seriesId: source.seriesId",
  "seriesTitle: source.seriesTitle",
  "learningObjective: source.learningObjective",
]) {
  if (!dynamicWorker.includes(token)) failures.push("Trusted curated Kids source must restore canonical classification metadata before QA: " + token);
}
if (!dynamicWorker.includes("source.category === \"story\"") ||
    !dynamicWorker.includes('"generationMode" in source')) {
  failures.push("Kids classification recovery must be restricted to canonical deterministic Kids story sources");
}
if (!backfill.includes("originalContent.curatedSourceId.startsWith(\"kids-series:\")") ||
    !backfill.includes('validatedContent.audience !== "kids"')) {
  failures.push("Legacy Kids backfill must reclassify only after a canonical source lookup restores the Kids audience");
}
if (!dynamicWorker.includes("function getAiAttemptsPerRunLimit()") ||
    dynamicWorker.includes("const AI_ATTEMPTS_PER_RUN")) {
  failures.push("AI retry budget must be dynamically read after runtime settings injection");
}
const generationWorkflow = read(".github/workflows/generate-ai-video.yml");
if (!generationWorkflow.includes('VIDEO_AI_ATTEMPTS_PER_RUN: "4"')) {
  failures.push("video generation workflow default must use the approved four-attempt free-provider budget");
}
if (!dynamicWorker.includes('isKidsVideo ? "kids-stories"') ||
    !dynamicWorker.includes('isKidsVideo ? "/kids/videos/" : "/videos/"') ||
    !dynamicWorker.includes("kidsVideoQaStatus") ||
    !dynamicWorker.includes('qaSnapshot.status === "passed"')) {
  failures.push("New Kids videos must be catalogued, routed, and gated by a passed Kids-specific QA contract");
}
const publicVideoService = read("src/features/videos/services/videos.ts");
if (!publicVideoService.includes("Boolean(video.youtubeId)")) failures.push("YouTube-recovered generated videos must remain visible in the public video library");
const runtimeSettings = read("src/app/admin/automation/page.tsx");
if (!runtimeSettings.includes('? "4"')) failures.push("Admin AI-attempt fallback must match the four-attempt production setting");
if (!runtimeSettings.includes('? "25"')) failures.push("Admin video-duration fallback must match the production 25-second default");
const backgroundRunner = read("scripts/run-background-jobs.ts");
if (!backgroundRunner.includes("AUTO_VIDEO_SECONDS ?? 25") ||
    !backgroundRunner.includes("|| 25")) {
  failures.push("Worker video-duration fallback must match the 25-second production default");
}

const migration = read("supabase/migrations/20261110021309_kids_video_library_and_thumbnail_recovery.sql");
for (const token of ["kids-stories", "metadata->>'audience' = 'kids'", "hqdefault.jpg", "so_0/", "/branding/og-image.jpg"]) {
  if (!migration.includes(token)) failures.push("Kids/video thumbnail data migration is missing: " + token);
}
const kidsPathMigration = read("supabase/migrations/20261110022756_set_kids_video_public_paths.sql");
if (!kidsPathMigration.includes("'/kids/videos/' || slug")) failures.push("Existing Kids catalog records must point to the dedicated Kids video detail route");
const kidsIsolationMigration = read("supabase/migrations/20261110030705_isolate_legacy_kids_series_and_require_kids_qa.sql");
for (const token of [
  "curatedSourceId",
  "kidsVideoQaStatus",
  "revalidation_required",
  "kids_qa_ready",
  "published = linked.kids_qa_ready",
  "'automatedVideoQa'",
]) {
  if (!kidsIsolationMigration.includes(token)) failures.push("Legacy Kids audience isolation migration is missing a QA visibility gate: " + token);
}

if (failures.length) {
  console.error("VIDEO_QA_BACKFILL_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Legacy video QA, Kids library, AI-budget and thumbnail contracts passed");
