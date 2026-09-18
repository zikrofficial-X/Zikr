import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    const entries = await Promise.all(
      Object.entries(CONTENT_TABLES).map(async ([key, table]) => {
        let query = supabase
          .from(table)
          .select("id", { count: "exact", head: true });
        if (PUBLISHED_TABLES.has(table)) query = query.eq("published", true);
        const { count, error } = await query;
        return [key, error ? null : count ?? 0] as const;
      }),
    );

    return NextResponse.json(
      { data: Object.fromEntries(entries), generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load library statistics" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
