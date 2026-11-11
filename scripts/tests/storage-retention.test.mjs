import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  compareSemverTags,
  getReferenceOrderColumn,
  assertExpectedSupabaseProject,
  assertRetentionApplyConfirmation,
  probeCloudinaryPlayback,
  extractManagedVideoPath,
  extractCloudinaryVideoPublicId,
  hasConfirmedPlatformResults,
  collectPaginatedRows,
  indexManagedBackupReferences,
  matchesSha256Digest,
  isEligiblePublishedQueueItem,
  selectProtectedAndroidTags,
} from "../cleanup-supabase-storage.mjs";

const supabaseUrl = "https://zqtssvlvmkzeeyqghqfk.supabase.co";
assert.equal(assertExpectedSupabaseProject(supabaseUrl, "zqtssvlvmkzeeyqghqfk"), "zqtssvlvmkzeeyqghqfk");
assert.throws(() => assertExpectedSupabaseProject(supabaseUrl, "wrong-project"), /20-character Supabase project ref/);
assert.throws(() => assertExpectedSupabaseProject("https://other-project.supabase.co", "zqtssvlvmkzeeyqghqfk"), /unexpected Supabase project/);
assert.throws(() => assertExpectedSupabaseProject("http://zqtssvlvmkzeeyqghqfk.supabase.co", "zqtssvlvmkzeeyqghqfk"), /unexpected Supabase project/);
assert.doesNotThrow(() => assertRetentionApplyConfirmation(false, ""));
assert.throws(() => assertRetentionApplyConfirmation(true, ""), /DELETE_STAGING_COPIES/);
assert.doesNotThrow(() => assertRetentionApplyConfirmation(true, "DELETE_STAGING_COPIES"));
const publicUrl = `${supabaseUrl}/storage/v1/object/public/videos/automated/story:20750:11.mp4`;
const cloudinaryMaster = "https://res.cloudinary.com/dcuveyab9/video/upload/v1793575328/auto-story-20756-18-97cca8e1.mp4";
const now = new Date("2026-10-30T12:00:00.000Z");
const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

assert.equal(
  extractManagedVideoPath(publicUrl, supabaseUrl),
  "automated/story:20750:11.mp4",
  "Only canonical videos bucket URLs are converted into Storage paths",
);
assert.equal(
  matchesSha256Digest(Buffer.from("ZIKR release metadata"), "sha256:" + createHash("sha256").update("ZIKR release metadata").digest("hex")),
  true,
  "small Android release metadata copies must match the exact GitHub asset digest",
);
assert.equal(
  matchesSha256Digest(Buffer.from("tampered"), "sha256:" + createHash("sha256").update("ZIKR release metadata").digest("hex")),
  false,
  "a same-size but modified metadata/checksum file must not be treated as a verified backup",
);
assert.equal(
  extractCloudinaryVideoPublicId(
    "https://res.cloudinary.com/dcuveyab9/video/upload/v1793575328/auto-story-20756-18-97cca8e1.mp4",
    "dcuveyab9",
  ),
  "auto-story-20756-18-97cca8e1",
  "Only generated auto-video public IDs are accepted for Cloudinary cleanup",
);
assert.equal(
  extractCloudinaryVideoPublicId(
    "https://res.cloudinary.com/dcuveyab9/video/upload/v1790961968/zikr/audio/salawat/ba-salawat-variant.ogg",
    "dcuveyab9",
  ),
  null,
  "Cloudinary audio assets are never eligible for video cleanup",
);
assert.equal(
  extractCloudinaryVideoPublicId(
    "https://res.cloudinary.com/dcuveyab9/video/upload/v1773194710/samples/elephants.mp4",
    "dcuveyab9",
  ),
  null,
  "Cloudinary sample videos are never eligible for ZIKR cleanup",
);
assert.equal(
  extractCloudinaryVideoPublicId(
    "https://res.cloudinary.com/other/video/upload/v1793575328/auto-story-1.mp4",
    "dcuveyab9",
  ),
  null,
  "Assets from another Cloudinary cloud are never deleted",
);
const probeResponse = (status, contentType) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: { get: (name) => name === "content-type" ? contentType : null },
  body: { cancel: async () => {} },
});
assert.equal((await probeCloudinaryPlayback(cloudinaryMaster, "dcuveyab9", async () => probeResponse(200, "video/mp4"))).status, "available");
assert.equal((await probeCloudinaryPlayback(cloudinaryMaster, "dcuveyab9", async () => probeResponse(404, "text/plain"))).status, "missing");
assert.equal((await probeCloudinaryPlayback(cloudinaryMaster, "dcuveyab9", async () => probeResponse(403, "text/html"))).status, "unknown");
const probeMethods = [];
const rangeProbe = await probeCloudinaryPlayback(cloudinaryMaster, "dcuveyab9", async (_url, options) => {
  probeMethods.push(options.method);
  return options.method === "HEAD" ? probeResponse(405, null) : probeResponse(206, "video/mp4");
});
assert.equal(rangeProbe.status, "available");
assert.deepEqual(probeMethods, ["HEAD", "GET"]);
assert.equal((await probeCloudinaryPlayback("https://evil.example/video.mp4", "dcuveyab9", async () => probeResponse(200, "video/mp4"))).status, "unknown");
assert.equal(
  extractManagedVideoPath("https://evil.example/storage/v1/object/public/videos/a.mp4", supabaseUrl),
  null,
  "Foreign hosts are never eligible",
);
assert.equal(
  extractManagedVideoPath(`${supabaseUrl}/storage/v1/object/public/android-releases/android/v1.1.7/app-release.apk`, supabaseUrl),
  null,
  "Android release binaries are never treated as video files",
);
assert.equal(
  extractManagedVideoPath(`${supabaseUrl}/storage/v1/object/public/videos/automated/%2E%2E%2Fprivate.mp4`, supabaseUrl),
  null,
  "Path traversal is rejected",
);
assert.equal(
  extractManagedVideoPath(`${supabaseUrl}/storage/v1/object/public/videos/automated/%00private.mp4`, supabaseUrl),
  null,
  "NUL bytes are rejected from Storage object paths",
);

