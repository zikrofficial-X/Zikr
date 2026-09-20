import "server-only";

import { createClient } from "@/lib/supabase/server";

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

function validSurahId(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 114;
}

function validAyahNumber(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 286;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

function mapProgress(
  surahId: number,
  ref: string,
  progressJson: unknown,
  updatedAt?: string,
): ReadingProgress | null {
  const progress = (progressJson ?? {}) as ProgressJson;
  const parsedSurahId = Number.isFinite(progress.surah_id)
    ? Number(progress.surah_id)
    : Number(ref.replace("surah:", ""));
  const ayahNumber = Number(progress.ayah_number ?? 1);

  if (!validSurahId(parsedSurahId) || !validAyahNumber(ayahNumber)) {
    return null;
  }

  return {
    surah_id: surahId,
    ayah_number: ayahNumber,
    surah_name:
      typeof progress.surah_name === "string"
        ? progress.surah_name
        : undefined,
    updated_at: updatedAt,
  };
}

export async function saveCurrentReadingProgress(
  surahId: number,
  ayahNumber: number,
  surahName?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!validSurahId(surahId) || !validAyahNumber(ayahNumber)) {
    return { success: false, error: "موضع قراءة غير صالح" };
  }

  const session = await getCurrentUser();
  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول أولاً" };
  }

  const { error } = await session.supabase
    .from("reading_progress")
    .upsert(
      {
        user_id: session.user.id,
        scope: "quran",
        ref: `surah:${surahId}`,
        progress_json: {
          surah_id: surahId,
          ayah_number: ayahNumber,
          surah_name: surahName?.trim() || null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,scope,ref" },
    );

  if (error) {
    console.error("[quran-progress] save failed:", error);
    return { success: false, error: "تعذر حفظ موضع القراءة." };
  }

  return { success: true };
}

export async function getCurrentReadingProgress(
  surahId: number,
): Promise<ReadingProgress | null> {
  if (!validSurahId(surahId)) return null;

  const session = await getCurrentUser();
  if (!session) return null;

  const { data, error } = await session.supabase
    .from("reading_progress")
    .select("ref, progress_json, updated_at")
    .eq("user_id", session.user.id)
    .eq("scope", "quran")
    .eq("ref", `surah:${surahId}`)
    .maybeSingle();

  if (error || !data) return null;
  return mapProgress(surahId, data.ref, data.progress_json, data.updated_at);
}

export async function getCurrentLastReadPosition(): Promise<ReadingProgress | null> {
  const session = await getCurrentUser();
  if (!session) return null;

  const { data, error } = await session.supabase
    .from("reading_progress")
    .select("ref, progress_json, updated_at")
    .eq("user_id", session.user.id)
    .eq("scope", "quran")
    .like("ref", "surah:%")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const surahId = Number(String(data.ref).replace("surah:", ""));
  if (!validSurahId(surahId)) return null;
  return mapProgress(surahId, data.ref, data.progress_json, data.updated_at);
}

export async function clearCurrentReadingProgress(
  surahId: number,
): Promise<{ success: boolean }> {
  if (!validSurahId(surahId)) return { success: false };

  const session = await getCurrentUser();
  if (!session) return { success: false };

  const { error } = await session.supabase
    .from("reading_progress")
    .delete()
    .eq("user_id", session.user.id)
    .eq("scope", "quran")
    .eq("ref", `surah:${surahId}`);

  if (error) {
    console.error("[quran-progress] clear failed:", error);
    return { success: false };
  }

  return { success: true };
}
