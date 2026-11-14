import "server-only";

import { createClient } from "@/lib/supabase/server";
import { normalizeWirdProgressState, type WirdProgressState } from "@/features/wird/utils/progress-validation";

export type { WirdProgressState } from "@/features/wird/utils/progress-validation";

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export async function getCurrentWirdProgress(): Promise<{
  loggedIn: boolean;
  userId: string | null;
  state: WirdProgressState | null;
}> {
  const session = await getCurrentUser();
  if (!session) return { loggedIn: false, userId: null, state: null };

  const { data, error } = await session.supabase
    .from("reading_progress")
    .select("progress_json")
    .eq("user_id", session.user.id)
    .eq("scope", "quran")
    .eq("ref", "wird")
    .maybeSingle();

  if (error || !data?.progress_json) {
    return { loggedIn: true, userId: session.user.id, state: null };
  }

  return {
    loggedIn: true,
    userId: session.user.id,
    state: normalizeWirdProgressState(data.progress_json),
  };
}

export async function saveCurrentWirdProgress(
  state: unknown,
  expectedUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedState = normalizeWirdProgressState(state);
  if (!normalizedState) {
    return { success: false, error: "بيانات تقدم الورد غير صالحة" };
  }

  const session = await getCurrentUser();
  if (!session || session.user.id !== expectedUserId) {
    return {
      success: false,
      error: "انتهت جلسة الحساب أو تغير المستخدم قبل المزامنة",
    };
  }

  const { error } = await session.supabase
    .from("reading_progress")
    .upsert(
      {
        user_id: session.user.id,
        scope: "quran",
        ref: "wird",
        progress_json: normalizedState,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,scope,ref" },
    );

  if (error) {
    console.error("[wird] save progress failed:", error);
    return { success: false, error: "تعذر مزامنة تقدم الورد." };
  }

  return { success: true };
}
