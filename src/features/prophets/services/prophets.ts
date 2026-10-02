import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";
import { resolveCanonicalPublished } from "@/lib/data/content-merge";

import type { Prophet } from "@/features/prophets/types/prophets";
import { prophets as FALLBACK_PROPHETS } from "@/features/prophets/data/fallback";

export interface ProphetSection {
  id: string;
  prophetId: string;
  titleAr: string;
  titleEn?: string;
  contentAr: string;
  contentEn?: string;
  sectionType?: string;
  orderNum?: number;
}

export interface ProphetWithStats extends Prophet {
  storyChars: number;
  storySections: number;
}

export interface ProphetDetail extends Prophet {
  sections: ProphetSection[];
}

type ProphetRow = Record<string, unknown>;

let offlineProphetsPromise: Promise<Prophet[]> | null = null;
let offlineSectionsPromise: Promise<ProphetSection[]> | null = null;

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

async function loadOfflineProphets(): Promise<Prophet[]> {
  if (!offlineProphetsPromise) {
    offlineProphetsPromise = loadOfflineJson<ProphetRow[]>("prophets.json").then(
      (rows) =>
        rows
          .filter((row) => row.published === true)
          .map(mapProphetRow)
          .sort(
            (a, b) =>
              (a.orderNum ?? Number.MAX_SAFE_INTEGER) -
              (b.orderNum ?? Number.MAX_SAFE_INTEGER),
          ),
    );
  }

  return offlineProphetsPromise;
}

async function loadOfflineSections(): Promise<ProphetSection[]> {
  if (!offlineSectionsPromise) {
    offlineSectionsPromise = loadOfflineJson<ProphetRow[]>(
      "prophet_sections.json",
    ).then((rows) =>
      rows
        .filter((row) => typeof row.content_ar === "string")
        .map(mapSectionRow)
        .sort(
          (a, b) =>
            (a.orderNum ?? Number.MAX_SAFE_INTEGER) -
            (b.orderNum ?? Number.MAX_SAFE_INTEGER),
        ),
    );
  }

  return offlineSectionsPromise;
}

function mapProphetRow(row: ProphetRow): Prophet {
  return {
    id: String(row.id ?? ""),
    nameAr: String(row.name_ar ?? ""),
    nameEn: String(row.name_en ?? ""),
    slug: String(row.slug ?? ""),
    bioAr: typeof row.bio_ar === "string" ? row.bio_ar : undefined,
    bioEn: typeof row.bio_en === "string" ? row.bio_en : undefined,
    birthPlaceAr:
      typeof row.birth_place_ar === "string"
        ? row.birth_place_ar
        : undefined,
    deathPlaceAr:
      typeof row.death_place_ar === "string"
        ? row.death_place_ar
        : undefined,
    featuredImageUrl:
      typeof row.featured_image_url === "string"
        ? row.featured_image_url
        : undefined,
    thumbnailUrl:
      typeof row.thumbnail_url === "string"
        ? row.thumbnail_url
        : undefined,
    orderNum:
      typeof row.order_num === "number" ? row.order_num : undefined,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    published: row.published === true,
  };
}

function mapSectionRow(row: ProphetRow): ProphetSection {
  return {
    id: String(row.id ?? ""),
    prophetId: String(row.prophet_id ?? ""),
    titleAr: String(row.title_ar ?? ""),
    titleEn: typeof row.title_en === "string" ? row.title_en : undefined,
    contentAr: String(row.content_ar ?? ""),
    contentEn: typeof row.content_en === "string" ? row.content_en : undefined,
    sectionType:
      typeof row.section_type === "string" ? row.section_type : undefined,
    orderNum:
      typeof row.order_num === "number" ? row.order_num : undefined,
  };
}

function mapFallbackProphet(
  row: (typeof FALLBACK_PROPHETS)[number],
): Prophet {
  return {
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    slug: row.slug,
    bioAr: row.bioAr,
    orderNum: row.order,
    published: true,
    metadata: null,
  };
}

async function getDatabaseProphets(): Promise<Prophet[] | null> {
  const rows = await supabaseServerAnonRequest<ProphetRow[]>(
    "/rest/v1/prophets?select=*&published=eq.true&order=order_num.asc",
  ).catch((error) => {
    console.error("[prophets] Failed to fetch published prophets:", error);
    return null;
  });

  return rows?.length ? rows.map(mapProphetRow) : null;
}

