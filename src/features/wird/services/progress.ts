import "server-only";

import { createClient } from "@/lib/supabase/server";

export type WirdProgressState = {
  dailyTarget: number;
  position: number;
  khatmaCount: number;
  todayCount: number;
  todayDate: string;
  streak: number;
  lastStreakDate: string;
};

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
  state: WirdProgressState | null;
}> {
  const session = await getCurrentUser();
  if (!session) return { loggedIn: false, state: null };

  const { data, error } = await session.supabase
    .from("reading_progress")
    .select("progress_json")
    .eq("user_id", session.user.id)
    .eq("scope", "quran")
    .eq("ref", "wird")
    .maybeSingle();

  if (error || !data?.progress_json) {
    return { loggedIn: true, state: null };
  }

  return {
    loggedIn: true,
    state: data.progress_json as WirdProgressState,
  };
}

export async function saveCurrentWirdProgress(
  state: WirdProgressState,
): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentUser();
  if (!session) {
    return {
      success: false,
      error: "يجب تسجيل الدخول لمزامنة تقدمك",
    };
  }

  const { error } = await session.supabase
    .from("reading_progress")
    .upsert(
      {
        user_id: session.user.id,
        scope: "quran",
        ref: "wird",
        progress_json: state,
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
