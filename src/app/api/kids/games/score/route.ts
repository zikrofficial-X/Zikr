import { NextRequest, NextResponse } from "next/server";
import { validateGameResultPayload, type ValidatedGameResultPayload } from "@/lib/games/validation";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }); }

  const payload: ValidatedGameResultPayload | null = validateGameResultPayload(body);
  if (!payload) return NextResponse.json({ error: "Invalid game result. Check the game ID, submission ID, and numeric limits." }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("kids_record_game_result_internal", {
      p_user_id: authData.user.id,
      p_game_id: payload.gameId,
      p_client_submission_id: payload.clientSubmissionId,
      p_score: payload.score,
      p_collectibles: payload.collectibles,
      p_distance: payload.distance,
      p_difficulty: payload.difficulty,
      p_level: payload.level,
      p_combo: payload.combo,
      p_completed: payload.completed,
      p_metadata: payload.metadata,
    });

    if (error || !Array.isArray(data) || !data[0]) {
      console.error("[api/kids/games/score] atomic result failed", error?.code ?? "empty_result");
      return NextResponse.json({ error: "Could not save game result" }, { status: 500 });
    }

    const row = data[0] as {
      result_id: string;
      xp_awarded: number;
      player_level: number;
      duplicate: boolean;
      newly_unlocked: string[] | null;
    };
    return NextResponse.json({
      success: true,
      duplicate: Boolean(row.duplicate),
      progress: { xpAwarded: row.xp_awarded, level: row.player_level },
      achievements: row.newly_unlocked ?? [],
      result: { id: row.result_id, gameId: payload.gameId, score: payload.score, collectibles: payload.collectibles, distance: payload.distance, xpAwarded: row.xp_awarded, difficulty: payload.difficulty },
    });
  } catch (error) {
    console.error("[api/kids/games/score] unexpected error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not save game result" }, { status: 500 });
  }
}
