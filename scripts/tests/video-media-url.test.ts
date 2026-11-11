import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  assertCloudinaryVideoUrl,
  isGeneratedCloudinaryVideoUrl,
} from "../../src/features/videos/services/video-media-url";
import { resolveVideoMediaUrl, resolveVideoThumbnail } from "../../src/features/videos/services/video-media-contract";

const assertForZikrCloudinaryVideoUrl = (url: string, target: string) =>
  assertCloudinaryVideoUrl(url, target, "zikr");

test("accepts HTTPS Cloudinary video delivery URLs", () => {
  const url = "https://res.cloudinary.com/zikr/video/upload/v123456/auto-episode.mp4";
  assert.equal(assertForZikrCloudinaryVideoUrl(url, "YouTube"), url);
});

test("rejects Cloudinary assets from a different tenant or missing configured cloud", () => {
  const url = "https://res.cloudinary.com/other-cloud/video/upload/v123/auto-episode.mp4";
  assert.throws(() => assertCloudinaryVideoUrl(url, "YouTube", "zikr"), /configured Cloudinary cloud/);
  assert.throws(
    () => assertCloudinaryVideoUrl("https://res.cloudinary.com/zikr/video/upload/v123/auto-episode.mp4", "YouTube", ""),
    /configured Cloudinary cloud/,
  );
});

test("rejects non-HTTPS Cloudinary media URLs", () => {
  assert.throws(
    () => assertForZikrCloudinaryVideoUrl("http://res.cloudinary.com/zikr/video/upload/v123/episode.mp4", "YouTube"),
    /requires HTTPS/,
  );
});

test("rejects arbitrary external hosts and SSRF targets", () => {
  for (const url of [
    "https://not-cloudinary.test/video.mp4",
    "https://localhost/video.mp4",
    "http://127.0.0.1/video.mp4",
    "https://127.0.0.1/zikr/video/upload/episode.mp4",
    "http://169.254.169.254/latest/meta-data",
    "https://res.cloudinary.com.evil.test/zikr/video/upload/episode.mp4",
    "https://user:pass@res.cloudinary.com/zikr/video/upload/episode.mp4",
  ]) {
    assert.throws(() => assertForZikrCloudinaryVideoUrl(url, "Facebook"), /Cloudinary|HTTPS/);
  }
});

test("rejects Cloudinary images and non-video delivery paths", () => {
  assert.throws(
    () => assertForZikrCloudinaryVideoUrl("https://res.cloudinary.com/zikr/image/upload/cover.jpg", "Facebook"),
    /video\/upload/,
  );
});

test("rejects YouTube watch and embed URLs as upload sources", () => {
  assert.throws(
    () => assertForZikrCloudinaryVideoUrl("https://www.youtube.com/watch?v=abc123", "YouTube"),
    /trusted Cloudinary/,
  );
});


test("protects generated Cloudinary MP4 references with transformation segments", () => {
  const direct = "https://res.cloudinary.com/zikr/video/upload/v123456/auto-episode.mp4";
  const transformed = "https://res.cloudinary.com/zikr/video/upload/f_auto,q_auto/v123456/auto-episode.mp4";
  const transformedWithoutVersion = "https://res.cloudinary.com/zikr/video/upload/q_auto/auto-episode.mp4";

  assert.equal(isGeneratedCloudinaryVideoUrl(direct, "zikr"), true);
  assert.equal(isGeneratedCloudinaryVideoUrl(transformed, "zikr"), true);
  assert.equal(isGeneratedCloudinaryVideoUrl(transformedWithoutVersion, "zikr"), true);
  assert.equal(isGeneratedCloudinaryVideoUrl(direct, "another-cloud"), false);
  assert.equal(isGeneratedCloudinaryVideoUrl(direct.replace(".mp4", ".jpg"), "zikr"), false);
  assert.equal(isGeneratedCloudinaryVideoUrl("https://evil.example/video/upload/auto-episode.mp4", "zikr"), false);
});

