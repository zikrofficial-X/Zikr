import { NextResponse } from "next/server";
import { getProphets } from "@/features/prophets/services/prophets";

export async function GET() {
  try {
    const prophets = await getProphets();
    return NextResponse.json(
      prophets.map((prophet) => ({
        id: prophet.id,
        name_ar: prophet.nameAr,
        name_en: prophet.nameEn,
        slug: prophet.slug,
        bio_ar: prophet.bioAr ?? null,
        bio_en: prophet.bioEn ?? null,
        birth_place_ar: prophet.birthPlaceAr ?? null,
        death_place_ar: prophet.deathPlaceAr ?? null,
        featured_image_url: prophet.featuredImageUrl ?? null,
        thumbnail_url: prophet.thumbnailUrl ?? null,
        order_num: prophet.orderNum ?? null,
        metadata: prophet.metadata ?? null,
        published: prophet.published,
      })),
    );
  } catch (error) {
    console.error("[api/content/prophets] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prophets" },
      { status: 500 },
    );
  }
}
