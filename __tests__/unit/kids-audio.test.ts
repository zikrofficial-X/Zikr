import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY_KIDS_PROGRESS,
  getEarnedKidsAchievements,
  KIDS_AUDIO_TRACKS,
  KIDS_ACHIEVEMENTS,
  normalizeKidsProgress,
} from '../../lib/data/kids-audio';

test('kids audio library contains stories, nasheeds, and adhkar', () => {
  const categories = new Set(KIDS_AUDIO_TRACKS.map(track => track.category));
  assert.deepEqual([...categories].sort(), ['dhikr', 'nasheed', 'story']);
  assert.ok(KIDS_AUDIO_TRACKS.every(track => track.transcript.length > 0));
});

test('kids progress normalization removes invalid values', () => {
  const progress = normalizeKidsProgress({
    stars: -4.7,
    listenedTrackIds: ['one', 2, 'two'],
    recordingCount: Number.POSITIVE_INFINITY,
    completedActivities: 2.9,
  });

  assert.deepEqual(progress, {
    stars: 0,
    listenedTrackIds: ['one', 'two'],
    recordingCount: 0,
    completedActivities: 2,
  });
  assert.deepEqual(normalizeKidsProgress(null), EMPTY_KIDS_PROGRESS);
});

test('kids achievements unlock from stars and activity milestones', () => {
  const earned = getEarnedKidsAchievements({
    stars: 20,
    listenedTrackIds: KIDS_AUDIO_TRACKS.slice(0, 3).map(track => track.id),
    recordingCount: 1,
    completedActivities: 8,
  });
  const ids = new Set(earned.map(achievement => achievement.id));

  assert.ok(ids.has('first-star'));
  assert.ok(ids.has('kind-heart'));
  assert.ok(ids.has('story-listener'));
  assert.ok(ids.has('dhikr-voice'));
  assert.ok(ids.has('adventure-finished'));
  assert.ok(ids.has('bright-path'));
  assert.equal(earned.length, KIDS_ACHIEVEMENTS.length);
});
