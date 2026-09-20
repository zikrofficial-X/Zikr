import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";
import { mergePublishedBySlug } from "@/lib/data/content-merge";
import { COMPANIONS } from "@/features/companions/data/fallback";
import { uniqueCompanionSummaries } from "@/features/companions/utils/companions";

export type CompanionSummary = {
  id: string;
  name_ar: string;
  name_en: string | null;
  title_ar: string | null;
  bio_ar: string | null;
  slug: string;
  category: string | null;
};

export type CompanionDetail = CompanionSummary & {
  birth_place_ar: string | null;
  death_place_ar: string | null;
  death_year: string | null;
  metadata: Record<string, unknown> | null;
  stories: CompanionStory[];
};

export type CompanionStory = {
  id: string;
  companion_id: string;
  title_ar: string;
  title_en: string | null;
  content_ar: string;
  content_en: string | null;
  story_type: string | null;
  order_num: number | null;
};

const STATIC_COMPANION_SLUGS: Record<string, string> = {
  "أبو بكر الصديق": "abu-bakr",
  "عمر بن الخطاب": "umar-ibn-al-khattab",
  "علي بن أبي طالب": "ali-ibn-abi-talib",
  "عثمان بن عفان": "uthman-ibn-affan",
  "خالد بن الوليد": "khalid-ibn-al-walid",
  "بلال بن رباح": "bilal-ibn-rabah",
  "سلمان الفارسي": "salman-al-farisi",
  "عبد الله بن عباس": "abdullah-ibn-abbas",
  "أبو هريرة": "abu-hurayrah",
  "سعد بن أبي وقاص": "saad-ibn-abi-waqqas",
};

const STATIC_COMPANION_CATEGORIES: Record<string, string> = {
  "أبو بكر الصديق": "الخلفاء الراشدون",
  "عمر بن الخطاب": "الخلفاء الراشدون",
  "علي بن أبي طالب": "الخلفاء الراشدون",
  "عثمان بن عفان": "الخلفاء الراشدون",
  "خالد بن الوليد": "القادة",
  "سعد بن أبي وقاص": "القادة",
  "بلال بن رباح": "السابقون إلى الإسلام",
  "سلمان الفارسي": "السابقون إلى الإسلام",
  "عبد الله بن عباس": "السابقون إلى الإسلام",
  "أبو هريرة": "السابقون إلى الإسلام",
};

const FALLBACK_COMPANIONS: CompanionSummary[] = COMPANIONS.map((companion) => ({
  id: "static-" + companion.id,
  name_ar: companion.name_ar,
  name_en: companion.name_en,
  title_ar: companion.title_ar,
  bio_ar: companion.biography_ar,
  slug:
    STATIC_COMPANION_SLUGS[companion.name_ar] ??
    "static-" + companion.id,
  category: STATIC_COMPANION_CATEGORIES[companion.name_ar] ?? null,
}));

let offlineCompanionsPromise: Promise<CompanionSummary[]> | null = null;
let offlineStoriesPromise: Promise<CompanionStory[]> | null = null;

async function loadOfflineJson<T>(fileName: string): Promise<T> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "offline-content",
    "v1",
    fileName,
  );
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function mapCompanionRow(row: Record<string, unknown>): CompanionSummary {
  return {
    id: String(row.id ?? ""),
    name_ar: String(row.name_ar ?? ""),
    name_en: typeof row.name_en === "string" ? row.name_en : null,
    title_ar: typeof row.title_ar === "string" ? row.title_ar : null,
    bio_ar: typeof row.bio_ar === "string" ? row.bio_ar : null,
    slug: String(row.slug ?? ""),
    category: typeof row.category === "string" ? row.category : null,
  };
}

function mapStoryRow(row: Record<string, unknown>): CompanionStory {
  return {
    id: String(row.id ?? ""),
    companion_id: String(row.companion_id ?? ""),
    title_ar: String(row.title_ar ?? ""),
    title_en: typeof row.title_en === "string" ? row.title_en : null,
    content_ar: String(row.content_ar ?? ""),
    content_en: typeof row.content_en === "string" ? row.content_en : null,
    story_type:
      typeof row.story_type === "string" ? row.story_type : null,
    order_num:
      typeof row.order_num === "number" ? row.order_num : null,
  };
}

async function loadOfflineCompanions(): Promise<CompanionSummary[]> {
  if (!offlineCompanionsPromise) {
    offlineCompanionsPromise = loadOfflineJson<Record<string, unknown>[]>(
      "companions.json",
    ).then((rows) =>
      uniqueCompanionSummaries(
        rows
          .filter((row) => row.published === true)
          .map(mapCompanionRow)
          .filter((row) => row.slug && row.name_ar),
      ),
    );
  }

  return offlineCompanionsPromise;
}

