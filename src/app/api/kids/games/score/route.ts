import { recordCurrentKidsGameResult } from "@/features/kids/services/games";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  try {
    const result = await recordCurrentKidsGameResult(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "[api/kids/games/score] unexpected error",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "Could not save game result" },
      { status: 500 },
    );
  }
}
