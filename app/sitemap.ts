import type { MetadataRoute } from "next";

import { getAllScholars } from "@/lib/services/scholars";
import { getHadithBooks } from "@/lib/services/hadith";
import { getStories } from "@/lib/services/stories";
import { reciters, surahs as fallbackSurahs } from "@/lib/data/content";
import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { appRoutes, siteConfig } from "@/lib/site";
import type { Surah } from "@/lib/types/quran";
import type { Scholar } from "@/lib/services/scholars";
import type { HadithBook } from "@/lib/types/hadith";
import type { Story } from "@/lib/services/stories";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SitemapEntry = MetadataRoute.Sitemap[number];
type SlugRow = { slug: string };

// Build-time fallback slugs mirror the currently published Supabase content.
// Runtime generation still merges the live database slugs below.
const STATIC_PROPHET_SLUGS = [
  "adam",
  "idris",
  "nuh",
  "hud",
  "salih",
  "ibrahim",
  "lut",
  "ismail",
  "ishaq",
  "yaqub",
  "yusuf",
  "ayyub",
  "shuayb",
  "musa",
  "harun",
  "dhulkifl",
  "yunus",
  "dawud",
  "sulayman",
  "ilyas",
  "alyasa",
  "zakariya",
  "yahya",
  "isa",
  "muhammad",
] as const;

const STATIC_BATTLE_SLUGS = [
  "badr",
  "uhud",
  "khandaq",
  "khaybar",
  "hunayn",
  "waddan",
  "buwat",
  "ushayra",
  "safwan",
  "qarqarat-kudr",
  "banu-qaynuqa",
  "sawiq",
  "banu-nadir",
  "dumat-al-jandal",
  "banu-qurayza",
  "muraysi",
  "dhat-riqa",
  "mu-tah",
  "dhat-salasil",
  "tabuk",
  "taif",
  // This is a supported static story even though it is not a live DB row.
  "fathmakka",
] as const;

function range(count: number) {
  return Array.from({ length: Math.max(0, count) }, (_, index) => index + 1);
}

async function getPublishedSlugs(table: "companions" | "conquests") {
  return supabaseServerAnonRequest<SlugRow[]>(
    `/rest/v1/${table}?select=slug&published=eq.true&order=slug.asc`
  ).catch((error): SlugRow[] => {
    console.error(`[sitemap] ${table} fetch failed:`, error);
    return [];
  });
}

// Routes that redirect for anonymous visitors or are otherwise not useful as
// landing pages must not appear in the public sitemap. Google crawlers,
// including AdSense review crawlers, expect sitemap URLs to resolve directly
// to indexable public content instead of login redirects.
const NON_INDEXABLE_PATHS = new Set([
  "/admin",
  "/api",
  "/auth",
  "/favorites",
  "/profile",
  "/settings",
  "/wird",
  "/memorization",
]);

const EXTRA_PUBLIC_ROUTES = [
  {
    path: "/kids/puzzle",
    sitemap: { changeFrequency: "monthly", priority: 0.5 },
  },
] as const;

function isIndexablePath(path: string) {
  return !Array.from(NON_INDEXABLE_PATHS).some(
    blockedPath => path === blockedPath || path.startsWith(`${blockedPath}/`)
  );
}

function siteConfigRoutes() {
  return [...appRoutes, ...EXTRA_PUBLIC_ROUTES].filter(r =>
    isIndexablePath(r.path)
  );
}

function route(path = "", options: Omit<SitemapEntry, "url">): SitemapEntry {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  return {
    url: `${baseUrl}${path}`,
    ...options,
  };
}

function uniqueRoutes(routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return Array.from(new Map(routes.map(entry => [entry.url, entry])).values());
}

const SITEMAP_PAGE_SIZE = 45_000;
let sitemapCache: { entries: MetadataRoute.Sitemap; expiresAt: number } | null = null;