export async function getProphets(): Promise<Prophet[]> {
  let offline: Prophet[] = [];
  try {
    offline = await loadOfflineProphets();
  } catch (error) {
    console.error("[prophets] Offline prophet catalogue unavailable:", error);
  }

  const database = isSupabaseConfigured() ? await getDatabaseProphets() : null;
  if (database?.length) return resolveCanonicalPublished(database, offline);

  return offline.length ? offline : FALLBACK_PROPHETS.map(mapFallbackProphet);
}

export async function getProphetBySlug(slug: string): Promise<ProphetDetail | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  let localProphet: Prophet | undefined;
  let localSections: ProphetSection[] = [];

  try {
    localProphet = (await loadOfflineProphets()).find((item) => item.slug === cleanSlug);
    if (localProphet) {
      localSections = (await loadOfflineSections())
        .filter((section) => section.prophetId === localProphet?.id)
        .sort(
          (a, b) =>
            (a.orderNum ?? Number.MAX_SAFE_INTEGER) -
            (b.orderNum ?? Number.MAX_SAFE_INTEGER),
        );
    }
  } catch (error) {
    console.error("[prophets] Offline prophet detail unavailable:", error);
  }

  const encodedSlug = encodeURIComponent(cleanSlug);
  const dbRows = isSupabaseConfigured()
    ? await supabaseServerAnonRequest<ProphetRow[]>(
        `/rest/v1/prophets?slug=eq.${encodedSlug}&published=eq.true&limit=1`,
      ).catch((error) => {
        console.error("[prophets] Failed to fetch prophet detail:", error);
        return [];
      })
    : [];

  const dbProphet = dbRows[0] ? mapProphetRow(dbRows[0]) : null;
  if (dbProphet) {
    const dbSections = isSupabaseConfigured()
      ? await supabaseServerAnonRequest<ProphetRow[]>(
          `/rest/v1/prophet_sections?prophet_id=eq.${encodeURIComponent(dbProphet.id)}&select=id,prophet_id,title_ar,title_en,content_ar,content_en,section_type,order_num&order=order_num.asc`,
        ).catch((error) => {
          console.error("[prophets] Failed to fetch prophet sections:", error);
          return [];
        })
      : [];

    const sections = dbSections.map(mapSectionRow);
    return {
      ...dbProphet,
      sections: sections.length ? sections : localSections,
    };
  }

  if (localProphet) return { ...localProphet, sections: localSections };

  const fallback = FALLBACK_PROPHETS
    .map(mapFallbackProphet)
    .find((item) => item.slug === cleanSlug);
  return fallback ? { ...fallback, sections: [] } : null;
}
export async function getProphetsWithStats(): Promise<ProphetWithStats[]> {
  const prophets = await getProphets();
  if (!prophets.length) return [];

  const stats = new Map<string, { chars: number; sections: number }>();

  try {
    const localSections = await loadOfflineSections();
    for (const section of localSections) {
      const current = stats.get(section.prophetId) ?? {
        chars: 0,
        sections: 0,
      };
      current.chars += section.contentAr.length;
      current.sections += 1;
      stats.set(section.prophetId, current);
    }
  } catch (error) {
    console.error("[prophets] Offline prophet stats unavailable:", error);

    const prophetIds = prophets
      .map((prophet) => prophet.id)
      .filter((id) => id.length > 0);

    if (isSupabaseConfigured() && prophetIds.length) {
      const encodedIds = prophetIds.map(encodeURIComponent).join(",");
      const rows = await supabaseServerAnonRequest<
        Array<{ prophet_id: string; content_ar: string | null }>
      >(
        `/rest/v1/prophet_sections?select=prophet_id,content_ar&prophet_id=in.(${encodedIds})`,
      ).catch((statsError) => {
        console.error(
          "[prophets] Failed to fetch prophet story stats:",
          statsError,
        );
        return [];
      });

      for (const row of rows) {
        const current = stats.get(row.prophet_id) ?? {
          chars: 0,
          sections: 0,
        };
        current.chars += row.content_ar?.length ?? 0;
        current.sections += 1;
        stats.set(row.prophet_id, current);
      }
    }
  }

  return prophets.map((prophet) => ({
    ...prophet,
    storyChars: stats.get(prophet.id)?.chars ?? 0,
    storySections: stats.get(prophet.id)?.sections ?? 0,
  }));
}
