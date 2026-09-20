import { NextResponse } from "next/server";
import { getContentStats } from "@/features/content/services/stats";

export const dynamic = "force-dynamic";

const CONTENT_TABLES = {
  quranSurahs: "quran_surahs",
  quranAyahs: "quran_ayahs",
  quranTafsir: "quran_tafsir",
  hadiths: "hadiths",
  duas: "duas",
  articles: "articles",
  prophets: "prophets",
  companions: "companions",
  scholars: "scholars",
  battles: "battles",
  conquests: "conquests",
  kidsContent: "kids_content",
} as const;

const PUBLISHED_TABLES = new Set([
  "articles",
  "duas",
  "prophets",
  "companions",
  "scholars",
  "battles",
  "conquests",
  "kids_content",
]);

export async function GET() {
  try {
    const payload = await getContentStats();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load library statistics" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
