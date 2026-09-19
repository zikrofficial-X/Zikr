import { createClient } from "@/lib/supabase/server";
import { getCanonicalAyahCount } from "@/features/quran/utils/surah-mapping";
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: surahs, error } = await supabase
      .from("quran_surahs")
      .select("id,name_ar,name_en,name_translation,revelation_place,ayahs_count")
      .order("id", { ascending: true });

    if (error) throw error;
    if (!surahs || surahs.length !== 114) {
      throw new Error(`Canonical Quran catalog must contain 114 surahs, received ${surahs?.length ?? 0}`);
    }

    return NextResponse.json(
      surahs.map(surah => ({
        ...surah,
        ayahs_count:
          typeof surah.ayahs_count === "number" && surah.ayahs_count > 0
            ? surah.ayahs_count
            : getCanonicalAyahCount(Number(surah.id)),
      })),
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[api/quran/surahs] canonical Supabase Quran unavailable:", error);
    return NextResponse.json(
      { error: "Canonical Quran data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
