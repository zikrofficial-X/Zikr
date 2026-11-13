import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getConfirmedPublicKidsVideoSocialPlatforms, resolveKidsVideoSocialPublication } from "../../src/features/social/services/kids-video-social-visibility";
import {
  buildKidsSeriesEpisode,
  KIDS_SERIES_EPISODES_PER_SEASON,
  KIDS_VIDEO_SERIES,
  validateCanonicalKidsEpisodeSnapshot,
  validateGeneratedKidsEpisode,
} from "../../src/features/videos/data/kids-story-factory";

assert.equal(KIDS_VIDEO_SERIES.length, 4, "the catalog must expose four distinct child-friendly series");
assert.equal(KIDS_SERIES_EPISODES_PER_SEASON, 24, "the first catalog season must contain six episodes per series");

const firstSeason = Array.from({ length: 24 }, (_, index) => buildKidsSeriesEpisode(index + 1));
assert.equal(new Set(firstSeason.map((episode) => episode.sourceId)).size, 24, "source IDs must be unique");
assert.equal(new Set(firstSeason.map((episode) => episode.seriesId)).size, 4, "all series must be represented");
for (const series of KIDS_VIDEO_SERIES) {
  const episodes = firstSeason.filter((episode) => episode.seriesId === series.id);
  assert.equal(episodes.length, 6, "each series must contain six first-season episodes");
  assert.deepEqual(episodes.map((episode) => episode.episodeNumber).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
}

for (let sequence = 1; sequence <= 1000; sequence += 1) {
  const episode = buildKidsSeriesEpisode(sequence);
  const result = validateGeneratedKidsEpisode(episode);
  assert.equal(result.ok, true, "episode " + sequence + " failed: " + result.errors.join(" | "));
  const canonicalSnapshot = validateCanonicalKidsEpisodeSnapshot({
    factorySequence: sequence,
    sourceId: episode.sourceId,
    text: episode.text.normalize("NFD"),
    seriesId: episode.seriesId,
    seasonNumber: episode.seasonNumber,
    episodeNumber: episode.episodeNumber,
    learningObjective: episode.learningObjective,
  });
  assert.equal(canonicalSnapshot.ok, true, "normalized canonical snapshot " + sequence + " failed: " + canonicalSnapshot.errors.join(" | "));
  assert.ok(episode.text.length >= 180 && episode.text.length <= 1500, "episode narration must be short enough for QA");
  assert.ok(episode.learningObjective.trim(), "every episode must have an explicit learning objective");
  assert.ok(episode.title.includes("الموسم " + episode.seasonNumber), "titles must expose season numbers");
  assert.ok(episode.title.includes("الحلقة " + episode.episodeNumber), "titles must expose episode numbers");
  assert.equal(episode.generationMode, "free_deterministic_story_factory");
}
assert.notEqual(buildKidsSeriesEpisode(1).text, buildKidsSeriesEpisode(25).text, "later seasons must vary the story narration");
assert.notEqual(buildKidsSeriesEpisode(1).sourceId, buildKidsSeriesEpisode(25).sourceId, "later seasons must not reuse episode IDs");
const invalidEpisode = buildKidsSeriesEpisode(1);
const invalidSnapshot = validateCanonicalKidsEpisodeSnapshot({
  factorySequence: 1,
  sourceId: invalidEpisode.sourceId,
  text: invalidEpisode.text + " نص مضاف",
  seriesId: invalidEpisode.seriesId,
  seasonNumber: invalidEpisode.seasonNumber,
  episodeNumber: invalidEpisode.episodeNumber,
  learningObjective: invalidEpisode.learningObjective,
});
assert.equal(invalidSnapshot.ok, false, "mutated stored story text must be rejected");
assert.ok(invalidSnapshot.errors.some((error) => error.includes("narration")), "the mismatch must identify the story field");
for (const [hour, expected] of [[3, 3], [9, 6], [15, 9], [21, 12]] as const) {
  const window = Math.min(4, Math.max(1, Math.floor(hour / 6) + 1));
  assert.equal(Math.ceil((12 * window) / 4), expected, "the six-hour schedule must release its expected quota at " + hour + " UTC");
}
const automationSource = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");
const genericStoryStart = automationSource.indexOf('key = `story:${day}:${slot}`');
const kidsSeriesStart = automationSource.indexOf('key = `kids-series:${day}:${slot}`');
assert.ok(genericStoryStart >= 0 && kidsSeriesStart > genericStoryStart, "generic story and Kids series automation branches must remain distinct");
const genericStoryBranch = automationSource.slice(genericStoryStart, kidsSeriesStart);
assert.match(genericStoryBranch, /audience:\s*"general"/, "verified public story sources must not be misclassified as Kids series episodes");
const kidsSeriesEnd = automationSource.indexOf("const reminders =", kidsSeriesStart);
assert.ok(kidsSeriesEnd > kidsSeriesStart, "Kids series branch must end before general reminder seeding");
const kidsSeriesBranch = automationSource.slice(kidsSeriesStart, kidsSeriesEnd);
assert.match(kidsSeriesBranch, /audience:\s*"kids"/, "only the canonical Kids series factory may seed Kids-audience video requests");
assert.match(kidsSeriesBranch, /generationMode:\s*episode\.generationMode/, "Kids series requests must retain their deterministic factory provenance");

// Social deletion state belongs to the exact remote post on its queue row.
 // Deleting an older Facebook post must not hide a newer live post for the same
 // generated Kids video, even when the old deletion timestamp is later.
const kidsVideoQueueRow = (
  id: string,
  publishedAt: string,
  remoteId: string,
  extraMetadata: Record<string, unknown> = {},
) => ({
  id,
  content_id: "60000000-0000-4000-8000-000000000001",
  content_type: "kids_story_video",
  body: null,
  target_platforms: ["facebook"],
  status: "published",
  published_at: publishedAt,
  created_at: publishedAt,
  metadata: {
    audience: "kids",
    platformResults: { facebook: { ok: true, remoteId } },
    ...extraMetadata,
  },
});

const newerKidsPublication = kidsVideoQueueRow(
  "50000000-0000-4000-8000-000000000002",
  "2026-11-10T12:00:00.000Z",
  "new-facebook-post",
);
const olderDeletedKidsPublication = kidsVideoQueueRow(
  "50000000-0000-4000-8000-000000000001",
  "2026-11-09T10:00:00.000Z",
  "old-facebook-post",
  {
    platformDeletions: {
      facebook: {
        status: "deleted",
        remoteId: "old-facebook-post",
        deletedAt: "2026-11-11T10:00:00.000Z",
      },
    },
  },
);
assert.deepEqual(
  resolveKidsVideoSocialPublication(
    [newerKidsPublication, olderDeletedKidsPublication],
    null,
    true,
  ),
  {
    status: "published",
    platforms: ["facebook"],
    publishedAt: "2026-11-10T12:00:00.000Z",
  },
  "deleting an older remote post must not tombstone a newer live post on the same platform",
);

const failedQueueRowWithHistoricalSuccess = {
  ...newerKidsPublication,
  status: "failed",
};
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms(failedQueueRowWithHistoricalSuccess),
  [],
  "a failed queue row must not expose an old successful provider result as a current publication",
);
assert.equal(
  resolveKidsVideoSocialPublication([failedQueueRowWithHistoricalSuccess], null, true),
  null,
  "a failed queue row with a stale published_at and prior success must not create a public social badge",
);
assert.deepEqual(
  resolveKidsVideoSocialPublication([newerKidsPublication, failedQueueRowWithHistoricalSuccess], null, true),
  {
    status: "published",
    platforms: ["facebook"],
    publishedAt: "2026-11-10T12:00:00.000Z",
  },
  "a newer failed retry must not hide the older confirmed publication",
);