async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  if (sitemapCache && sitemapCache.expiresAt > Date.now()) return sitemapCache.entries;

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = siteConfigRoutes().map(appRoute =>
    route(appRoute.path === "/" ? "" : appRoute.path, {
      lastModified: now,
      changeFrequency: appRoute.sitemap.changeFrequency,
      priority: appRoute.sitemap.priority,
    })
  );
  try {

    const [
      surahs,
      scholars,
      hadithBooks,
      stories,
      articles,
      videos,
      prophets,
      duas,
      kidsContent,
      battles,
      companions,
      conquests,
    ] = await Promise.all([
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
      import("@/lib/services/content")
        .then(m => m.getArticles())
        .catch(() => []),
      import("@/lib/services/content").then(m => m.getVideos()).catch(() => []),
      import("@/lib/services/content")
        .then(m => m.getProphets())
        .catch(() => []),
      import("@/lib/services/content").then(m => m.getDuas()).catch(() => []),
      import("@/lib/services/content")
        .then(m => m.getKidsContent())
        .catch(() => []),
      import("@/lib/services/content")
        .then(m => m.getBattles())
        .catch(() => []),
      getPublishedSlugs("companions"),
      getPublishedSlugs("conquests"),
    ]);

    const dynamicRoutes: MetadataRoute.Sitemap = [
      ...surahs.map(surah =>
        route(`/quran/${surah.number}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.8,
        })
      ),
      ...surahs.flatMap(surah =>
        range(surah.numberOfAyahs).map(ayah =>
          route(`/quran/${surah.number}/${ayah}`, {
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.6,
          })
        )
      ),
      ...scholars.map(scholar =>
        route(`/scholars/${scholar.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...reciters.map(reciter =>
        route(`/reciters/${reciter.id}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...hadithBooks.map(book =>
        route(`/hadith/${book.slug ?? book.id}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...hadithBooks.flatMap(book => {
        const bookPath = book.slug ?? book.id;
        return range(book.available).map(hadithNumber =>
          route(`/hadith/${bookPath}/${hadithNumber}`, {
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.5,
          })
        );
      }),
      ...stories.map(story =>
        route(`/stories/${story.slug}`, {
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      ),
      ...articles.map(article =>
        route(`/articles/${article.slug}`, {
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      ),
      ...videos.map(video =>
        route(`/videos/${video.slug}`, {
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      ),
      ...STATIC_PROPHET_SLUGS.map(slug =>
        route(`/prophets/${slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...prophets.map(prophet =>
        route(`/prophets/${prophet.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...duas.map(dua =>
        route(`/dua/${dua.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...kidsContent.map(kid =>
        route(`/kids/${kid.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...STATIC_BATTLE_SLUGS.map(slug =>
        route(`/battles/${slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...battles.map((battle: { slug: string }) =>
        route(`/battles/${battle.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...companions.map(companion =>
        route(`/companions/${companion.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
      ...conquests.map(conquest =>
        route(`/conquests/${conquest.slug}`, {
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      ),
    ];

    const entries = uniqueRoutes([...staticRoutes, ...dynamicRoutes]);
    sitemapCache = { entries, expiresAt: Date.now() + 15 * 60 * 1000 };
    return entries;
  } catch (error) {
    console.error("[sitemap] Error generating dynamic routes:", error);
    sitemapCache = { entries: staticRoutes, expiresAt: Date.now() + 5 * 60 * 1000 };
    return staticRoutes;
  }
}

export async function getSitemapShardCount() {
  const entries = await getSitemapEntries();
  return Math.max(1, Math.ceil(entries.length / SITEMAP_PAGE_SIZE));
}

export async function getSitemapPage(id: number): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  const safeId = Math.max(0, Math.floor(id));
  const start = safeId * SITEMAP_PAGE_SIZE;
  return entries.slice(start, start + SITEMAP_PAGE_SIZE);
}

export async function generateSitemaps() {
  const count = await getSitemapShardCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  return getSitemapPage(Number(await props.id) || 0);
}
