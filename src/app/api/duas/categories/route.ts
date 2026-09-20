import { getDuaCategories } from "@/features/dua/services/dua";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(await getDuaCategories(), {
      headers: {
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("[api/duas/categories] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
