// @ts-nocheck - Supabase dynamic schema types
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Lazy initialize Supabase client to avoid build-time errors
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase configuration missing');
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const body = await request.json();
    const { gameId, score, collectibles, duration, difficulty, completed } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    // Insert game result
    const { data: resultData, error: resultError } = await supabase
      .from('kids_game_results')
      .insert([
        {
          user_id: userId,
          game_id: gameId,
          score,
          collectibles,
          duration_seconds: duration,
          difficulty,
          completed,
        },
      ])
      .select()
      .single();

    if (resultError) {
      console.error('[submit-result] Insert result error:', resultError);
      return NextResponse.json(
        { error: 'Failed to submit game result' },
        { status: 500 }
      );
    }

    // Upsert game progress
    const { data: progressData, error: progressError } = await supabase
      .from('kids_game_progress')
      .upsert(
        [
          {
            user_id: userId,
            game_id: gameId,
            best_score: Math.max(score || 0, 0),
            total_plays: 1,
            total_time_seconds: duration || 0,
            last_played_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id,game_id' }
      )
      .select()
      .single();

    if (progressError && !progressError.message?.includes('duplicate')) {
      console.error('[submit-result] Upsert progress error:', progressError);
    }

    // Check and award achievements
    const achievements = [];

    // First play achievement
    if ((progressData?.total_plays || 1) === 1) {
      achievements.push({
        user_id: userId,
        achievement_id: `first-play-${gameId}`,
        title_ar: 'لاعب جديد',
        title_en: 'First Player',
        description_ar: `لعبت ${gameId} للمرة الأولى`,
        description_en: `Played ${gameId} for the first time`,
        icon_emoji: '🎮',
      });
    }

    // Skilled achievement (500+ points)
    if (score && score >= 500) {
      achievements.push({
        user_id: userId,
        achievement_id: `skilled-${gameId}`,
        title_ar: 'لاعب ماهر',
        title_en: 'Skilled Player',
        description_ar: `حصلت على 500+ نقطة في ${gameId}`,
        description_en: `Scored 500+ points in ${gameId}`,
        icon_emoji: '⭐',
      });
    }

    // Master achievement (1000+ points)
    if (score && score >= 1000) {
      achievements.push({
        user_id: userId,
        achievement_id: `master-${gameId}`,
        title_ar: 'أسطورة',
        title_en: 'Legend',
        description_ar: `حصلت على 1000+ نقطة في ${gameId}`,
        description_en: `Scored 1000+ points in ${gameId}`,
        icon_emoji: '👑',
      });
    }

    // Collector achievement (50+ collectibles)
    if (collectibles && collectibles >= 50) {
      achievements.push({
        user_id: userId,
        achievement_id: `collector-${gameId}`,
        title_ar: 'جامع',
        title_en: 'Collector',
        description_ar: `جمعت 50+ أشياء في ${gameId}`,
        description_en: `Collected 50+ items in ${gameId}`,
        icon_emoji: '💎',
      });
    }

    // Insert achievements if any
    if (achievements.length > 0) {
      const { error: achievementError } = await supabase
        .from('kids_achievements')
        .insert(achievements)
        .select();

      if (achievementError && !achievementError.message?.includes('duplicate')) {
        console.error('[submit-result] Insert achievements error:', achievementError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        result: resultData,
        progress: progressData,
        achievementsAwarded: achievements.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[submit-result] Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('kids_game_progress').select('count(*)', { count: 'estimated', head: true });

    if (error) {
      return NextResponse.json(
        { status: 'unhealthy', error: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: 'healthy' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: String(error) },
      { status: 503 }
    );
  }
}
