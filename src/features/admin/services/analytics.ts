import "server-only";

import { createClient, supabaseServerAdminCount } from "@/lib/supabase/server";

export interface TopArticle {
  id: string;
  title: string;
  views: number;
  slug: string;
}

const CONTENT_TABLES = [
  "articles",
  "stories",
  "duas",
  "prophets",
  "companions",
  "scholars",
  "videos",
  "quran_surahs",
] as const;

export async function getAdminAnalytics() {
  const [counts, topArticles, userCount] = await Promise.all([
    Promise.all(CONTENT_TABLES.map((table) => supabaseServerAdminCount(table))),
    getTopArticles(),
    supabaseServerAdminCount("profiles"),
  ]);

  return {
    stats: Object.fromEntries(
      CONTENT_TABLES.map((table, index) => [table, counts[index]]),
    ) as Record<(typeof CONTENT_TABLES)[number], number>,
    topArticles,
    userCount,
  };
}

async function getTopArticles(): Promise<TopArticle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, views, slug")
      .eq("published", true)
      .order("views", { ascending: false })
      .limit(10);

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      views: row.views ?? 0,
      slug: row.slug,
    }));
  } catch (error) {
    console.error("[admin/analytics] failed to load top articles:", error);
    return [];
  }
}
