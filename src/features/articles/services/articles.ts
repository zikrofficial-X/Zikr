import { readFile } from "node:fs/promises";
import path from "node:path";

import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { normalizedText } from "@/lib/content-quality";
import type { ArticleCategory, Article } from "@/features/articles/types/articles";
import { staticArticles, type StaticArticle } from "@/features/articles/data/articles";
import { adsenseEditorialArticles } from "@/features/articles/data/adsense-editorial";

const MIN_PUBLIC_ARTICLE_CHARS = 1800;

const FALLBACK_CATEGORIES: ArticleCategory[] = [
  { id: "aqeedah", nameAr: "العقيدة", nameEn: "Aqeedah", slug: "aqeedah", icon: undefined },
  { id: "fiqh", nameAr: "الفقه", nameEn: "Fiqh", slug: "fiqh", icon: undefined },
  { id: "tazkiyah", nameAr: "التزكية", nameEn: "Tazkiyah", slug: "tazkiyah", icon: undefined },
  { id: "history", nameAr: "التاريخ والسيرة", nameEn: "History & Seerah", slug: "history", icon: undefined },
];

function hasSupabaseConfig(): boolean {
  const env = getPublicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function mapRow(row: Record<string, unknown>): Article {
  return {
    id: String(row.id),
    title: String(row.title ?? row.title_ar ?? ""),
    slug: String(row.slug),
    summary: typeof row.summary === "string" ? row.summary : typeof row.summary_ar === "string" ? row.summary_ar : undefined,
    content: typeof row.content === "string" ? row.content : typeof row.content_ar === "string" ? row.content_ar : undefined,
    author: typeof row.author === "string" ? row.author : undefined,
    featuredImageUrl: typeof row.featured_image_url === "string" ? row.featured_image_url : undefined,
    views: typeof row.views === "number" ? row.views : 0,
    published: row.published === true,
    categoryId: typeof row.category_id === "string" ? row.category_id : undefined,
    tags: Array.isArray(row.tags) ? row.tags.filter((item): item is string => typeof item === "string") : undefined,
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? row.metadata as Record<string, unknown>
      : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date(0).toISOString(),
  };
}

function mapStaticArticle(item: StaticArticle): Article {
  return {
    id: item.id,
    title: item.title_ar || item.title,
    slug: item.slug,
    summary: item.summary_ar || item.summary,
    content: item.content_ar || item.content,
    author: item.author,
    featuredImageUrl: item.featured_image_url ?? undefined,
    views: item.views,
    published: true,
    categoryId: item.category_id,
    tags: item.tags,
    metadata: item.metadata as Record<string, unknown> | undefined,
    createdAt: item.created_at,
  };
}

let offlineArticlesPromise: Promise<Article[]> | null = null;

async function loadOfflineArticles(): Promise<Article[]> {
  if (!offlineArticlesPromise) {
    offlineArticlesPromise = readFile(
      path.join(
        process.cwd(),
        "public",
        "offline-content",
        "v1",
        "articles.json",
      ),
      "utf8",
    ).then((raw) => {
      const rows = JSON.parse(raw) as Record<string, unknown>[];
      return rows
        .filter((row) => row.published === true)
        .map(mapRow)
        .filter(
          (article) =>
            article.slug &&
            normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS,
        );
    });
  }

  return offlineArticlesPromise;
}

const FALLBACK_ARTICLES: Article[] = Array.from(
  new Map(
    [...staticArticles, ...adsenseEditorialArticles]
      .map(mapStaticArticle)
      .filter(article => normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS)
      .map(article => [article.slug, article]),
  ).values(),
);

export async function getArticleCategories(): Promise<ArticleCategory[]> {
  if (!hasSupabaseConfig()) return FALLBACK_CATEGORIES;

  try {
    const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
      "/rest/v1/article_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&order=name_ar.asc",
      { cache: "force-cache", next: { revalidate: 1800 } },
    );

    if (rows.length > 0) {
      return rows.map(row => ({
        id: String(row.id),
        nameAr: String(row.name_ar ?? ""),
        nameEn: String(row.name_en ?? ""),
        slug: String(row.slug ?? ""),
        icon: typeof row.icon === "string" ? row.icon : undefined,
      }));
    }
  } catch (error) {
    console.error("[articles] Failed to fetch categories:", error);
  }

  return FALLBACK_CATEGORIES;
}

export async function getArticles(categoryId?: string, limit = 100): Promise<Article[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));

  if (hasSupabaseConfig()) {
    try {
      let query =
        "/rest/v1/articles?select=id,title,title_ar,slug,summary,summary_ar,content,content_ar,author,featured_image_url,views,published,category_id,tags,metadata,created_at&published=eq.true&order=created_at.desc";
      if (categoryId && categoryId !== "all") {
        query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
      }
      query += `&limit=${safeLimit}`;

      const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
        query,
        { cache: "force-cache", next: { revalidate: 1800 } },
      );

      const publicArticles = rows
        .map(mapRow)
        .filter(article => normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS);

      if (publicArticles.length > 0) {
        let offlineArticles: Article[] = [];
        try {
          offlineArticles = await loadOfflineArticles();
        } catch (error) {
          console.error("[articles] Offline catalogue unavailable:", error);
        }

        return Array.from(
          new Map(
            [...offlineArticles, ...publicArticles].map((article) => [
              article.slug,
              article,
            ]),
          ).values(),
        )
          .filter(
            (article) =>
              !categoryId ||
              categoryId === "all" ||
              article.categoryId === categoryId,
          )
          .slice(0, safeLimit);
      }
    } catch (error) {
      console.error("[articles] Failed to fetch published articles:", error);
    }
  }

  let offline = FALLBACK_ARTICLES;
  try {
    const localArticles = await loadOfflineArticles();
    if (localArticles.length > 0) offline = localArticles;
  } catch (error) {
    console.error("[articles] Offline catalogue unavailable:", error);
  }

  const fallback = categoryId && categoryId !== "all"
    ? offline.filter(article => article.categoryId === categoryId)
    : offline;

  return fallback.slice(0, safeLimit);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const safeSlug = slug?.trim();
  if (!safeSlug) return null;

  if (hasSupabaseConfig()) {
    try {
      const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
        `/rest/v1/articles?select=id,title,title_ar,slug,summary,summary_ar,content,content_ar,author,featured_image_url,views,published,category_id,tags,metadata,created_at&slug=eq.${encodeURIComponent(safeSlug)}&published=eq.true&limit=1`,
        { cache: "force-cache", next: { revalidate: 1800 } },
      );
      const article = rows[0] ? mapRow(rows[0]) : null;
      if (article && normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS) {
        return article;
      }
    } catch (error) {
      console.error("[articles] Failed to fetch article:", error);
    }
  }

  try {
    const offlineArticles = await loadOfflineArticles();
    const offlineMatch = offlineArticles.find(
      (article) => article.slug === safeSlug,
    );
    if (offlineMatch) return offlineMatch;
  } catch (error) {
    console.error("[articles] Offline article catalogue unavailable:", error);
  }

  return FALLBACK_ARTICLES.find(article => article.slug === safeSlug) ?? null;
}
