import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isValidQuranPosition } from '../../src/features/quran/utils/quran-progress';

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

const readingProgress = readFileSync('src/features/quran/services/reading-progress.ts', 'utf8');
assert.match(readingProgress, /isValidQuranPosition\(surahId, ayahNumber\)/, 'server writes must validate the actual surah ayah count');
assert.match(readingProgress, /parsedSurahId !== surahId/, 'stored progress must not override the requested surah reference');
assert.match(readingProgress, /ref !== `surah:\$\{surahId\}`/, 'stored progress must use the canonical surah reference');
assert.doesNotMatch(readingProgress, /function validAyahNumber/, 'a generic 286-ayah ceiling must not be used for every surah');

console.log('Quran reading-progress position contract passed.');
