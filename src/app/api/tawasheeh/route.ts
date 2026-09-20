import { NextRequest, NextResponse } from "next/server";
import { getTawasheeh } from "@/features/audio/services/tawasheeh";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const limit = Number.parseInt(params.get("limit") ?? "20", 10);
  const offset = Number.parseInt(params.get("offset") ?? "0", 10);

  try {
    const result = await getTawasheeh({
      category: params.get("category") ?? undefined,
      search: params.get("search") ?? undefined,
      featured: params.get("featured") === "true",
      limit,
      offset,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[api/tawasheeh] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tawasheeh data" },
      { status: 500 },
    );
  }
}
