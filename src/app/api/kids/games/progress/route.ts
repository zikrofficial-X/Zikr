import { getCurrentKidsGameProgress } from "@/features/kids/services/games";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { NextResponse } from "next/server";

export async function GET() {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;

  try {
    const progress = await getCurrentKidsGameProgress();
    if (!progress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(progress);
  } catch (error) {
    console.error(
      "[api/kids/games/progress] unexpected error",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "Could not load progress" },
      { status: 500 },
    );
  }
}