test("scheduled media audit avoids checkedAt-only database writes and reports unavailable published videos", () => {
  const auditScript = readFileSync("scripts/jobs/audit-video-media.ts", "utf8");
  assert.match(auditScript, /function comparableMediaAudit\(value: unknown\)/);
  assert.match(auditScript, /JSON\.stringify\(comparableMediaAudit\(nextMetadata\.mediaAudit\)\)/);
  assert.match(auditScript, /const needsUpdate = mediaStateChanged \|\| mediaAuditChanged/);
  const auditOutcome = readFileSync("src/features/videos/services/video-media-audit-outcome.ts", "utf8");
  assert.match(auditScript, /supabaseServerAdminExactCount\("videos"\)/);
  assert.match(auditScript, /supabaseServerAdminExactCount\("social_publish_queue"\)/);
  assert.match(auditScript, /assertCompleteVideoMediaAuditInventory\(videoTableCount, socialQueueTableCount\)/);
  assert.match(auditScript, /social_publish_queue[^\n]*limit=1000/);
  assert.match(auditScript, /const blockingResults = results\.filter\(isBlockingVideoMediaAuditOutcome\)/);
  assert.match(auditScript, /process\.exitCode = 1/);
  assert.match(auditOutcome, /result\.state === "unavailable"/);
  assert.match(auditOutcome, /result\.state === "conflict"/);
  assert.match(auditScript, /published_at: string \| null/);
  assert.match(auditScript, /youtubePublishedVideoId: queueYouTubeId/);
  assert.match(auditScript, /youtubePublishedUrl: "https:\/\/www\.youtube\.com\/watch\?v="/);
  assert.match(auditScript, /mediaFallbackAvailable: true/);
  assert.match(auditScript, /getConfirmedYoutubeFallbackId\(\{/);
  assert.match(auditScript, /youtubeFallback: hasConfirmedYoutubeFallback/);
  assert.doesNotMatch(auditScript, /youtubeFallback: Boolean\(youtubeId\)/);
  assert.match(auditScript, /catalog_row_missing_updated_at_for_compare_and_set/);
  assert.match(auditScript, /catalog_row_changed_during_media_audit/);
  assert.match(auditScript, /const updatedAt = row\.updated_at/);
  assert.match(auditScript, /youtubePublicationsByRequest/);
  assert.match(auditScript, /status=in\.\(published,partial\)/);
  assert.match(auditScript, /!\["published", "partial"\]\.includes\(row\.status\)/);
  assert.match(auditScript, /else if \(!assetUrl && queueYouTubeId\) mediaState = "youtube_only"/);
  assert.match(auditScript, /else if \(!assetUrl\) mediaState = "unavailable"/);
  assert.match(auditScript, /thumbnailFor\(metadata, queueYouTubeId, row\.thumbnail_url\)/);

});

test("internal video catalog IDs are never trusted without publisher confirmation", () => {
  const internal = {
    youtube_id: "abc123xyz_1",
    metadata: {
      generator: "zikr_internal_video_factory",
      mediaState: "cloudinary_ready",
      generatedVideoUrl: "https://res.cloudinary.com/zikr/video/upload/auto-ready.mp4",
    },
  };
  assert.equal(resolveVideoMediaUrl(internal), "https://res.cloudinary.com/zikr/video/upload/auto-ready.mp4");
  assert.equal(resolveVideoThumbnail(internal, "/branding/og-image.jpg"), "https://res.cloudinary.com/zikr/video/upload/so_0/auto-ready.jpg");
});

test("missing internal masters use only publisher-confirmed YouTube fallbacks", () => {
  const unconfirmed = {
    youtube_id: "unverified123",
    thumbnail_url: "https://res.cloudinary.com/zikr/video/upload/so_0/auto-missing.jpg",
    metadata: {
      generator: "zikr_internal_video_factory",
      mediaState: "cloudinary_missing",
      generatedVideoUrl: "https://res.cloudinary.com/zikr/video/upload/auto-missing.mp4",
    },
  };
  assert.equal(resolveVideoMediaUrl(unconfirmed), null);
  assert.equal(resolveVideoThumbnail(unconfirmed, "/branding/og-image.jpg"), "/branding/og-image.jpg");

  const confirmed = {
    ...unconfirmed,
    youtube_id: "abc123xyz_1",
    metadata: {
      ...unconfirmed.metadata,
      mediaFallbackAvailable: true,
      youtubePublishedVideoId: "abc123xyz_1",
      youtubePublishedUrl: "https://www.youtube.com/watch?v=abc123xyz_1",
    },
  };
  assert.equal(resolveVideoMediaUrl(confirmed), "https://www.youtube.com/watch?v=abc123xyz_1");
  assert.equal(resolveVideoThumbnail(confirmed, "/branding/og-image.jpg"), "https://i.ytimg.com/vi/abc123xyz_1/hqdefault.jpg");
  const youtubeOnlyWithoutConfirmation = {
    ...unconfirmed,
    metadata: {
      ...unconfirmed.metadata,
      mediaState: "youtube_only",
    },
  };
  assert.equal(resolveVideoMediaUrl(youtubeOnlyWithoutConfirmation), null);
  assert.equal(resolveVideoThumbnail(youtubeOnlyWithoutConfirmation, "/branding/og-image.jpg"), "/branding/og-image.jpg");
});

test("confirmed YouTube fallback covers every unavailable internal-media state", () => {
  const youtubeId = "abc123xyz_1";
  const youtubeUrl = "https://www.youtube.com/watch?v=" + youtubeId;
  for (const mediaState of ["cloudinary_missing", "unavailable", "youtube_only", "purged"]) {
    const row = {
      youtube_id: null,
      metadata: {
        generator: "zikr_internal_video_factory",
        mediaState,
        generatedVideoUrl: "https://res.cloudinary.com/zikr/video/upload/auto-stale.mp4",
        sourceVideoUrl: "https://res.cloudinary.com/zikr/video/upload/auto-stale-source.mp4",
        mediaFallbackAvailable: true,
        youtubePublishedVideoId: youtubeId,
        youtubePublishedUrl: youtubeUrl,
      },
    };
    assert.equal(resolveVideoMediaUrl(row), youtubeUrl, `confirmed YouTube fallback for ${mediaState}`);
  }
});

test("purged internal Kids videos never fall back to stale Cloudinary source URLs", () => {
  const purgedVideo = {
    youtube_id: null,
    metadata: {
      generator: "zikr_internal_video_factory",
      mediaState: "purged",
      generatedVideoUrl: null,
      videoUrl: null,
      sourceVideoUrl: "https://res.cloudinary.com/zikr/video/upload/v123456/auto-episode.mp4",
    },
  };
  assert.equal(resolveVideoMediaUrl(purgedVideo), null);

  const kidsDetailPage = readFileSync("src/app/kids/videos/[slug]/page.tsx", "utf8");
  assert.match(kidsDetailPage, /resolveVideoMediaUrl\(/);
  assert.doesNotMatch(
    kidsDetailPage,
    /const candidate = \[metadata\.generatedVideoUrl, metadata\.videoUrl, metadata\.video_url, metadata\.sourceVideoUrl\]/,
    "Kids detail playback must use the canonical media-state resolver instead of stale metadata candidates",
  );
});
