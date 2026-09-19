import { NextResponse } from "next/server";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [catalog, unlocked] = await Promise.all([
      supabase.from("kids_achievements").select("id,title_ar,title_en,description_ar,description_en,icon,criteria,is_active").eq("is_active", true).order("created_at", { ascending: true }).limit(100),
      supabase.from("kids_user_achievements").select("achievement_id,unlocked_at").eq("user_id", authData.user.id).order("unlocked_at", { ascending: false }).limit(100),
    ]);
    if (catalog.error || unlocked.error) return NextResponse.json({ error: "Could not load achievements" }, { status: 500 });
    const unlockedMap = new Map((unlocked.data ?? []).map(row => [row.achievement_id, row.unlocked_at]));
    return NextResponse.json({ achievements: (catalog.data ?? []).map(row => ({ id: row.id, titleAr: row.title_ar, titleEn: row.title_en, descriptionAr: row.description_ar, descriptionEn: row.description_en, icon: row.icon, criteria: row.criteria, unlockedAt: unlockedMap.get(row.id) ?? null })) });
  } catch (error) {
    console.error("[api/kids/games/achievements] unexpected error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not load achievements" }, { status: 500 });
  }
}
