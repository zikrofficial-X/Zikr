import {
  EMPTY_KIDS_PROGRESS,
  KIDS_ACHIEVEMENT_STORAGE_KEY,
  normalizeKidsProgress,
  type KidsProgress,
} from './kids-audio';

export function readKidsProgress(): KidsProgress {
  if (typeof window === 'undefined') return { ...EMPTY_KIDS_PROGRESS };
  try {
    return normalizeKidsProgress(JSON.parse(window.localStorage.getItem(KIDS_ACHIEVEMENT_STORAGE_KEY) ?? 'null'));
  } catch {
    return { ...EMPTY_KIDS_PROGRESS };
  }
}

export function writeKidsProgress(progress: KidsProgress): KidsProgress {
  const normalized = normalizeKidsProgress(progress);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KIDS_ACHIEVEMENT_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('zikr-kids-progress', { detail: normalized }));
  }
  return normalized;
}

export function updateKidsProgress(updater: (progress: KidsProgress) => KidsProgress): KidsProgress {
  return writeKidsProgress(updater(readKidsProgress()));
}
