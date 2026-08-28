import { surahNameToId } from '@/lib/utils/surah-mapping';

/**
 * Arabic surah names ordered by surah ID (index 0 = surah 1 ... index 113 = surah 114).
 * Derived from the canonical name→id map so we keep a single source of truth.
 */
let cachedNames: string[] | null = null;

export function getAllSurahNames(): string[] {
  if (cachedNames) return cachedNames;
  const names = new Array<string>(114).fill('');
  for (const [name, id] of Object.entries(surahNameToId)) {
    if (id >= 1 && id <= 114) names[id - 1] = name;
  }
  cachedNames = names;
  return names;
}

/** Get a single surah's Arabic name by ID (1-114). */
export function getSurahName(id: number): string {
  return getAllSurahNames()[id - 1] ?? '';
}
