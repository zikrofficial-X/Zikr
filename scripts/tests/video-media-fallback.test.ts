import assert from "node:assert/strict";
import {
  getConfirmedYoutubeFallbackId,
  resolveVideoMediaUrl,
  resolveVideoThumbnail,
  resolveVideoYoutubeId,
  shouldKeepPublishedVideoAfterMediaPurge,
} from "../../src/features/videos/services/video-media-contract";

const id = "5pob7O7rLnU";
const confirmed = {
  id: "video-1",
  published: true,
  youtube_id: id,
  thumbnail_url: "https://res.cloudinary.com/dcuveyab9/image/upload/video-poster.jpg",
  metadata: {
    generator: "zikr_internal_video_factory",
    mediaState: "purged",
    mediaFallbackAvailable: true,
    youtubePublishedVideoId: id,
    youtubePublishedUrl: "https://www.youtube.com/watch?v=5pob7O7rLnU",
    sourceVideoUrl: "https://res.cloudinary.com/dcuveyab9/video/upload/auto-stale-source.mp4",
    generatedVideoUrl: null,
    videoUrl: null,
  },
};

assert.equal(getConfirmedYoutubeFallbackId(confirmed), id);
assert.equal(resolveVideoYoutubeId(confirmed), id);
assert.equal(
  resolveVideoMediaUrl(confirmed),
  "https://www.youtube.com/watch?v=5pob7O7rLnU",
  "purged internal video must use the confirmed YouTube fallback instead of stale Cloudinary source media",
);
assert.equal(
  resolveVideoThumbnail(confirmed, "/og-default.png"),
  "https://i.ytimg.com/vi/5pob7O7rLnU/hqdefault.jpg",
  "purged internal video thumbnail must use the confirmed YouTube poster instead of a stale Cloudinary poster",
);
assert.equal(shouldKeepPublishedVideoAfterMediaPurge(confirmed, true), true);
assert.equal(shouldKeepPublishedVideoAfterMediaPurge(confirmed, false), false);

const unconfirmed = {
  ...confirmed,
  metadata: {
    ...confirmed.metadata,
    mediaFallbackAvailable: false,
  },
};
assert.equal(getConfirmedYoutubeFallbackId(unconfirmed), null);
assert.equal(resolveVideoYoutubeId(unconfirmed), null);
assert.equal(resolveVideoMediaUrl(unconfirmed), null, "an unconfirmed row.youtube_id must not be used after purge");
assert.equal(resolveVideoThumbnail(unconfirmed, "/og-default.png"), "/og-default.png");
assert.equal(shouldKeepPublishedVideoAfterMediaPurge(unconfirmed, true), false);

const mismatchedUrl = {
  ...confirmed,
  metadata: {
    ...confirmed.metadata,
    youtubePublishedUrl: "https://www.youtube.com/watch?v=anotherId1",
  },
};
assert.equal(getConfirmedYoutubeFallbackId(mismatchedUrl), null, "fallback URL and recorded remote ID must match");
assert.equal(shouldKeepPublishedVideoAfterMediaPurge(mismatchedUrl, true), false);

const invalidId = {
  ...confirmed,
  metadata: {
    ...confirmed.metadata,
    youtubePublishedVideoId: "not a video id",
  },
};
assert.equal(getConfirmedYoutubeFallbackId(invalidId), null);

const notPublished = { ...confirmed, published: false };
assert.equal(shouldKeepPublishedVideoAfterMediaPurge(notPublished, true), false);

const nonYoutubeUrl = {
  ...confirmed,
  metadata: {
    ...confirmed.metadata,
    youtubePublishedUrl: "https://example.com/watch?v=5pob7O7rLnU",
  },
};
assert.equal(getConfirmedYoutubeFallbackId(nonYoutubeUrl), null);

console.log("Purged video YouTube fallback contract tests passed.");
