import { NextRequest, NextResponse } from "next/server";
import { getDuas } from "@/features/dua/services/dua";

export async function GET(request: NextRequest) {
  const categoryId =
    request.nextUrl.searchParams.get("category")?.trim() || undefined;

  try {
    const duas = await getDuas(categoryId, 100);
    return NextResponse.json(
      duas.map((dua) => ({
        id: dua.id,
        title_ar: dua.titleAr,
        title_en: dua.titleEn,
        slug: dua.slug,
        text_ar: dua.textAr,
        text_en: dua.textEn ?? null,
        occasion_ar: dua.occasionAr ?? null,
        source_ar: dua.sourceAr ?? null,
        benefits_ar: dua.benefitsAr ?? null,
        category_id: dua.categoryId ?? null,
        published: dua.published,
      })),
    );
  } catch (error) {
    console.error("[api/duas] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch duas" },
      { status: 500 },
    );
  }
}
