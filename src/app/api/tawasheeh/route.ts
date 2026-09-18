import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Uses request.url and cookies — can never be statically rendered.
export const dynamic = "force-dynamic";

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max?: number
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max === undefined ? parsed : Math.min(parsed, max);
}

function parseNonNegativeInt(value: string | null, fallback = 0): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 100);
    const offset = parseNonNegativeInt(searchParams.get("offset"));
    const featured = searchParams.get("featured") === "true";

    // The client page has a verified static fallback for offline/development mode.
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, limit, offset, hasMore: false },
      });
    }

    const supabase = await createClient();

    let query = supabase
      .from("tawasheeh")
      .select(
        `
        id,
        title_ar,
        title_en,
        slug,
        description_ar,
        description_en,
        artist_ar,
        artist_en,
        duration,
        views,
        featured,
        audio_url,
        thumbnail_url,
        metadata,
        category:tawasheeh_categories(id, name_ar, name_en, slug, icon),
        created_at,
        updated_at
        `,
        { count: "exact" }
      )
      .eq("published", true)
      .not("audio_url", "is", null)
      .range(offset, offset + limit - 1)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq("category_id", category);
    }

    // Filter by featured if requested
    if (featured) {
      query = query.eq("featured", true);
    }

    // Search by title or artist if provided
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `title_ar.ilike.${searchTerm},title_en.ilike.${searchTerm},artist_ar.ilike.${searchTerm},artist_en.ilike.${searchTerm}`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[tawasheeh-api] Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tawasheeh data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: offset + limit < (count || 0),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[tawasheeh-api] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
