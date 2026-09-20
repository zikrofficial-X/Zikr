import { NextResponse } from "next/server";
import { getPublishedCompanions } from "@/features/companions/services/companions";

export async function GET() {
  try {
    const companions = await getPublishedCompanions();
    return NextResponse.json(
      companions.map((companion) => ({
        id: companion.id,
        name_ar: companion.name_ar,
        name_en: companion.name_en,
        title_ar: companion.title_ar,
        bio_ar: companion.bio_ar,
        slug: companion.slug,
        category: companion.category,
      })),
    );
  } catch (error) {
    console.error("[api/content/companions] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companions" },
      { status: 500 },
    );
  }
}
