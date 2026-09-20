import { NextResponse } from "next/server";
import { getTawasheehCategories } from "@/features/audio/services/tawasheeh";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(
      { data: await getTawasheehCategories() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("[api/tawasheeh/categories] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
