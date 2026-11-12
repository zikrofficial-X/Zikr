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
  "getConfirmedYoutubeFallbackId",
  "hasConfirmedYoutubeFallback",
  "catalog_row_missing_updated_at_for_compare_and_set",
  "catalog_row_changed_during_media_audit",
]) {
  if (!audit.includes(token)) failures.push("Video media audit is missing required evidence/reconciliation behavior: " + token);
}
if (!audit.includes("assertCompleteVideoMediaAuditInventory") ||
    !audit.includes("isBlockingVideoMediaAuditOutcome") ||
    !audit.includes("process.exitCode = 1")) {
  failures.push("Video media audit must reject truncated inventories and fail the job when a published item has a blocking media result");
}
if (!audit.includes("concurrency = Math.min(5")) failures.push("Cloudinary availability probing must use bounded concurrency");
if (!audit.includes('status: "unknown"')) failures.push("Transient media probe failures must remain unknown and must not mark valid assets missing");
if (!audit.includes("return null") || !audit.includes("unavailable")) failures.push("Video media audit must distinguish missing media from a valid YouTube fallback");

const outcome = read("src/features/videos/services/video-media-audit-outcome.ts");
const supabaseConfig = read("supabase/config.toml");
if (!audit.includes('supabaseServerAdminExactCount("videos")') ||
    !audit.includes('supabaseServerAdminExactCount("social_publish_queue")') ||
    !audit.includes("&limit=1000") ||
    audit.includes("&limit=2000") ||
    !outcome.includes("VIDEO_MEDIA_AUDIT_SOCIAL_QUEUE_LIMIT = 1000") ||
    !supabaseConfig.includes("max_rows = 1000")) {
  failures.push("Video media audit must verify exact table counts and fail closed at the configured Supabase PostgREST max_rows cap");
}

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
for (const token of ["probeCloudinaryPlayback", "assertExpectedSupabaseProject", "assertRetentionApplyConfirmation", "textReferencePatterns", "storagePathReferencePatterns", "MAX_CLOUDINARY_PROBES"]) {
  if (!retention.includes(token)) failures.push("Storage retention is missing a fail-closed safety contract: " + token);
}
const referenceScanStart = retention.indexOf("async function loadUnexpectedVideoReferences");
const referenceScanEnd = retention.indexOf("  ];", referenceScanStart);
const referenceScan = referenceScanStart >= 0 && referenceScanEnd > referenceScanStart
  ? retention.slice(referenceScanStart, referenceScanEnd)
  : "";
for (const token of [
  '...textReferencePatterns("social_publish_queue", "video_url")',
  '...textReferencePatterns("video_generation_requests", "video_url")',
  '...storagePathReferencePatterns("media_assets", "storage_path")',
  "const MAX_VIDEO_REFERENCE_ENCODING_DEPTH = 5;",
  "const VIDEO_STORAGE_REFERENCE_PATTERNS = Object.freeze(",
  "Array.from({ length: MAX_VIDEO_REFERENCE_ENCODING_DEPTH + 1 }",
  "encodedSlash = encodeURIComponent(encodedSlash)",
  "return `%automated${encodedSlash}%`",
  "for (let pass = 0; pass < MAX_VIDEO_REFERENCE_ENCODING_DEPTH; pass += 1)",
]) {
  if (!retention.includes(token)) failures.push("Storage retention is missing raw/encoded reference protection: " + token);
}
if (/filter: \\(query\\) => query\\.(?:ilike|like)/.test(referenceScan)) {
  failures.push("Storage retention reference columns must use the shared raw/encoded filters instead of raw-only query predicates");
}
const retentionWorkflow = read(".github/workflows/storage-retention.yml");
if (!retentionWorkflow.includes("EXPECTED_PROJECT_REF: zqtssvlvmkzeeyqghqfk") ||
    !retentionWorkflow.includes("RETENTION_CONFIRMATION: ${{ inputs.confirmation }}")) {
  failures.push("Storage retention workflow must pass the canonical project ref and explicit owner confirmation to the cleanup CLI");
}

const workflow = read(".github/workflows/audit-video-media.yml");
if (!workflow.includes('cron: "41 4 * * *"') ||
    !workflow.includes("workflow_dispatch:") ||
    !workflow.includes("inputs.confirmation == 'RUN_MEDIA_AUDIT'") ||
    workflow.includes("\n  push:") ||
    !workflow.includes("environment: production") ||
    !workflow.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    !workflow.includes("pnpm video:media:audit")) {
  failures.push("Daily video media audit must be production-gated, manually confirmed, and must not auto-run on source pushes");
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
