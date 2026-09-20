import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface MemorizationEntry {
  id: string;
  surah_number: number;
  surah_name: string;
  total_ayahs: number;
  memorized_ayahs: number;
  last_reviewed_at: string | null;
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

export async function getCurrentMemorizationProgress(): Promise<{
  entries: MemorizationEntry[];
  loggedIn: boolean;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) return { entries: [], loggedIn: false };

    const { data, error } = await session.supabase
      .from("memorization_progress")
      .select(
        "id, surah_number, surah_name, total_ayahs, memorized_ayahs, last_reviewed_at",
      )
      .eq("user_id", session.user.id)
      .order("surah_number", { ascending: true });

    if (error) throw error;
    return {
      entries: (data ?? []) as MemorizationEntry[],
      loggedIn: true,
    };
  } catch (error) {
    console.error("[memorization] load progress failed:", error);
    return { entries: [], loggedIn: false };
  }
}

export async function saveMemorizationProgress(input: {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  memorizedAyahs: number;
}): Promise<{ ok: boolean; error?: string }> {
  const {
    surahNumber,
    surahName,
    totalAyahs,
    memorizedAyahs,
  } = input;

  if (
    !Number.isInteger(surahNumber) ||
    surahNumber < 1 ||
    surahNumber > 114
  ) {
    return { ok: false, error: "رقم سورة غير صالح" };
  }
  if (
    !Number.isInteger(totalAyahs) ||
    totalAyahs < 1 ||
    !Number.isInteger(memorizedAyahs) ||
    memorizedAyahs < 0 ||
    memorizedAyahs > totalAyahs
  ) {
    return { ok: false, error: "عدد آيات غير صالح" };
  }
  if (
    typeof surahName !== "string" ||
    !surahName.trim() ||
    surahName.trim().length > 200
  ) {
    return { ok: false, error: "اسم السورة غير صالح" };
  }

  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        ok: false,
        error: "يجب تسجيل الدخول لحفظ تقدمك",
      };
    }

    const now = new Date().toISOString();
    const { error } = await session.supabase
      .from("memorization_progress")
      .upsert(
        {
          user_id: session.user.id,
          surah_number: surahNumber,
          surah_name: surahName.trim(),
          total_ayahs: totalAyahs,
          memorized_ayahs: memorizedAyahs,
          last_reviewed_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,surah_number" },
      );

    if (error) {
      console.error("[memorization] save progress failed:", error);
      return {
        ok: false,
        error: "تعذر حفظ التقدم. تأكد من تشغيل آخر migration.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[memorization] unexpected save error:", error);
    return { ok: false, error: "حدث خطأ غير متوقع" };
  }
}

export async function deleteMemorizationProgress(
  surahNumber: number,
): Promise<{ ok: boolean }> {
  if (
    !Number.isInteger(surahNumber) ||
    surahNumber < 1 ||
    surahNumber > 114
  ) {
    return { ok: false };
  }

  try {
    const session = await getCurrentUser();
    if (!session) return { ok: false };

    const { error } = await session.supabase
      .from("memorization_progress")
      .delete()
      .eq("user_id", session.user.id)
      .eq("surah_number", surahNumber);

    if (error) {
      console.error("[memorization] delete progress failed:", error);
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error("[memorization] unexpected delete error:", error);
    return { ok: false };
  }
}
