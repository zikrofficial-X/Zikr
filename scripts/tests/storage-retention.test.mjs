import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  compareSemverTags,
  extractManagedVideoPath,
  extractCloudinaryVideoPublicId,
  hasConfirmedPlatformResults,
  isEligiblePublishedQueueItem,
  selectProtectedAndroidTags,
} from "../cleanup-supabase-storage.mjs";

const supabaseUrl = "https://zqtssvlvmkzeeyqghqfk.supabase.co";
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

const targets = ["youtube", "facebook_reels"];
const goodMetadata = {
  platformResults: {
    youtube: { ok: true, remoteId: "youtube-id-123" },
    facebook_reels: { ok: true, remoteId: "facebook-id-456" },
  },
};
assert.equal(hasConfirmedPlatformResults(targets, goodMetadata), true);
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
assert.equal(isEligiblePublishedQueueItem(publishedCandidate, cutoff, supabaseUrl, "dcuveyab9"), true);
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

const retentionWorkflow = readFileSync(".github/workflows/storage-retention.yml", "utf8");
assert.ok(retentionWorkflow.includes("inputs.confirmation == 'DELETE_STAGING_COPIES'"), "destructive cleanup must require typed owner confirmation");
assert.ok(retentionWorkflow.includes("github.event_name == 'workflow_dispatch' && inputs.apply == true"), "destructive cleanup must require manual dispatch");
assert.equal(retentionWorkflow.includes("github.event_name == 'schedule' ||"), false, "scheduled retention runs must never apply deletion");
assert.ok(retentionWorkflow.includes("if: github.ref == 'refs/heads/main'"), "storage retention must only run from canonical main");
assert.ok(retentionWorkflow.includes("ref: main"), "storage retention must check out canonical main before accessing production credentials");

console.log("Supabase Storage retention policy and workflow safety passed.");
