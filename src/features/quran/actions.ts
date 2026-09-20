'use server';

import { revalidatePath } from 'next/cache';
import {
  clearCurrentReadingProgress,
  getCurrentLastReadPosition,
  getCurrentReadingProgress,
  saveCurrentReadingProgress,
  type ReadingProgress,
} from '@/features/quran/services/reading-progress';

export type { ReadingProgress };

export async function saveReadingProgress(
  surahId: number,
  ayahNumber: number,
  surahName?: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await saveCurrentReadingProgress(surahId, ayahNumber, surahName);
  if (result.success) {
    revalidatePath('/quran');
    revalidatePath('/profile');
  }
  return result;
}

export async function getReadingProgress(
  surahId: number,
): Promise<ReadingProgress | null> {
  return getCurrentReadingProgress(surahId);
}

export async function getLastReadPosition(): Promise<ReadingProgress | null> {
  return getCurrentLastReadPosition();
}

export async function clearReadingProgress(
  surahId: number,
): Promise<{ success: boolean }> {
  const result = await clearCurrentReadingProgress(surahId);
  if (result.success) {
    revalidatePath('/quran');
    revalidatePath('/profile');
  }
  return result;
}
