import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { normalizedText } from "@/lib/content-quality";
import type { ArticleCategory, Article } from "@/features/articles/types/articles";
import { staticArticles, type StaticArticle } from "@/features/articles/data/articles";
import { adsenseEditorialArticles } from "@/features/articles/data/adsense-editorial";
import { resolveCanonicalPublished } from "@/lib/data/content-merge";
import { extendedEditorialArticles } from "@/features/articles/data/extended-editorial";
import type { Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

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

function isUnavailableArticlesTable(error: unknown): boolean {
  return error instanceof Error && error.message.includes("PGRST205") && error.message.includes("public.articles");
}

function mapRow(row: Record<string, unknown>, locale: Locale): Article {
  const titleAr = typeof row.title_ar === "string" ? row.title_ar : typeof row.title === "string" ? row.title : "";
  const titleEn = typeof row.title_en === "string" ? row.title_en : null;
  const summaryAr = typeof row.summary_ar === "string" ? row.summary_ar : typeof row.summary === "string" ? row.summary : null;
  const summaryEn = typeof row.summary_en === "string" ? row.summary_en : null;
  const contentAr = typeof row.content_ar === "string" ? row.content_ar : typeof row.content === "string" ? row.content : null;
  const contentEn = typeof row.content_en === "string" ? row.content_en : null;

  return {
    id: String(row.id),
    title: locale === "en" ? (titleEn ?? "") : titleAr,
    slug: String(row.slug),
    summary: locale === "en" ? summaryEn ?? undefined : summaryAr ?? undefined,
    content: locale === "en" ? contentEn ?? undefined : contentAr ?? undefined,
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

function mapStaticArticle(item: StaticArticle, locale: Locale): Article {
  return {
    id: item.id,
    title: locale === "en" ? item.title_en ?? "" : item.title_ar || item.title,
    slug: item.slug,
    summary: locale === "en" ? item.summary_en ?? undefined : item.summary_ar || item.summary,
    content: locale === "en" ? item.content_en ?? undefined : item.content_ar || item.content,
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

const offlineArticlesPromise = new Map<Locale, Promise<Article[]>>();

async function loadOfflineArticles(locale: Locale): Promise<Article[]> {
  if (!offlineArticlesPromise.has(locale)) {
    offlineArticlesPromise.set(locale, readFile(
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
        .map((row) => mapRow(row, locale))
        .filter(
          (article) =>
            article.slug &&
            article.title &&
            normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS,
        );
    }));
  }

  return offlineArticlesPromise.get(locale) ?? Promise.resolve([]);
}

function getFallbackArticles(locale: Locale): Article[] {
  return Array.from(
    new Map(
      [...staticArticles, ...adsenseEditorialArticles, ...extendedEditorialArticles]
        .map((article) => mapStaticArticle(article, locale))
        .filter(
          (article) =>
            article.slug &&
            article.title &&
            normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS,
        )
        .map((article) => [article.slug, article]),
    ).values(),
  );
}

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

export async function getArticles(categoryId?: string, limit = 100, locale?: Locale): Promise<Article[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const activeLocale = locale ?? await getRequestLocale();

  if (hasSupabaseConfig()) {
    try {
      let query =
        "/rest/v1/articles?select=id,title,title_ar,title_en,slug,summary,summary_ar,summary_en,content,content_ar,content_en,author,featured_image_url,views,published,category_id,tags,metadata,created_at&published=eq.true&order=created_at.desc";
      if (categoryId && categoryId !== "all") {
        query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
      }
      query += `&limit=${safeLimit}`;

      const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
        query,
        { cache: "force-cache", next: { revalidate: 1800 } },
      );

      const publicArticles = rows
        .map((row) => mapRow(row, activeLocale))
        .filter(article => article.title && normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS);

      if (publicArticles.length > 0) {
        let offlineArticles: Article[] = [];
        try {
          offlineArticles = await loadOfflineArticles(activeLocale);
        } catch (error) {
          console.error("[articles] Offline catalogue unavailable:", error);
        }

        return resolveCanonicalPublished(publicArticles, [...offlineArticles, ...getFallbackArticles(activeLocale)])
          .filter(
            (article) =>
              !categoryId ||
              categoryId === "all" ||
              article.categoryId === categoryId,
          )
          .slice(0, safeLimit);
      }
    } catch (error) {
      if (!isUnavailableArticlesTable(error)) {
        console.error("[articles] Failed to fetch published articles:", error);
      }
    }
  }

  let offline = getFallbackArticles(activeLocale);
  try {
    const localArticles = await loadOfflineArticles(activeLocale);
    if (localArticles.length > 0) offline = localArticles;
  } catch (error) {
    console.error("[articles] Offline catalogue unavailable:", error);
  }

  const fallback = categoryId && categoryId !== "all"
    ? offline.filter(article => article.categoryId === categoryId)
    : offline;

  return fallback.slice(0, safeLimit);
}

export async function getArticleBySlug(slug: string, locale?: Locale): Promise<Article | null> {
  const activeLocale = locale ?? await getRequestLocale();
  const safeSlug = slug?.trim();
  if (!safeSlug) return null;

  if (hasSupabaseConfig()) {
    try {
      const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
        `/rest/v1/articles?select=id,title,title_ar,title_en,slug,summary,summary_ar,summary_en,content,content_ar,content_en,author,featured_image_url,views,published,category_id,tags,metadata,created_at&slug=eq.${encodeURIComponent(safeSlug)}&published=eq.true&limit=1`,
        { cache: "force-cache", next: { revalidate: 1800 } },
      );
      const article = rows[0] ? mapRow(rows[0], activeLocale) : null;
      if (article && normalizedText(article.content).length >= MIN_PUBLIC_ARTICLE_CHARS) {
        return article;
      }
    } catch (error) {
      if (!isUnavailableArticlesTable(error)) {
        console.error("[articles] Failed to fetch article:", error);
      }
    }
  }

  try {
    const offlineArticles = await loadOfflineArticles(activeLocale);
    const offlineMatch = offlineArticles.find(
      (article) => article.slug === safeSlug,
    );
    if (offlineMatch) return offlineMatch;
  } catch (error) {
    console.error("[articles] Offline article catalogue unavailable:", error);
  }

  return getFallbackArticles(activeLocale).find(article => article.slug === safeSlug) ?? null;
}
