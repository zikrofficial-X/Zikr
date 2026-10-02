import "server-only";

import {
  validateGameResultPayload,
  type ValidatedGameResultPayload,
} from "@/lib/games/validation";
import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

export type KidsGameProgress = {
  player: {
    xp: number;
    level: number;
    total_games: number;
    total_score: number;
    total_collectibles: number;
    updated_at?: string | null;
  };
  games: Array<{
    gameId: string;
    bestScore: number;
    bestDistance: number | null;
    bestLevel: number;
    playCount: number;
    bestCombo: number;
    updatedAt: string | null;
  }>;
};

export type KidsAchievementList = {
  achievements: Array<{
    id: string;
    titleAr: string;
    titleEn: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    icon: string | null;
    criteria: unknown;
    unlockedAt: string | null;
  }>;
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

export async function getCurrentKidsGameProgress(): Promise<KidsGameProgress | null> {
  const session = await getCurrentUser();
  if (!session) return null;

  const [player, games] = await Promise.all([
    session.supabase
      .from("kids_player_progress")
      .select(
        "xp,level,total_games,total_score,total_collectibles,updated_at",
      )
      .eq("user_id", session.user.id)
      .maybeSingle(),
    session.supabase
      .from("kids_game_progress")
      .select(
        "game_id,best_score,best_distance,best_level,play_count,best_combo,updated_at",
      )
      .eq("user_id", session.user.id)
      .order("best_score", { ascending: false })
      .limit(100),
  ]);

  if (player.error || games.error) {
    throw player.error ?? games.error;
  }

  return {
    player: player.data ?? {
      xp: 0,
      level: 1,
      total_games: 0,
      total_score: 0,
      total_collectibles: 0,
    },
    games: (games.data ?? []).map((row) => ({
      gameId: row.game_id,
      bestScore: row.best_score,
      bestDistance: row.best_distance,
      bestLevel: row.best_level,
      playCount: row.play_count,
      bestCombo: row.best_combo,
      updatedAt: row.updated_at,
    })),
  };
}

export async function getCurrentKidsAchievements(): Promise<KidsAchievementList | null> {
  const session = await getCurrentUser();
  if (!session) return null;

  const [catalog, unlocked] = await Promise.all([
    session.supabase
      .from("kids_achievements")
      .select(
        "id,title_ar,title_en,description_ar,description_en,icon,criteria,is_active",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(100),
    session.supabase
      .from("kids_user_achievements")
      .select("achievement_id,unlocked_at")
      .eq("user_id", session.user.id)
      .order("unlocked_at", { ascending: false })
      .limit(100),
  ]);

  if (catalog.error || unlocked.error) {
    throw catalog.error ?? unlocked.error;
  }

  const unlockedMap = new Map(
    (unlocked.data ?? []).map((row) => [
      row.achievement_id,
      row.unlocked_at,
    ]),
  );

  return {
    achievements: (catalog.data ?? []).map((row) => ({
      id: row.id,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      descriptionAr: row.description_ar,
      descriptionEn: row.description_en,
      icon: row.icon,
      criteria: row.criteria,
      unlockedAt: unlockedMap.get(row.id) ?? null,
    })),
  };
}

export type KidsGameResultResponse = {
  success: true;
  duplicate: boolean;
  progress: {
    xpAwarded: number;
    level: number;
  };
  achievements: string[];
  result: {
    id: string;
    gameId: string;
    score: number;
    collectibles: number;
    distance: number;
    xpAwarded: number;
    difficulty: string;
  };
};

export async function recordKidsGameResultForUser(
  userId: string,
  body: unknown,
): Promise<
  | KidsGameResultResponse
  | { success: false; status: 400 | 401; error: string }
  | { success: false; status: 500; error: string }
> {
  if (!userId) {
    return { success: false, status: 401, error: "Unauthorized" };
  }

  const payload: ValidatedGameResultPayload | null =
    validateGameResultPayload(body);
  if (!payload) {
    return {
      success: false,
      status: 400,
      error:
        "Invalid game result. Check the game ID, submission ID, and numeric limits.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    "kids_record_game_result_internal",
    {
      p_user_id: userId,
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
    },
  );

  if (error || !Array.isArray(data) || !data[0]) {
    console.error(
      "[kids-games] atomic result failed",
      error?.code ?? "empty_result",
    );
    return {
      success: false,
      status: 500,
      error: "Could not save game result",
    };
  }

  const row = data[0] as {
    result_id: string;
    xp_awarded: number;
    player_level: number;
    duplicate: boolean;
    newly_unlocked: string[] | null;
  };

  return {
    success: true,
    duplicate: Boolean(row.duplicate),
    progress: {
      xpAwarded: row.xp_awarded,
      level: row.player_level,
    },
    achievements: row.newly_unlocked ?? [],
    result: {
      id: row.result_id,
      gameId: payload.gameId,
      score: payload.score,
      collectibles: payload.collectibles,
      distance: payload.distance,
      xpAwarded: row.xp_awarded,
      difficulty: payload.difficulty,
    },
  };
}

export async function recordCurrentKidsGameResult(
  body: unknown,
): Promise<
  | KidsGameResultResponse
  | { success: false; status: 400 | 401; error: string }
  | { success: false; status: 500; error: string }
> {
  const session = await getCurrentUser();
  if (!session) {
    return { success: false, status: 401, error: "Unauthorized" };
  }

  return recordKidsGameResultForUser(session.user.id, body);
}
