import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isValidQuranPosition,
  toAbsoluteAyah,
  fromAbsoluteAyah,
  ayahsReadFromPosition,
  percentComplete,
} from '../../src/features/quran/utils/quran-progress';
import {
  DEFAULT_WIRD_PROGRESS_STATE,
  normalizeWirdProgressState,
} from '../../src/features/wird/utils/progress-validation';

assert.equal(isValidQuranPosition(1, 1), true);
assert.equal(isValidQuranPosition(1, 7), true);
assert.equal(isValidQuranPosition(1, 8), false, 'Al-Fatiha must not accept an ayah beyond its seven canonical verses');
assert.equal(isValidQuranPosition(2, 286), true);
assert.equal(isValidQuranPosition(2, 287), false, 'Al-Baqarah must reject ayah 287');
assert.equal(isValidQuranPosition(114, 6), true);
assert.equal(isValidQuranPosition(114, 7), false);
assert.equal(isValidQuranPosition(0, 1), false);
assert.equal(isValidQuranPosition(115, 1), false);
assert.equal(isValidQuranPosition(1, 1.5), false);
assert.equal(isValidQuranPosition(1, Number.NaN), false);
assert.equal(isValidQuranPosition(1, Number.MAX_SAFE_INTEGER + 1), false);
assert.equal(toAbsoluteAyah(1, 1), 1);
assert.equal(toAbsoluteAyah(1, 7), 7);
assert.equal(toAbsoluteAyah(1, 8), 0, 'invalid ayahs must not be clamped into a valid reading');
assert.equal(toAbsoluteAyah(1.5, 1), 0);
assert.equal(toAbsoluteAyah(1, Number.POSITIVE_INFINITY), 0);
assert.deepEqual(fromAbsoluteAyah(Number.NaN), { surah: 1, ayah: 1 });
assert.deepEqual(fromAbsoluteAyah(Number.POSITIVE_INFINITY), { surah: 1, ayah: 1 });
assert.equal(ayahsReadFromPosition(Number.NaN), 0);
assert.equal(ayahsReadFromPosition(Number.POSITIVE_INFINITY), 0);
assert.equal(percentComplete(Number.NaN), 0);

const validWird = {
  ...DEFAULT_WIRD_PROGRESS_STATE,
  position: 7,
  todayCount: 7,
  todayDate: '2026-11-14',
  lastStreakDate: '2026-11-13',
};
assert.deepEqual(normalizeWirdProgressState(validWird), validWird);
assert.deepEqual(normalizeWirdProgressState({ position: 10 }), {
  ...DEFAULT_WIRD_PROGRESS_STATE,
  position: 10,
}, 'older partial state objects should receive safe defaults');
assert.equal(normalizeWirdProgressState({ ...validWird, position: 6237 }), null);
assert.equal(normalizeWirdProgressState({ ...validWird, dailyTarget: 0 }), null);
assert.equal(normalizeWirdProgressState({ ...validWird, todayCount: '7' }), null);
assert.equal(normalizeWirdProgressState({ ...validWird, khatmaCount: 1.5 }), null);
assert.equal(normalizeWirdProgressState({ ...validWird, streak: -1 }), null);
assert.equal(normalizeWirdProgressState({ ...validWird, todayDate: '2026-02-31' }), null);
assert.equal(normalizeWirdProgressState(null), null);

const readingProgress = readFileSync('src/features/quran/services/reading-progress.ts', 'utf8');
assert.match(readingProgress, /isValidQuranPosition\(surahId, ayahNumber\)/, 'server writes must validate the actual surah ayah count');
assert.match(readingProgress, /parsedSurahId !== surahId/, 'stored progress must not override the requested surah reference');
assert.match(readingProgress, /ref !== `surah:\$\{surahId\}`/, 'stored progress must use the canonical surah reference');
assert.doesNotMatch(readingProgress, /function validAyahNumber/, 'a generic 286-ayah ceiling must not be used for every surah');

const wirdService = readFileSync('src/features/wird/services/progress.ts', 'utf8');
assert.match(wirdService, /normalizeWirdProgressState\(data\.progress_json\)/, 'remote JSONB state must be validated before returning to the client');
assert.match(wirdService, /normalizeWirdProgressState\(state\)/, 'server writes must reject malformed progress JSON');

const wirdHook = readFileSync('src/features/quran/hooks/use-quran-wird.ts', 'utf8');
assert.match(wirdHook, /isValidQuranPosition\(surah, ayah\)/, 'Wird reads must validate the actual surah and ayah');
assert.match(wirdHook, /normalizeWirdProgressState\(JSON\.parse\(raw\)\)/, 'localStorage must be validated before arithmetic');
assert.match(wirdHook, /revisionRef\.current !== initialRevision/, 'late account reads must not overwrite progress changed while loading');
assert.match(wirdHook, /saveWirdProgress\(next\)\.catch/, 'failed background sync must not create an unhandled rejection');

console.log('Quran and Wird reading-progress integrity contracts passed.');