const olderFacebookPublication = kidsVideoQueueRow(
  "50000000-0000-4000-8000-000000000003",
  "2026-11-09T10:00:00.000Z",
  "old-facebook-post",
);
const supplementalFacebookDeletion = {
  id: "50000000-0000-4000-8000-000000000005",
  content_id: "60000000-0000-4000-8000-000000000001",
  content_type: "kids_story_video",
  body: null,
  target_platforms: ["facebook"],
  status: "partial",
  published_at: null,
  created_at: "2026-11-11T10:00:00.000Z",
  metadata: {
    audience: "kids",
    platformDeletions: {
      facebook: {
        status: "deleted",
        remoteId: "old-facebook-post",
        deletedAt: "2026-11-11T10:00:00.000Z",
      },
    },
  },
};
assert.equal(
  resolveKidsVideoSocialPublication([olderFacebookPublication, supplementalFacebookDeletion], null, true),
  null,
  "a supplemental deletion must suppress the exact older remote post even when its result is stored on another queue row",
);

const republishedOnSameQueueRow = kidsVideoQueueRow(
  "50000000-0000-4000-8000-000000000004",
  "2026-11-12T12:00:00.000Z",
  "replacement-facebook-post",
  {
    platformDeletions: {
      facebook: {
        status: "deleted",
        remoteId: "old-facebook-post",
        deletedAt: "2026-11-13T10:00:00.000Z",
      },
    },
  },
);
assert.deepEqual(
  resolveKidsVideoSocialPublication([republishedOnSameQueueRow], null, true),
  {
    status: "published",
    platforms: ["facebook"],
    publishedAt: "2026-11-12T12:00:00.000Z",
  },
  "a new remote ID on the same queue row must remain visible after the old remote post is deleted",
);

console.log("✅ Kids video series: four series, 24 first-season episodes, 1,000 validated episode variants, and scheduled quota and social publication checks passed.");
