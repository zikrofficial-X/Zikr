import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getConfirmedYoutubeFallbackId,
  resolveVideoMediaUrl,
  resolveVideoThumbnail,
  resolveVideoYoutubeId,
  shouldKeepPublishedVideoAfterMediaPurge,
  shouldRestorePurgedPublishedVideo,
  wasPublishedBeforeMediaPurge,
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

assert.equal(wasPublishedBeforeMediaPurge({ published: true, metadata: {} }), true);
assert.equal(wasPublishedBeforeMediaPurge({ published: false, metadata: { mediaPurgedFromPublished: true } }), true,
  "a repeated purge must preserve the original public state after the catalog row was hidden");
assert.equal(wasPublishedBeforeMediaPurge({ published: false, metadata: { mediaPurgedFromPublished: false } }), false);

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

const restorableGeneral = {
  published: false,
  metadata: {
    generator: "zikr_internal_video_factory",
    mediaState: "purged",
    mediaPurgedFromPublished: true,
    audience: "general",
    automatedVideoQa: { status: "passed" },
  },
};
assert.equal(shouldRestorePurgedPublishedVideo(restorableGeneral), true);

const restorableKids = {
  published: false,
  metadata: {
    ...restorableGeneral.metadata,
    audience: "kids",
    kidsVideoQaStatus: "passed",
  },
};
assert.equal(shouldRestorePurgedPublishedVideo(restorableKids), true);

const kidsQaBlocked = {
  published: false,
  metadata: {
    ...restorableKids.metadata,
    kidsVideoQaStatus: "revalidation_required",
  },
};
assert.equal(shouldRestorePurgedPublishedVideo(kidsQaBlocked), false, "kids videos without passed kids QA must remain hidden");

assert.equal(
  shouldRestorePurgedPublishedVideo({
    published: false,
    metadata: { ...restorableGeneral.metadata, mediaPurgedFromPublished: false },
  }),
  false,
  "videos that were not public before purge must not be auto-restored",
);
assert.equal(
  shouldRestorePurgedPublishedVideo({ published: true, metadata: restorableGeneral.metadata }),
  false,
  "already-public catalog rows do not need a restoration transition",
);
assert.equal(
  shouldRestorePurgedPublishedVideo({
    published: false,
    metadata: { ...restorableGeneral.metadata, audience: "unknown" },
  }),
  false,
  "unknown audience classifications must fail closed",
);

const generatedMustWin = {
  metadata: {
    generator: "zikr_internal_video_factory",
    generatedVideoUrl: "https://res.cloudinary.com/dcuveyab9/video/upload/auto-final-render.mp4",
    sourceVideoUrl: "https://res.cloudinary.com/dcuveyab9/video/upload/source-clip.mp4",
  },
};
assert.equal(
  resolveVideoMediaUrl(generatedMustWin),
  "https://res.cloudinary.com/dcuveyab9/video/upload/auto-final-render.mp4",
  "internal video playback must prefer the finished render over its source clip",
);

const socialPublisher = readFileSync("src/features/social/services/social-publishing.ts", "utf8");
assert.ok(socialPublisher.includes("shouldRestorePurgedPublishedVideo(row)"), "confirmed YouTube sync must consult the prior-publication and QA recovery gate");
assert.ok(socialPublisher.includes("published: true"), "eligible late YouTube fallback sync must restore the previously public catalog row");

console.log("Purged video YouTube fallback contract tests passed.");
