import { getHadithBooks } from "@/features/hadith/services/hadith";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(await getHadithBooks(), {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[api/hadith/books] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}
