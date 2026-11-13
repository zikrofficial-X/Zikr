import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertCompleteVideoMediaAuditInventory, isBlockingVideoMediaAuditOutcome, VIDEO_MEDIA_AUDIT_SOCIAL_QUEUE_LIMIT } from "../../src/features/videos/services/video-media-audit-outcome";
import { supabaseServerAdminExactCount } from "../../src/lib/supabase/admin-rest";
import { test } from "node:test";
import {
  getConfirmedYoutubeFallbackId,
  isPurgedInternalVideoMedia,
  reconcileYoutubeFallbackMetadata,
  resolveLatestConfirmedYoutubeQueueState,
  resolveVideoMediaUrl,
  resolveVideoThumbnail,
  resolveVideoYoutubeId,
  shouldKeepPublishedVideoAfterMediaPurge,
  shouldRestorePurgedPublishedVideo,
  wasPublishedBeforeMediaPurge,
} from "../../src/features/videos/services/video-media-contract";

assert.doesNotThrow(
  () => assertCompleteVideoMediaAuditInventory(79, 100),
  "the current production inventory fits below both bounded audit limits",
);
assert.throws(
  () => assertCompleteVideoMediaAuditInventory(1000, 100),
  /refusing to report a partial audit/,
  "an inventory that reaches the video query limit must fail before any catalog updates",
);

assert.equal(VIDEO_MEDIA_AUDIT_SOCIAL_QUEUE_LIMIT, 1000, "the social queue audit cap must match Supabase max_rows");
const supabaseConfig = readFileSync("supabase/config.toml", "utf8");
assert.match(supabaseConfig, /max_rows\s*=\s*1000/);
const mediaAuditScript = readFileSync("scripts/jobs/audit-video-media.ts", "utf8");
assert.ok(mediaAuditScript.includes("resolveLatestConfirmedYoutubeQueueState"), "media audit must resolve the latest publication/deletion event, not the first successful row");
assert.ok(mediaAuditScript.includes("reconcileYoutubeFallbackMetadata"), "media audit must clear catalog fallback metadata after an explicit YouTube deletion");
assert.ok(mediaAuditScript.includes("youtubeQueueRowsByRequest"), "media audit must group every queue event for each video-generation request");
assert.match(mediaAuditScript, /supabaseServerAdminExactCount\("videos"\)/);
assert.match(mediaAuditScript, /supabaseServerAdminExactCount\("social_publish_queue"\)/);
assert.match(mediaAuditScript, /social_publish_queue[^\n]*limit=1000/);
assert.doesNotMatch(mediaAuditScript, /social_publish_queue[^\n]*limit=2000/);
assert.ok(mediaAuditScript.includes("isPurgedInternalVideoMedia(row)"), "media audit must recognize an explicit purge tombstone");
assert.ok(mediaAuditScript.includes("const assetUrl = explicitlyPurged ? null : cloudinaryAssetUrl(metadata)"), "purged source URLs must never be probed as active playback masters");
assert.ok(mediaAuditScript.includes('if (explicitlyPurged) mediaState = "purged"'), "media audit must preserve the purge tombstone while reconciling YouTube queue events");
assert.ok(mediaAuditScript.includes('source: explicitlyPurged'), "media audit evidence must distinguish an explicit purge from a missing Cloudinary asset");
assert.ok(mediaAuditScript.includes("row.thumbnail_url, !explicitlyPurged"), "purged rows must not receive a new Cloudinary-derived thumbnail");

