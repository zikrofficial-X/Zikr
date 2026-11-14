import { recordCurrentKidsGameResult } from "@/features/kids/services/games";
import { MAX_REQUEST_BODY_BYTES, readBoundedJsonBody } from "@/lib/request/bounded-json-body";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const unavailable = requireSupabaseAuth();
  if (unavailable) return unavailable;

  const parsedBody = await readBoundedJsonBody(request, MAX_REQUEST_BODY_BYTES);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: parsedBody.status },
    );
  }
  const body = parsedBody.value;

  try {
    const result = await recordCurrentKidsGameResult(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        {
          status: result.status,
          headers: result.status === 429 ? { "Retry-After": "60" } : undefined,
        },
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
