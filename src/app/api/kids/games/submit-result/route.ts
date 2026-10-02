import { recordKidsGameResultForUser } from "@/features/kids/services/games";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function getPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) throw new Error("Supabase public configuration missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401, headers: { Deprecation: "true" } },
    );
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { Deprecation: "true" } },
    );
  }

  try {
    const supabase = getPublicSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { Deprecation: "true" } },
      );
    }

    const body = await request.json();
    const legacyBody =
      body && typeof body === "object" ? body as Record<string, unknown> : {};

    const normalized = {
      gameId: legacyBody.gameId,
      score: legacyBody.score,
      collectibles: legacyBody.collectibles,
      distance: legacyBody.distance ?? 0,
      difficulty: legacyBody.difficulty,
      level: legacyBody.level ?? 1,
      combo: legacyBody.combo ?? 0,
      timeSeconds: legacyBody.timeSeconds ?? legacyBody.duration ?? 0,
      completed: legacyBody.completed === true,
      clientSubmissionId:
        typeof legacyBody.clientSubmissionId === "string" &&
        legacyBody.clientSubmissionId.length >= 8
          ? legacyBody.clientSubmissionId
          : `legacy_${randomUUID().replaceAll("-", "")}`,
      metadata: {
        legacyRoute: true,
      },
    };

    const result = await recordKidsGameResultForUser(user.id, normalized);
    return NextResponse.json(result, {
      status: result.success ? 200 : result.status,
      headers: {
        Deprecation: "true",
        Sunset: "2026-12-01",
        Link: '</api/kids/games/score>; rel="successor-version"',
      },
    });
  } catch (error) {
    console.error(
      "[api/kids/games/submit-result] unexpected error",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "Could not save game result" },
      {
        status: 500,
        headers: { Deprecation: "true" },
      },
    );
  }
}

// The old unauthenticated health probe is intentionally removed.
// Operational health checks belong to authenticated/internal health paths.
export function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", Deprecation: "true" } },
  );
}
