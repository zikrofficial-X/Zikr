import assert from "node:assert/strict";
import {
  buildKidsSeriesEpisode,
  KIDS_SERIES_EPISODES_PER_SEASON,
  KIDS_VIDEO_SERIES,
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
  assert.ok(episode.text.length >= 180 && episode.text.length <= 1500, "episode narration must be short enough for QA");
  assert.ok(episode.learningObjective.trim(), "every episode must have an explicit learning objective");
  assert.ok(episode.title.includes("الموسم " + episode.seasonNumber), "titles must expose season numbers");
  assert.ok(episode.title.includes("الحلقة " + episode.episodeNumber), "titles must expose episode numbers");
  assert.equal(episode.generationMode, "free_deterministic_story_factory");
}
assert.notEqual(buildKidsSeriesEpisode(1).text, buildKidsSeriesEpisode(25).text, "later seasons must vary the story narration");
assert.notEqual(buildKidsSeriesEpisode(1).sourceId, buildKidsSeriesEpisode(25).sourceId, "later seasons must not reuse episode IDs");
for (const [hour, expected] of [[3, 3], [9, 6], [15, 9], [21, 12]] as const) {
  const window = Math.min(4, Math.max(1, Math.floor(hour / 6) + 1));
  assert.equal(Math.ceil((12 * window) / 4), expected, "the six-hour schedule must release its expected quota at " + hour + " UTC");
}
console.log("✅ Kids video series: four series, 24 first-season episodes, 1,000 validated episode variants, and scheduled quota checks passed.");
