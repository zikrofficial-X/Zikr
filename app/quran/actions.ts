'use server';

import { createClient, getSupabaseUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ReadingProgress {
  surah_id: number;
  ayah_number: number;
  surah_name?: string;
  updated_at?: string;
}

type ProgressJson = {
  surah_id?: number;
  ayah_number?: number;
  surah_name?: string | null;
};

/** Save or update a user's last reading position for a surah. */
export async function saveReadingProgress(
  surahId: number,
  ayahNumber: number,
  surahName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getSupabaseUser();
    if (!user) return { success: false, error: 'يجب تسجيل الدخول أولاً' };

    const supabase = await createClient();
    const { error } = await supabase.from('reading_progress').upsert(
      {
        user_id: user.id,
        scope: 'quran',
        ref: `surah:${surahId}`,
        progress_json: {
          surah_id: surahId,
          ayah_number: ayahNumber,
          surah_name: surahName ?? null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,scope,ref' }
    );

    if (error) {
      console.error('[quran-actions] saveReadingProgress error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/quran');
    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    console.error('[quran-actions] saveReadingProgress exception:', err);
    return { success: false, error: 'حدث خطأ غير متوقع' };
  }
}

/** Get the user's saved position for a specific surah. */
export async function getReadingProgress(surahId: number): Promise<ReadingProgress | null> {
  try {
    const user = await getSupabaseUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reading_progress')
      .select('ref, progress_json, updated_at')
      .eq('user_id', user.id)
      .eq('scope', 'quran')
      .eq('ref', `surah:${surahId}`)
      .maybeSingle();

    if (error || !data) return null;
    const progress = (data.progress_json ?? {}) as ProgressJson;
    return {
      surah_id: surahId,
      ayah_number: Number(progress.ayah_number ?? 1),
      surah_name: progress.surah_name ?? undefined,
      updated_at: data.updated_at,
    };
  } catch {
    return null;
  }
}

/** Get the most recently saved Quran position across all surahs. */
export async function getLastReadPosition(): Promise<ReadingProgress | null> {
  try {
    const user = await getSupabaseUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reading_progress')
      .select('ref, progress_json, updated_at')
      .eq('user_id', user.id)
      .eq('scope', 'quran')
      .like('ref', 'surah:%')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    const progress = (data.progress_json ?? {}) as ProgressJson;
    return {
      surah_id: Number(String(data.ref).replace('surah:', '')),
      ayah_number: Number(progress.ayah_number ?? 1),
      surah_name: progress.surah_name ?? undefined,
      updated_at: data.updated_at,
    };
  } catch {
    return null;
  }
}

/** Clear reading progress for a specific surah. */
export async function clearReadingProgress(surahId: number): Promise<{ success: boolean }> {
  try {
    const user = await getSupabaseUser();
    if (!user) return { success: false };

    const supabase = await createClient();
    const { error } = await supabase
      .from('reading_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('scope', 'quran')
      .eq('ref', `surah:${surahId}`);

    if (error) return { success: false };
    revalidatePath('/quran');
    revalidatePath('/profile');
    return { success: true };
  } catch {
    return { success: false };
  }
}
