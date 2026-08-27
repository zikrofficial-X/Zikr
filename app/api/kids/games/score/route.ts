import { NextRequest, NextResponse } from "next/server";
import { calculateBoundedXp } from "@/lib/games/registry";
import { validateGameResultPayload, type ValidatedGameResultPayload } from "@/lib/games/validation";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";


function responseForRow(row: Record<string, unknown>, duplicate = false) {
  return NextResponse.json({
    success: true,
    duplicate,
    result: {
      id: row.id,
      gameId: row.game_id,
      score: row.score,
      collectibles: row.collectibles,
      distance: row.distance,
      xpAwarded: row.xp_awarded,
      difficulty: row.difficulty,
      playedAt: row.played_at,
    },
  });
}

export async function POST(request: NextRequest) {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload: ValidatedGameResultPayload | null = validateGameResultPayload(body);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid game result. Check the game ID, submission ID, and numeric limits." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const xpAwarded = calculateBoundedXp(payload);
    const insertPayload: {
      user_id: string;
      game_id: string;
      score: number;
      collectibles: number;
      distance: number;
      xp_awarded: number;
      difficulty: ValidatedGameResultPayload["difficulty"];
      client_submission_id: string;
      played_at: string;
      metadata: Record<string, unknown>;
    } = {
      user_id: user.id,
      game_id: payload.gameId,
      score: payload.score,
      collectibles: payload.collectibles,
      distance: payload.distance,
      xp_awarded: xpAwarded,
      difficulty: payload.difficulty,
      client_submission_id: payload.clientSubmissionId,
      played_at: new Date().toISOString(),
      metadata: payload.metadata,
    };

    const { data: inserted, error } = await supabase
      .from("kids_game_results")
      .insert(insertPayload)
      .select("id, game_id, score, collectibles, distance, xp_awarded, difficulty, played_at")
      .single();

    if (!error && inserted) return responseForRow(inserted);

    if (error?.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("kids_game_results")
        .select("id, game_id, score, collectibles, distance, xp_awarded, difficulty, played_at")
        .eq("user_id", user.id)
        .eq("client_submission_id", payload.clientSubmissionId)
        .maybeSingle();
      if (!existingError && existing) return responseForRow(existing, true);
    }

    console.error("[api/kids/games/score] insert failed", error?.code ?? "unknown");
    return NextResponse.json({ error: "Could not save game result" }, { status: 500 });
  } catch (error) {
    console.error(
      "[api/kids/games/score] unexpected error",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json({ error: "Could not save game result" }, { status: 500 });
  }
}
