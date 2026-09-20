import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/features/search/services/search";

const SEARCH_CACHE_TTL_MS = 60_000;
const SEARCH_CACHE_MAX_ENTRIES = 100;
const searchCache = new Map<
  string,
  { expiresAt: number; results: Awaited<ReturnType<typeof globalSearch>> }
>();

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) return NextResponse.json([]);
  if (query.length > 100) {
    return NextResponse.json(
      { error: "Search query is too long." },
      { status: 400 },
    );
  }

  const cached = searchCache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.results);
  }
  if (cached) searchCache.delete(query);

  try {
    const results = await globalSearch(query);
    searchCache.set(query, {
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
      results,
    });

    if (searchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }

    return NextResponse.json(results, {
      headers: {
        "Cache-Control":
          "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[api/search] GET error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 },
    );
  }
}