const pagedRows = await collectPaginatedRows(
  async (offset, end) => [10, 20, 30, 40, 50].slice(offset, end + 1),
  "fixture rows",
  2,
  6,
);
assert.deepEqual(pagedRows, [10, 20, 30, 40, 50], "all pages must be read before retention decisions");
const duplicateBackupReferences = indexManagedBackupReferences(
  [
    { id: "queue-a", video_url: "https://cdn.example/primary.mp4", metadata: { supabaseOriginalVideoUrl: publicUrl } },
    { id: "queue-b", metadata: { nested: { sourceVideoUrl: publicUrl } } },
    { id: "queue-c", video_url: `${supabaseUrl}/storage/v1/object/public/videos/automated%2Fstory%3A20750%3A11.mp4`, metadata: {} },
  ],
  ["automated/story:20750:11.mp4"],
  (row) => ({ metadata: row.metadata, video_url: row.video_url }),
  (row) => row.id,
  supabaseUrl,
);
assert.deepEqual(
  [...duplicateBackupReferences.get("automated/story:20750:11.mp4")],
  ["queue-a", "queue-b", "queue-c"],
  "backup ownership must be indexed across every queue/request row before deletion",
);

await assert.rejects(
  () => collectPaginatedRows(async () => [1, 2], "truncated fixture", 2, 4),
  /safe scan limit; refusing cleanup/,
  "a scan that reaches its hard cap must fail closed rather than silently truncate",
);

const targets = ["youtube", "facebook_reels"];
const goodMetadata = {
  platformResults: {
    youtube: { ok: true, remoteId: "youtube-id-123" },
    facebook_reels: { ok: true, remoteId: "facebook-id-456" },
  },
};
assert.equal(hasConfirmedPlatformResults(targets, goodMetadata), true);
assert.equal(
  hasConfirmedPlatformResults(["unknown_platform"], { platformResults: { unknown_platform: { ok: true, remoteId: "remote-id" } } }),
  false,
  "unsupported database platform values must never authorize storage deletion",
);
assert.equal(
  hasConfirmedPlatformResults(targets, { platformResults: { youtube: goodMetadata.platformResults.youtube } }),
  false,
  "A missing target platform blocks deletion",
);
assert.equal(
  hasConfirmedPlatformResults(targets, {
    platformResults: {
      youtube: { ok: true, remoteId: "youtube-id-123" },
      facebook_reels: { ok: true, remoteId: "" },
    },
  }),
  false,
  "A success without a remote platform ID blocks deletion",
);

const publishedCandidate = {
  status: "published",
  published_at: "2026-10-27T00:00:00.000Z",
  video_url: cloudinaryMaster,
  target_platforms: targets,
  metadata: { ...goodMetadata, supabaseOriginalVideoUrl: publicUrl },
};
assert.equal(isEligiblePublishedQueueItem(publishedCandidate, cutoff, supabaseUrl, "dcuveyab9", "available"), true);
assert.equal(isEligiblePublishedQueueItem(publishedCandidate, cutoff, supabaseUrl, "dcuveyab9", "unknown"), false);
assert.equal(
  isEligiblePublishedQueueItem({ ...publishedCandidate, status: "partial" }, cutoff, supabaseUrl, "dcuveyab9"),
  false,
  "Partial social publishing must retain its source video",
);
assert.equal(
  isEligiblePublishedQueueItem({ ...publishedCandidate, status: "queued" }, cutoff, supabaseUrl, "dcuveyab9"),
  false,
  "Queued posts must retain their source video",
);
assert.equal(
  isEligiblePublishedQueueItem({ ...publishedCandidate, published_at: "2026-10-30T11:00:00.000Z" }, cutoff, supabaseUrl, "dcuveyab9"),
  false,
  "Videos younger than 48 hours are retained",
);
assert.equal(
  isEligiblePublishedQueueItem({ ...publishedCandidate, video_url: null }, cutoff, supabaseUrl, "dcuveyab9"),
  false,
  "Missing media URLs are not eligible",
);
assert.equal(compareSemverTags("v1.1.8", "v1.1.7") > 0, true);
assert.equal(compareSemverTags("v1.2.0", "v1.1.99") > 0, true);

