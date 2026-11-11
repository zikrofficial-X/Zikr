import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCloudinaryVideoUrl } from "../../src/features/videos/services/video-media-url";

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
    "https://example.com/video.mp4",
    "https://localhost/video.mp4",
    "http://127.0.0.1/video.mp4",
    "http://169.254.169.254/latest/meta-data",
    "https://res.cloudinary.com.evil.example/zikr/video/upload/episode.mp4",
    "https://user:pass@res.cloudinary.com/zikr/video/upload/episode.mp4",
  ]) {
    assert.throws(() => assertCloudinaryVideoUrl(url, "Facebook"), url);
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
