import type { MetadataRoute } from "next";

import { getAllScholars } from "@/lib/services/scholars";
import { getHadithBooks } from "@/lib/services/hadith";
import { getStories } from "@/lib/services/stories";
import { surahs as fallbackSurahs } from "@/lib/data/content";
import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { appRoutes, siteConfig } from "@/lib/site";
import { staticArticles } from "@/lib/data/articles";
import { adsenseEditorialArticles } from "@/lib/data/adsense-editorial";
import type { Surah } from "@/lib/types/quran";
import type { Scholar } from "@/lib/services/scholars";
import type { HadithBook } from "@/lib/types/hadith";
import type { Story } from "@/lib/services/stories";

/**
 * Sitemap is public infrastructure. Avoid forcing a fresh server render on
 * every crawler request because the URL inventory reads several data sources.
 * ISR keeps the XML stable while still refreshing the inventory hourly.
 */
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];
type SlugRow = { slug: string };

const STATIC_PROPHET_SLUGS = [
  "adam", "idris", "nuh", "hud", "salih", "ibrahim", "lut", "ismail",
  "ishaq", "yaqub", "yusuf", "ayyub", "shuayb", "musa", "harun",
  "dhulkifl", "yunus", "dawud", "sulayman", "ilyas", "alyasa", "zakariya",
  "yahya", "isa", "muhammad",
] as const;

const STATIC_BATTLE_SLUGS = [
  "badr", "uhud", "khandaq", "khaybar", "hunayn", "waddan", "buwat",
  "ushayra", "safwan", "qarqarat-kudr", "banu-qaynuqa", "sawiq", "banu-nadir",
  "dumat-al-jandal", "banu-qurayza", "muraysi", "dhat-riqa", "mu-tah",
  "dhat-salasil", "tabuk", "taif", "fathmakka",
] as const;

const MIN_INDEXABLE_EDITORIAL_CHARS = 1800;
const SITEMAP_URL_LIMIT = 50_000;

async function getPublishedSlugs(table: "companions" | "conquests") {
  return supabaseServerAnonRequest<SlugRow[]>(
    `/rest/v1/${table}?select=slug&published=eq.true&order=slug.asc`,
  ).catch((error): SlugRow[] => {
    console.error(`[sitemap] ${table} fetch failed:`, error);
    return [];
  });
}

const NON_INDEXABLE_PATHS = new Set([
  "/admin",
  "/api",
  "/auth",
  "/favorites",
  "/profile",
  "/settings",
  "/search",
  "/qibla",
  "/prayer-times",
  "/tasbeeh",
  "/memorization",
  "/wird",
  "/zakat",
  "/offline-library",
  "/spiritual-ai",
  "/competitions",
  "/radio",
  "/youtube",
  "/videos",
  "/reciters",
  "/tawasheeh",
]);

function isIndexablePath(path: string) {
  return !Array.from(NON_INDEXABLE_PATHS).some(
    blockedPath => path === blockedPath || path.startsWith(`${blockedPath}/`),
  );
}

function siteConfigRoutes() {
  return appRoutes.filter(r => isIndexablePath(r.path));
}

function route(path = "", options: Omit<SitemapEntry, "url">): SitemapEntry {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  return { url: `${baseUrl}${path}`, ...options };
}

function uniqueRoutes(routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return Array.from(new Map(routes.map(entry => [entry.url, entry])).values());
}

let sitemapCache: { entries: MetadataRoute.Sitemap; expiresAt: number } | null = null;

/**
 * Build a sitemap from public, indexable routes. Dynamic source failures never
 * invalidate the whole sitemap: the static route inventory is always retained.
 */