assert.throws(
  () => assertCompleteVideoMediaAuditInventory(79, 1000),
  /refusing to report a partial audit/,
  "an inventory that reaches the Supabase PostgREST row cap must fail before any catalog updates",
);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "conflict" }), true);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "error" }), true);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "unavailable" }), true);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "cloudinary_missing", youtubeFallback: false }), true);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "cloudinary_missing", youtubeFallback: true }), false);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "youtube_only" }), false);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "cloudinary_ready" }), false);
assert.equal(isBlockingVideoMediaAuditOutcome({ state: "purged" }), false, "an explicit purge is an intentional terminal state, not an availability failure");

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
assert.equal(isPurgedInternalVideoMedia(confirmed), true, "a purged internal video must retain its explicit tombstone");
assert.equal(
  isPurgedInternalVideoMedia({ ...confirmed, metadata: { ...confirmed.metadata, mediaState: "youtube_fallback" } }),
  false,
  "a confirmed publication recovery may move the row out of the purge tombstone",
);

const publishedQueueRow = {
  status: "published",
  published_at: "2026-11-12T12:00:00.000Z",
  metadata: { platformResults: { youtube: { ok: true, remoteId: id } } },
};
const deletedQueueRow = {
  status: "published",
  published_at: "2026-11-12T12:00:00.000Z",
  metadata: {
    platformResults: { youtube: { ok: true, remoteId: id } },
    platformDeletions: {
      youtube: { status: "deleted", remoteId: id, deletedAt: "2026-11-12T12:01:00.000Z" },
    },
  },
};
const deletedYoutubeState = { status: "deleted", deletedAt: "2026-11-12T12:01:00.000Z" } as const;
assert.deepEqual(resolveLatestConfirmedYoutubeQueueState([publishedQueueRow, deletedQueueRow]), deletedYoutubeState);
assert.deepEqual(resolveLatestConfirmedYoutubeQueueState([deletedQueueRow, publishedQueueRow]), deletedYoutubeState,
  "a confirmed YouTube deletion must win independently of queue row order");
const legacyArrayQueueRow = {
  ...publishedQueueRow,
  metadata: { platformResults: [{ platform: "youtube", ok: true, remoteId: id }] },
};
assert.deepEqual(
  resolveLatestConfirmedYoutubeQueueState([legacyArrayQueueRow]),
  { status: "published", id, publishedAt: publishedQueueRow.published_at },
  "legacy array-shaped platform results must remain readable by the media audit",
);
const republishedQueueRow = {
  status: "published",
  published_at: "2026-11-12T12:02:00.000Z",
  metadata: {
    platformResults: { youtube: { ok: true, remoteId: "newVideo999" } },
    platformDeletions: {
      youtube: { status: "deleted", remoteId: id, deletedAt: "2026-11-12T12:01:00.000Z" },
    },
  },
};
const supersededDeletionRow = {
  status: "published",
  published_at: "2026-11-12T12:00:00.000Z",
  metadata: {
    platformResults: { youtube: { ok: true, remoteId: id } },
    platformDeletions: {
      youtube: { status: "deleted", remoteId: id, deletedAt: "2026-11-12T12:05:00.000Z" },
    },
  },
};
const newerYoutubePublication = {
  status: "published",
  published_at: "2026-11-12T12:04:00.000Z",
  metadata: { platformResults: { youtube: { ok: true, remoteId: "newVideo999" } } },
};
assert.deepEqual(
  resolveLatestConfirmedYoutubeQueueState([supersededDeletionRow, newerYoutubePublication]),
  { status: "published", id: "newVideo999", publishedAt: newerYoutubePublication.published_at },
  "deleting an older remote YouTube ID must not clear a newer confirmed publication",
);
const uncorrelatedDeletionRow = {
  ...publishedQueueRow,
  metadata: {
    ...publishedQueueRow.metadata,
    platformDeletions: {
      youtube: { status: "deleted", deletedAt: "2026-11-12T12:01:00.000Z" },
    },
  },
};
assert.deepEqual(
  resolveLatestConfirmedYoutubeQueueState([uncorrelatedDeletionRow]),
  { status: "conflict" },
  "a legacy deletion without a remote ID must not silently erase a confirmed fallback",
);
assert.deepEqual(
  resolveLatestConfirmedYoutubeQueueState([deletedQueueRow, republishedQueueRow]),
  { status: "published", id: "newVideo999", publishedAt: republishedQueueRow.published_at },
  "a strictly later confirmed republish may restore the YouTube fallback",
);
const tiedDeletionRow = {
  ...publishedQueueRow,
  published_at: "2026-11-12T12:01:00.000Z",
  metadata: {
    ...publishedQueueRow.metadata,
    platformDeletions: {
      youtube: { status: "deleted", remoteId: id, deletedAt: "2026-11-12T12:01:00.000Z" },
    },
  },
};
assert.deepEqual(
  resolveLatestConfirmedYoutubeQueueState([tiedDeletionRow, publishedQueueRow]),
  deletedYoutubeState,
  "a deletion at the exact publication timestamp must win",
);
const clearedFallbackMetadata = reconcileYoutubeFallbackMetadata(confirmed.metadata, deletedYoutubeState);
assert.equal(clearedFallbackMetadata.mediaFallbackAvailable, false);
assert.equal(clearedFallbackMetadata.youtubePublishedVideoId, null);
assert.equal(clearedFallbackMetadata.youtubePublishedUrl, null);
assert.equal(clearedFallbackMetadata.youtubePublishedAt, null);
assert.equal(
  getConfirmedYoutubeFallbackId({ ...confirmed, metadata: clearedFallbackMetadata }),
  null,
  "an explicitly deleted YouTube publication must no longer be accepted as a public media fallback",
);


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
    youtubePublishedUrl: "https://not-youtube.test/watch?v=5pob7O7rLnU",
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


