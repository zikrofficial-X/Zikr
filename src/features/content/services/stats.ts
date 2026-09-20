import "server-only";

import { createClient } from "@/lib/supabase/server";

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

export type ContentStats = Record<keyof typeof CONTENT_TABLES, number | null>;

export async function getContentStats(): Promise<{
  data: ContentStats;
  generatedAt: string;
}> {
  const supabase = await createClient();

  const entries = await Promise.all(
    Object.entries(CONTENT_TABLES).map(async ([key, table]) => {
      let query = supabase
        .from(table)
        .select("id", { count: "exact", head: true });

      if (PUBLISHED_TABLES.has(table)) {
        query = query.eq("published", true);
      }

      const { count, error } = await query;
      return [key, error ? null : count ?? 0] as const;
    }),
  );

  return {
    data: Object.fromEntries(entries) as ContentStats,
    generatedAt: new Date().toISOString(),
  };
}