export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  if (sitemapCache && sitemapCache.expiresAt > Date.now()) return sitemapCache.entries;

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = siteConfigRoutes().map(appRoute =>
    route(appRoute.path === "/" ? "" : appRoute.path, {
      lastModified: now,
      changeFrequency: appRoute.sitemap.changeFrequency,
      priority: appRoute.sitemap.priority,
    }),
  );

  try {
    const [surahs, scholars, hadithBooks, stories, articles, prophets, duas, kidsContent, battles, companions, conquests] =
      await Promise.all([
        Promise.resolve(
          fallbackSurahs.map(
            surah =>
              ({
                number: surah.id,
                name: surah.nameAr,
                englishName: surah.nameEn,
                englishNameTranslation: "",
                numberOfAyahs: surah.ayahCount,
                revelationType: surah.revelationPlace === "meccan" ? "Meccan" : "Medinan",
              }) satisfies Surah,
          ),
        ),
        getAllScholars().catch((error): Scholar[] => {
          console.error("[sitemap] Scholars fetch failed:", error);
          return [];
        }),
        getHadithBooks().catch((error): HadithBook[] => {
          console.error("[sitemap] Hadith fetch failed:", error);
          return [];
        }),
        getStories().catch((error): Story[] => {
          console.error("[sitemap] Stories fetch failed:", error);
          return [];
        }),
        import("@/lib/services/content").then(m => m.getArticles(undefined, 1000)).catch(() => []),
        import("@/lib/services/content").then(m => m.getProphets()).catch(() => []),
        import("@/lib/services/content").then(m => m.getDuas()).catch(() => []),
        import("@/lib/services/content").then(m => m.getKidsContent()).catch(() => []),
        import("@/lib/services/content").then(m => m.getBattles()).catch(() => []),
        getPublishedSlugs("companions"),
        getPublishedSlugs("conquests"),
      ]);

    const dynamicRoutes: MetadataRoute.Sitemap = [
      ...surahs.map(surah =>
        route(`/quran/${surah.number}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.8,
        }),
      ),
      ...scholars.map(scholar =>
        route(`/scholars/${scholar.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...hadithBooks.map(book =>
        route(`/hadith/${book.slug ?? book.id}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...stories
        .filter(story => (story.content?.trim().length ?? 0) >= MIN_INDEXABLE_EDITORIAL_CHARS)
        .map(story =>
          route(`/stories/${story.slug}`, {
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
          }),
        ),
      ...Array.from(
        new Map(
          [
            ...articles,
            ...staticArticles.map(article => ({
              slug: article.slug,
              content: article.content_ar,
            })),
            ...adsenseEditorialArticles.map(article => ({
              slug: article.slug,
              content: article.content_ar,
            })),
          ].map(article => [article.slug, article] as const),
        ).values(),
      )
        .filter(article => (article.content?.trim().length ?? 0) >= MIN_INDEXABLE_EDITORIAL_CHARS)
        .map(article =>
          route(`/articles/${article.slug}`, {
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
          }),
        ),
      ...STATIC_PROPHET_SLUGS.map(slug =>
        route(`/prophets/${slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...prophets.map(prophet =>
        route(`/prophets/${prophet.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...duas
        .filter(dua => (dua.textAr?.trim().length ?? 0) >= 80)
        .map(dua =>
          route(`/dua/${dua.slug}`, {
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.7,
          }),
        ),
      ...kidsContent
        .filter(kid => (kid.contentAr?.trim().length ?? 0) >= 250 || Boolean(kid.quiz_data))
        .map(kid =>
          route(`/kids/${kid.slug}`, {
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.7,
          }),
        ),
      ...STATIC_BATTLE_SLUGS.map(slug =>
        route(`/battles/${slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...battles.map((battle: { slug: string }) =>
        route(`/battles/${battle.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...companions.map(companion =>
        route(`/companions/${companion.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
      ...conquests.map(conquest =>
        route(`/conquests/${conquest.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        }),
      ),
    ];

    const entries = uniqueRoutes([...staticRoutes, ...dynamicRoutes]);
    const safeEntries = entries.slice(0, SITEMAP_URL_LIMIT);
    sitemapCache = { entries: safeEntries, expiresAt: Date.now() + 60 * 60 * 1000 };
    return safeEntries;
  } catch (error) {
    console.error("[sitemap] Error generating dynamic routes:", error);
    const fallbackEntries = uniqueRoutes(staticRoutes).slice(0, SITEMAP_URL_LIMIT);
    sitemapCache = { entries: fallbackEntries, expiresAt: Date.now() + 10 * 60 * 1000 };
    return fallbackEntries;
  }
}

export async function getSitemapShardCount(): Promise<number> {
  const entries = await getSitemapEntries();
  return Math.max(1, Math.ceil(entries.length / SITEMAP_URL_LIMIT));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  return entries.slice(0, SITEMAP_URL_LIMIT);
}
