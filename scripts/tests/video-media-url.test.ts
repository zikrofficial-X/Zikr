import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertCloudinaryVideoUrl,
  isGeneratedCloudinaryVideoUrl,
} from "../../src/features/videos/services/video-media-url";

test("accepts HTTPS Cloudinary video delivery URLs", () => {
  const url = "https://res.cloudinary.com/zikr/video/upload/v123456/auto-episode.mp4";
  assert.equal(assertCloudinaryVideoUrl(url, "YouTube"), url);
});

test("rejects non-HTTPS Cloudinary media URLs", () => {
  assert.throws(
    () => assertCloudinaryVideoUrl("http://res.cloudinary.com/zikr/video/upload/v123/episode.mp4", "YouTube"),
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
    assert.throws(() => assertCloudinaryVideoUrl(url, "Facebook"), /Cloudinary|HTTPS/);
  }
});

test("rejects Cloudinary images and non-video delivery paths", () => {
  assert.throws(
    () => assertCloudinaryVideoUrl("https://res.cloudinary.com/zikr/image/upload/cover.jpg", "Facebook"),
    /video\/upload/,
  );
});

test("rejects YouTube watch and embed URLs as upload sources", () => {
  assert.throws(
    () => assertCloudinaryVideoUrl("https://www.youtube.com/watch?v=abc123", "YouTube"),
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
