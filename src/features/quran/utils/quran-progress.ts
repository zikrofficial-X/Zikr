import { surahAyahCounts } from '@/lib/utils/surah-mapping';

/** Total number of ayahs in the Mushaf (Hafs narration). */
export const TOTAL_AYAHS = 6236;

/**
 * Cumulative ayah offset before each surah, indexed by surah ID (1-114).
 * cumulativeOffset[n] = number of ayahs in all surahs before surah n.
 * So the absolute index of ayah `a` in surah `s` is cumulativeOffset[s] + a.
 */
export const cumulativeOffset: Record<number, number> = (() => {
  const map: Record<number, number> = {};
  let running = 0;
  for (let s = 1; s <= 114; s++) {
    map[s] = running;
    running += surahAyahCounts[s] ?? 0;
  }
  return map;
})();

/**
 * Convert a (surah, ayah) pair to an absolute ayah index in range 1..6236.
 */
export function toAbsoluteAyah(surah: number, ayah: number): number {
  if (surah < 1 || surah > 114) return 0;
  const count = surahAyahCounts[surah] ?? 0;
  const clampedAyah = Math.min(Math.max(ayah, 1), count);
  return cumulativeOffset[surah] + clampedAyah;
}

/**
 * Convert an absolute ayah index (1..6236) back to a (surah, ayah) pair.
 */
export function fromAbsoluteAyah(absolute: number): { surah: number; ayah: number } {
  const clamped = Math.min(Math.max(absolute, 1), TOTAL_AYAHS);
  for (let s = 1; s <= 114; s++) {
    const count = surahAyahCounts[s] ?? 0;
    if (clamped <= cumulativeOffset[s] + count) {
      return { surah: s, ayah: clamped - cumulativeOffset[s] };
    }
  }
  return { surah: 114, ayah: surahAyahCounts[114] };
}

/** Number of ayahs read so far given a completed-through absolute position. */
export function ayahsReadFromPosition(absolute: number): number {
  return Math.min(Math.max(absolute, 0), TOTAL_AYAHS);
}

/** Percentage (0-100) of the Mushaf completed given an absolute position. */
export function percentComplete(absolute: number): number {
  return Math.round((ayahsReadFromPosition(absolute) / TOTAL_AYAHS) * 1000) / 10;
}
