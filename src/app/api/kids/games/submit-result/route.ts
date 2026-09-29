// @ts-nocheck - Supabase dynamic schema types
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Lazy initialize Supabase client to avoid build-time errors
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase configuration missing");
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;
    const body = await request.json();

    const { gameId, score, collectibles, durationSeconds, difficulty } = body;

    if (!gameId || typeof score !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: gameId, score" },
        { status: 400 }
      );
    }

    // Insert game result
    const { data: result, error: resultError } = await supabase
      .from("kids_game_results")
      .insert({
        user_id: userId,
        game_id: gameId,
        score,
        collectibles: collectibles || 0,
        duration_seconds: durationSeconds || 0,
        difficulty: difficulty || "easy",
        completed: true,
      })
      .select()
      .single();

    if (resultError) {
      console.error("Error inserting game result:", resultError);
      return NextResponse.json(
        { error: "Failed to save game result" },
        { status: 500 }
      );
    }

    // Update or insert progress
    const { data: existing } = await supabase
      .from("kids_game_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .single();

    if (existing) {
      // Update existing progress
      await supabase
        .from("kids_game_progress")
        .update({
          best_score: Math.max(existing.best_score, score),
          total_plays: existing.total_plays + 1,
          total_time_seconds: existing.total_time_seconds + (durationSeconds || 0),
          last_played_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new progress
      await supabase.from("kids_game_progress").insert({
        user_id: userId,
        game_id: gameId,
        best_score: score,
        total_plays: 1,
        total_time_seconds: durationSeconds || 0,
        last_played_at: new Date().toISOString(),
      });
    }

    // Check for achievements
    const achievements = checkAchievements(gameId, score, collectibles);
    for (const achievement of achievements) {
      await supabase.from("kids_achievements").upsert(
        {
          user_id: userId,
          achievement_id: achievement.id,
          title_ar: achievement.titleAr,
          title_en: achievement.titleEn,
          description_ar: achievement.descriptionAr,
          description_en: achievement.descriptionEn,
          icon_emoji: achievement.icon,
        },
        { onConflict: "user_id,achievement_id" }
      );
    }

    return NextResponse.json(
      {
        success: true,
        result,
        achievements,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in submit-result:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface Achievement {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
}

function checkAchievements(gameId: string, score: number, collectibles: number): Achievement[] {
  const achievements: Achievement[] = [];

  // First game played
  if (score > 0) {
    achievements.push({
      id: `first-${gameId}`,
      titleAr: "بداية جديدة",
      titleEn: "New Start",
      descriptionAr: "لعبت أول لعبة",
      descriptionEn: "Played your first game",
      icon: "🌟",
    });
  }

  // High score achievements
  if (score >= 1000) {
    achievements.push({
      id: `master-${gameId}`,
      titleAr: "ماهر اللعبة",
      titleEn: "Master",
      descriptionAr: "حققت 1000 نقطة أو أكثر",
      descriptionEn: "Scored 1000 or more points",
      icon: "🏆",
    });
  }

  if (score >= 500) {
    achievements.push({
      id: `skilled-${gameId}`,
      titleAr: "ماهر",
      titleEn: "Skilled",
      descriptionAr: "حققت 500 نقطة أو أكثر",
      descriptionEn: "Scored 500 or more points",
      icon: "⭐",
    });
  }

  // Collectibles achievements
  if (collectibles >= 50) {
    achievements.push({
      id: `collector-${gameId}`,
      titleAr: "جامع",
      titleEn: "Collector",
      descriptionAr: "جمعت 50 كنز أو أكثر",
      descriptionEn: "Collected 50 or more treasures",
      icon: "💎",
    });
  }

  return achievements;
}
