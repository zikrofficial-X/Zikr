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
  hasWirdProgress,
  mergeWirdProgressStates,
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
assert.equal(hasWirdProgress({ ...DEFAULT_WIRD_PROGRESS_STATE, khatmaCount: 1 }), true, 'a completed Khatma must count as local progress even when position resets to zero');
assert.equal(hasWirdProgress(DEFAULT_WIRD_PROGRESS_STATE), false);
const localOffline = { ...DEFAULT_WIRD_PROGRESS_STATE, khatmaCount: 1, position: 100, todayCount: 50, todayDate: '2026-11-14', dailyTarget: 50 };
const remoteOlder = { ...DEFAULT_WIRD_PROGRESS_STATE, position: 6000, todayCount: 20, todayDate: '2026-11-14', dailyTarget: 20 };
assert.deepEqual(mergeWirdProgressStates(localOffline, remoteOlder, '2026-11-14'), {
  ...DEFAULT_WIRD_PROGRESS_STATE,
  dailyTarget: 50,
  khatmaCount: 1,
  position: 100,
  todayCount: 50,
  todayDate: '2026-11-14',
});

const readingProgress = readFileSync('src/features/quran/services/reading-progress.ts', 'utf8');
assert.match(readingProgress, /isValidQuranPosition\(surahId, ayahNumber\)/, 'server writes must validate the actual surah ayah count');
assert.match(readingProgress, /parsedSurahId !== surahId/, 'stored progress must not override the requested surah reference');
assert.match(readingProgress, /ref !== `surah:\$\{surahId\}`/, 'stored progress must use the canonical surah reference');
assert.doesNotMatch(readingProgress, /function validAyahNumber/, 'a generic 286-ayah ceiling must not be used for every surah');

const wirdService = readFileSync('src/features/wird/services/progress.ts', 'utf8');
assert.match(wirdService, /normalizeWirdProgressState\(data\.progress_json\)/, 'remote JSONB state must be validated before returning to the client');
assert.match(wirdService, /normalizeWirdProgressState\(state\)/, 'server writes must reject malformed progress JSON');
assert.match(wirdService, /userId: session\.user\.id/, 'the account id must be returned for local cache isolation');
assert.match(wirdService, /session\.user\.id !== expectedUserId/, 'server writes must be bound to the account that initiated the sync');

const wirdHook = readFileSync('src/features/quran/hooks/use-quran-wird.ts', 'utf8');
assert.match(wirdHook, /isValidQuranPosition\(surah, ayah\)/, 'Wird reads must validate the actual surah and ayah');
assert.match(wirdHook, /normalizeWirdProgressState\(JSON\.parse\(raw\)\)/, 'localStorage must be validated before arithmetic');
assert.match(wirdHook, /revisionRef\.current !== initialRevision/, 'late account reads must not overwrite progress changed while loading');
assert.match(wirdHook, /auth\.onAuthStateChange/, 'the local cache must switch when the signed-in account changes');
assert.match(wirdHook, /import type \{ AuthChangeEvent, Session \} from '@supabase\\/supabase-js'/, 'auth callbacks must use Supabase event/session types when the browser client generic is erased');
assert.match(wirdHook, /onAuthStateChange\(\(_event: AuthChangeEvent, session: Session \| null\)/, 'auth-state callback parameters must remain strictly typed');
assert.match(wirdHook, /getSession\(\)\.then\(\(\{ data: sessionData \}: \{ data: \{ session: Session \| null \} \}\)/, 'session bootstrap must remain strictly typed');
assert.match(wirdHook, /getStorageKey\(userId\)/, 'local progress must be stored per account');
assert.match(wirdHook, /mergeWirdProgressStates\(localState, remoteToday, today\)/, 'offline progress must be merged instead of discarded');
assert.match(wirdHook, /saveWirdProgress\(next, expectedUserId\)\.catch/, 'remote writes must be bound to the expected user and never create unhandled rejections');

console.log('Quran and Wird reading-progress integrity contracts passed.');
