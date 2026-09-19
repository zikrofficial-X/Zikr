'use server';

import { createClient, getSupabaseUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type WirdProgressState = {
  dailyTarget: number;
  position: number;
  khatmaCount: number;
  todayCount: number;
  todayDate: string;
  streak: number;
  lastStreakDate: string;
};

export async function getWirdProgress(): Promise<{
  loggedIn: boolean;
  state: WirdProgressState | null;
}> {
  const user = await getSupabaseUser();
  if (!user) return { loggedIn: false, state: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reading_progress')
    .select('progress_json')
    .eq('user_id', user.id)
    .eq('scope', 'quran')
    .eq('ref', 'wird')
    .maybeSingle();

  if (error || !data?.progress_json) return { loggedIn: true, state: null };
  return { loggedIn: true, state: data.progress_json as WirdProgressState };
}

export async function saveWirdProgress(
  state: WirdProgressState
): Promise<{ success: boolean; error?: string }> {
  const user = await getSupabaseUser();
  if (!user) return { success: false, error: 'يجب تسجيل الدخول لمزامنة تقدمك' };

  const supabase = await createClient();
  const { error } = await supabase.from('reading_progress').upsert(
    {
      user_id: user.id,
      scope: 'quran',
      ref: 'wird',
      progress_json: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,scope,ref' }
  );

  if (error) {
    console.error('[wird-actions] saveWirdProgress error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/wird');
  return { success: true };
}
