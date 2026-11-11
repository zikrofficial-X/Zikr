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
  assert.match(auditScript, /result\.state === "unavailable"/);
  assert.match(auditScript, /published_at: string \| null/);
  assert.match(auditScript, /youtubePublishedVideoId: queueYouTubeId/);
  assert.match(auditScript, /youtubePublishedUrl: "https:\/\/www\.youtube\.com\/watch\?v="/);
  assert.match(auditScript, /mediaFallbackAvailable: true/);
  assert.match(auditScript, /youtubePublicationsByRequest/);

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
