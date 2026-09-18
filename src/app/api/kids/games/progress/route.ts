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
    const [player, games] = await Promise.all([
      supabase.from("kids_player_progress").select("xp,level,total_games,total_score,total_collectibles,updated_at").eq("user_id", authData.user.id).maybeSingle(),
      supabase.from("kids_game_progress").select("game_id,best_score,best_distance,best_level,play_count,best_combo,updated_at").eq("user_id", authData.user.id).order("best_score", { ascending: false }).limit(100),
    ]);
    if (player.error || games.error) return NextResponse.json({ error: "Could not load progress" }, { status: 500 });
    return NextResponse.json({
      player: player.data ?? { xp: 0, level: 1, total_games: 0, total_score: 0, total_collectibles: 0 },
      games: (games.data ?? []).map(row => ({ gameId: row.game_id, bestScore: row.best_score, bestDistance: row.best_distance, bestLevel: row.best_level, playCount: row.play_count, bestCombo: row.best_combo, updatedAt: row.updated_at })),
    });
  } catch (error) {
    console.error("[api/kids/games/progress] unexpected error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not load progress" }, { status: 500 });
  }
}
