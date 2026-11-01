import { recordCurrentKidsGameResult } from "@/features/kids/services/games";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 16_384) {
    return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
      return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
    }
    body = JSON.parse(rawBody);
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