async function loadOfflineStories(): Promise<CompanionStory[]> {
  if (!offlineStoriesPromise) {
    offlineStoriesPromise = loadOfflineJson<Record<string, unknown>[]>(
      "companion_stories.json",
    ).then((rows) =>
      rows
        .map(mapStoryRow)
        .filter((row) => row.companion_id && row.content_ar)
        .sort(
          (a, b) =>
            (a.order_num ?? Number.MAX_SAFE_INTEGER) -
            (b.order_num ?? Number.MAX_SAFE_INTEGER),
        ),
    );
  }

  return offlineStoriesPromise;
}

function fallbackBySlug(slug: string): CompanionSummary | null {
  return (
    FALLBACK_COMPANIONS.find((companion) => companion.slug === slug) ?? null
  );
}

async function getDatabaseCompanions(): Promise<CompanionSummary[]> {
  try {
    const rows = await supabaseServerAnonRequest<CompanionSummary[]>(
      "/rest/v1/companions?select=id,name_ar,name_en,title_ar,bio_ar,slug,category&published=eq.true&order=name_ar.asc",
    );
    return Array.isArray(rows)
      ? uniqueCompanionSummaries(rows.filter((row) => row.slug && row.name_ar))
      : [];
  } catch (error) {
    console.error("[companions] Failed to load published content:", error);
    return [];
  }
}

export async function getPublishedCompanions(): Promise<CompanionSummary[]> {
  let offline: CompanionSummary[] = [];
  try {
    offline = await loadOfflineCompanions();
  } catch (error) {
    console.error("[companions] Offline catalogue unavailable:", error);
  }

  const database = isSupabaseConfigured() ? await getDatabaseCompanions() : [];
  if (database.length) return mergePublishedBySlug(database, offline);

  return offline.length ? offline : FALLBACK_COMPANIONS;
}

export async function getCompanionBySlug(
  slug: string,
): Promise<CompanionDetail | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  let local: CompanionSummary | null = null;
  let localStories: CompanionStory[] = [];

  try {
    const localCompanions = await loadOfflineCompanions();
    local = localCompanions.find((item) => item.slug === cleanSlug) ?? null;
    if (local) {
      localStories = (await loadOfflineStories()).filter(
        (story) => story.companion_id === local?.id,
      );
    }
  } catch (error) {
    console.error("[companions] Offline detail unavailable:", error);
  }

  if (isSupabaseConfigured()) {
    try {
      const rows = await supabaseServerAnonRequest<Record<string, unknown>[]>(
      `/rest/v1/companions?select=id,name_ar,name_en,title_ar,bio_ar,slug,category,birth_place_ar,death_place_ar,death_year,metadata&slug=eq.${encodeURIComponent(cleanSlug)}&published=eq.true&limit=1`,
    );

    const row = rows[0];
    if (row) {
      const companion = {
        ...mapCompanionRow(row),
        birth_place_ar:
          typeof row.birth_place_ar === "string" ? row.birth_place_ar : null,
        death_place_ar:
          typeof row.death_place_ar === "string" ? row.death_place_ar : null,
        death_year: row.death_year == null ? null : String(row.death_year),
        metadata:
          row.metadata && typeof row.metadata === "object"
            ? (row.metadata as Record<string, unknown>)
            : null,
      };

      const stories = await supabaseServerAnonRequest<Record<string, unknown>[]>(
        `/rest/v1/companion_stories?select=id,companion_id,title_ar,title_en,content_ar,content_en,story_type,order_num&companion_id=eq.${encodeURIComponent(String(row.id))}&order=order_num.asc`,
      ).catch((error) => {
        console.error("[companions] Failed to load companion stories:", error);
        return [];
      });

      const dbStories = stories.map(mapStoryRow);
      return {
        ...companion,
        stories: dbStories.length ? dbStories : localStories,
      };
      }
    } catch (error) {
      console.error("[companions] Failed to load companion detail:", error);
    }
  }

  if (local) {
    return {
      ...local,
      birth_place_ar: null,
      death_place_ar: null,
      death_year: null,
      metadata: null,
      stories: localStories,
    };
  }

  const fallback = fallbackBySlug(cleanSlug);
  return fallback
    ? {
        ...fallback,
        birth_place_ar: null,
        death_place_ar: null,
        death_year: null,
        metadata: null,
        stories: [],
      }
    : null;
}
