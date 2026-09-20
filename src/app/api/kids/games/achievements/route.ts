import { getCurrentKidsAchievements } from "@/features/kids/services/games";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { NextResponse } from "next/server";

export async function GET() {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;

  try {
    const achievements = await getCurrentKidsAchievements();
    if (!achievements) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(achievements);
  } catch (error) {
    console.error(
      "[api/kids/games/achievements] unexpected error",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "Could not load achievements" },
      { status: 500 },
    );
  }
}