const kidsVideoService = readFileSync("src/features/videos/services/videos.ts", "utf8");
const kidsListStart = kidsVideoService.indexOf("export async function getKidsGeneratedVideos");
const kidsListEnd = kidsVideoService.indexOf("const VIDEO_GENERATION_REQUEST_ID_PATTERN", kidsListStart);
assert.ok(kidsListStart >= 0 && kidsListEnd > kidsListStart, "Kids video list query must remain in its dedicated service");
const kidsListSource = kidsVideoService.slice(kidsListStart, kidsListEnd);
for (const filter of [
  "published=eq.true",
  "metadata->>audience=eq.kids",
  "metadata->>generator=eq.zikr_internal_video_factory",
  "metadata->>kidsVideoQaStatus=eq.passed",
  "metadata->automatedVideoQa->>status=eq.passed",
]) {
  assert.ok(kidsListSource.includes(filter), "Kids list must apply the " + filter + " eligibility filter before its row limit");
}
assert.ok(kidsListSource.includes('{ cache: "no-store" }'), "Kids publication changes must not remain hidden behind the generic 15-minute Supabase read cache");
assert.ok(
  kidsListSource.indexOf("metadata->automatedVideoQa->>status=eq.passed") < kidsListSource.indexOf("&order=created_at.desc&limit="),
  "QA eligibility must be applied by PostgREST before the candidate limit so rejected rows cannot crowd out valid episodes",
);

console.log("Purged video YouTube fallback contract tests passed.");


test("exact Supabase inventory counts require a numeric Content-Range", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";

  try {
    globalThis.fetch = (async (input, init) => {
      assert.equal(String(input), "https://supabase.test/rest/v1/social_publish_queue?select=id&limit=1");
      assert.equal(init?.method, "HEAD");
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("prefer"), "count=exact");
      assert.equal(headers.get("range"), "0-0");
      return new Response(null, { status: 200, headers: { "content-range": "0-0/1001" } });
    }) as typeof fetch;
    assert.equal(await supabaseServerAdminExactCount("social_publish_queue"), 1001);

    globalThis.fetch = (async () => new Response(null, { status: 200 })) as typeof fetch;
    await assert.rejects(
      () => supabaseServerAdminExactCount("social_publish_queue"),
      /exact Content-Range/,
      "a missing count header must never be interpreted as a one-row table",
    );
    await assert.rejects(
      () => supabaseServerAdminExactCount("social_publish_queue;drop"),
      /Invalid table name/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});
