import { getAllSurahsFromDb } from "@/features/quran/services/quran-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const surahs = await getAllSurahsFromDb("ar");

    if (!surahs || surahs.length !== 114) {
      throw new Error(
        `Canonical Quran catalog must contain 114 surahs, received ${surahs?.length ?? 0}`,
      );
    }

    return NextResponse.json(
      surahs.map((surah) => ({
        id: surah.number,
        name_ar: surah.name,
        name_en: surah.englishName,
        name_translation: surah.englishNameTranslation || null,
        revelation_place: surah.revelationType || null,
        ayahs_count: surah.numberOfAyahs,
      })),
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[api/quran/surahs] canonical Quran unavailable:", error);
    return NextResponse.json(
      { error: "Canonical Quran data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
