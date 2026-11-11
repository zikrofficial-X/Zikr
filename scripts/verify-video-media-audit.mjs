#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (file) => {
  if (!existsSync(file)) {
    failures.push("Missing video media audit artifact: " + file);
    return "";
  }
  return readFileSync(file, "utf8");
};

const audit = read("scripts/jobs/audit-video-media.ts");
for (const token of [
  "social_publish_queue",
  "platformResults",
  "youtube.remoteId",
  "metadata.videoGenerationRequestId",
  "probeCloudinary",
  'method: "HEAD"',
  'headers: { Range: "bytes=0-0" }',
  'redirect: "error"',
  "cloudinary_missing",
  "youtube_only",
  "youtube_id",
  "updated_at",
]) {
  if (!audit.includes(token)) failures.push("Video media audit is missing required evidence/reconciliation behavior: " + token);
}
if (!audit.includes("concurrency = Math.min(5")) failures.push("Cloudinary availability probing must use bounded concurrency");
if (!audit.includes('status: "unknown"')) failures.push("Transient media probe failures must remain unknown and must not mark valid assets missing");
if (!audit.includes("return null") || !audit.includes("unavailable")) failures.push("Video media audit must distinguish missing media from a valid YouTube fallback");

const service = read("src/features/videos/services/videos.ts");
const mediaContract = read("src/features/videos/services/video-media-contract.ts");
const requiredFallbackStates = ["cloudinary_missing", "unavailable", "youtube_only", "purged"];
if (!requiredFallbackStates.every((state) => mediaContract.includes(JSON.stringify(state)))) {
  failures.push("Public video media contract must cover every unavailable internal-media state before using a confirmed YouTube fallback");
}
if (!mediaContract.includes("youtubeUrl")) failures.push("Public video media contract must retain the canonical YouTube playback fallback");
if (!service.includes('from "./video-media-contract"') || !service.includes("resolveVideoMediaUrl(row)")) {
  failures.push("Public video service must use the canonical media resolver contract");
}

const publisher = read("src/features/social/services/social-publishing.ts");
for (const token of [
  "syncYouTubeVideoReferenceToCatalog",
  "youtubePublishedVideoId",
  "youtubePublishedUrl",
  "videoGenerationRequestId",
  "mergedResults.youtube",
  "return;",
]) {
  if (!publisher.includes(token)) failures.push("Social publisher is missing safe YouTube/catalog synchronization behavior: " + token);
}
const disposalStart = publisher.indexOf("async function disposePublishedVideo");
const disposalEnd = publisher.indexOf("export async function resetQueuedSocialVideoMedia", disposalStart);
const disposal = disposalStart >= 0 && disposalEnd > disposalStart ? publisher.slice(disposalStart, disposalEnd) : "";
if (!disposal.includes("stagingCleanupEligibleAt") || disposal.includes("deleteManagedVideoUrl") || disposal.includes("video_url: null")) {
  failures.push("Social delivery must preserve the permanent Cloudinary media master and defer staging-copy cleanup");
}

const retention = read("scripts/cleanup-supabase-storage.mjs");
for (const token of ["probeCloudinaryPlayback", "assertExpectedSupabaseProject", "assertRetentionApplyConfirmation", 'column: "video_url"', "MAX_CLOUDINARY_PROBES"]) {
  if (!retention.includes(token)) failures.push("Storage retention is missing a fail-closed safety contract: " + token);
}
const retentionWorkflow = read(".github/workflows/storage-retention.yml");
if (!retentionWorkflow.includes("EXPECTED_PROJECT_REF: zqtssvlvmkzeeyqghqfk") ||
    !retentionWorkflow.includes("RETENTION_CONFIRMATION: ${{ inputs.confirmation }}")) {
  failures.push("Storage retention workflow must pass the canonical project ref and explicit owner confirmation to the cleanup CLI");
}

const workflow = read(".github/workflows/audit-video-media.yml");
if (!workflow.includes('cron: "41 4 * * *"') ||
    !workflow.includes("workflow_dispatch:") ||
    !workflow.includes("environment: production") ||
    !workflow.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    !workflow.includes("pnpm video:media:audit")) {
  failures.push("Daily video media audit must run in the production environment with validated service-role credentials");
}
const migration = read("supabase/migrations/20261110025303_reconcile_published_youtube_ids_to_video_catalog.sql");
for (const token of [
  "platformResults",
  "->'youtube'->>'remoteId'",
  "youtubePublishedVideoId",
  "metadata->>'videoGenerationRequestId'",
  "v.youtube_id is null",
]) {
  if (!migration.includes(token)) failures.push("Confirmed YouTube catalog reconciliation migration is missing: " + token);
}
const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts["video:media:audit"] || !pkg.scripts["video:media:check"]) {
  failures.push("Video media audit and its contract check must be registered in package scripts");
}
if (!pkg.scripts["video:qa:check"]?.includes("pnpm video:media:check")) {
  failures.push("The full video QA gate must include video media audit contracts");
}

if (failures.length) {
  console.error("VIDEO_MEDIA_AUDIT_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Video media audit, Cloudinary fallback and YouTube catalog reconciliation contracts passed");