const protectedTags = selectProtectedAndroidTags(
  ["v1.1.3", "v1.1.4", "v1.1.5", "v1.1.6", "v1.1.7", "v1.1.8"],
  "v1.1.8",
);
assert.equal(protectedTags.has("v1.1.8"), true, "The currently pinned release must be retained");
assert.equal(protectedTags.has("v1.1.7"), true, "The previous release is retained for rollback");
assert.equal(protectedTags.has("v1.1.3"), true, "A release without GitHub binary backups is retained");
assert.equal(protectedTags.has("v1.1.6"), false);
assert.equal(
  selectProtectedAndroidTags(["v1.1.8", "v1.1.9"], "v1.1.9").has("v1.1.8"),
  true,
  "The newest two published local release versions stay available after an upgrade",
);

const storageRetentionSource = readFileSync(new URL("../cleanup-supabase-storage.mjs", import.meta.url), "utf8");
assert.equal(getReferenceOrderColumn("youtube_feed_cache"), "video_id");
assert.equal(getReferenceOrderColumn("social_platform_profiles"), "platform");
assert.equal(getReferenceOrderColumn("content_library"), "id");
assert.throws(() => getReferenceOrderColumn("unknown_table"), /No deterministic primary-key order/);
const orderMapStart = storageRetentionSource.indexOf("const REFERENCE_ORDER_COLUMNS = Object.freeze({");
const orderMapEnd = storageRetentionSource.indexOf("});", orderMapStart);
const orderMapSource = orderMapStart >= 0 && orderMapEnd > orderMapStart
  ? storageRetentionSource.slice(orderMapStart, orderMapEnd)
  : "";
const referenceTables = [...storageRetentionSource.matchAll(/table: "([^"]+)"/g)].map((match) => match[1]);
for (const table of new Set(referenceTables)) {
  assert.ok(orderMapSource.includes(`${table}:`), `reference inventory table ${table} must declare a stable primary-key ordering`);
}
assert.match(storageRetentionSource, /pattern\.filter\(query\)\.order\(orderColumn, \{ ascending: true \}\)/);
assert.match(storageRetentionSource, /from\("content_library"\)[\s\S]*?order\("id", \{ ascending: true \}\)[\s\S]*?range/);
const inventoryStart = storageRetentionSource.indexOf("const [queueRows, requestRows, videoFiles, androidRoot]");
const inventoryEnd = storageRetentionSource.indexOf("const requestById =", inventoryStart);
const inventoryBlock = inventoryStart >= 0 && inventoryEnd > inventoryStart
  ? storageRetentionSource.slice(inventoryStart, inventoryEnd)
  : "";
assert.ok(inventoryBlock.includes("collectPaginatedRows"), "queue and request inventories must use complete paginated scans");
assert.match(storageRetentionSource, /table: "social_publish_queue",[\s\S]*?column: "video_url"/);
assert.match(storageRetentionSource, /table: "video_generation_requests",[\s\S]*?column: "video_url"/);
assert.ok(storageRetentionSource.includes("await probeCloudinaryPlayback(candidate.queue.video_url, cloudinaryCloudName)"));
assert.ok(storageRetentionSource.includes("assertRetentionApplyConfirmation(apply, process.env.RETENTION_CONFIRMATION)"));
assert.ok(storageRetentionSource.includes("assertExpectedSupabaseProject(supabaseUrl, process.env.EXPECTED_PROJECT_REF)"));
assert.match(
  storageRetentionSource,
  /table: "videos",[\s\S]*?column: "metadata"[\s\S]*?query\.not\("metadata", "is", null\)/,
  "the public video catalog metadata must be scanned for hidden references before a staging object is deleted",
);
assert.equal(inventoryBlock.includes('.not("video_url", "is", null)'), false, "all queue/request backup references must be inventoried, including rows without a current playback URL");

const retentionWorkflow = readFileSync(".github/workflows/storage-retention.yml", "utf8");
assert.ok(retentionWorkflow.includes("inputs.confirmation == 'DELETE_STAGING_COPIES'"), "destructive cleanup must require typed owner confirmation");
assert.ok(retentionWorkflow.includes("github.event_name == 'workflow_dispatch' && inputs.apply == true"), "destructive cleanup must require manual dispatch");
assert.equal(retentionWorkflow.includes("github.event_name == 'schedule' ||"), false, "scheduled retention runs must never apply deletion");
assert.ok(retentionWorkflow.includes("EXPECTED_PROJECT_REF: zqtssvlvmkzeeyqghqfk"));
assert.ok(retentionWorkflow.includes("RETENTION_CONFIRMATION: ${{ inputs.confirmation }}"));
assert.ok(retentionWorkflow.includes("if: github.ref == 'refs/heads/main'"), "storage retention must only run from canonical main");
assert.ok(retentionWorkflow.includes("ref: main"), "storage retention must check out canonical main before accessing production credentials");

console.log("Supabase Storage retention policy and workflow safety passed.");
