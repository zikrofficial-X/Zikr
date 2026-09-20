import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { FALLBACK_CONQUESTS } from "@/features/conquests/data/conquests-fallback";
import { mergePublishedBySlug } from "@/lib/data/content-merge";

export type ConquestRecord = {
  id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  description_ar: string | null;
  description_en?: string | null;
  date_hijri: string | null;
  date_gregorian: string | null;
  location_ar: string | null;
  location_en?: string | null;
  leader_ar: string | null;
  leader_en?: string | null;
  thumbnail_url: string | null;
  featured_image_url: string | null;
  order_num: number | null;
  published: boolean;
  metadata?: Record<string, unknown> | null;
};

export type ConquestEvent = {
  id: string;
  conquest_id: string;
  title_ar: string;
  title_en?: string | null;
  content_ar: string;
  content_en?: string | null;
  event_type?: string | null;
  order_num?: number | null;
};

type RawRow = Record<string, unknown>;
let offlineConquestsPromise: Promise<ConquestRecord[]> | null = null;
let offlineEventsPromise: Promise<ConquestEvent[]> | null = null;

async function loadOfflineJson<T>(fileName: string): Promise<T> {
  return JSON.parse(
    await readFile(
      path.join(process.cwd(), "public", "offline-content", "v1", fileName),
      "utf8",
    ),
  ) as T;
}

function mapConquest(row: RawRow): ConquestRecord {
  return {
    id: String(row.id ?? ""),
    name_ar: String(row.name_ar ?? ""),
    name_en: typeof row.name_en === "string" ? row.name_en : undefined,
    slug: String(row.slug ?? ""),
    description_ar:
      typeof row.description_ar === "string" ? row.description_ar : null,
    description_en:
      typeof row.description_en === "string" ? row.description_en : null,
    date_hijri: typeof row.date_hijri === "string" ? row.date_hijri : null,
    date_gregorian:
      typeof row.date_gregorian === "string" ? row.date_gregorian : null,
    location_ar: typeof row.location_ar === "string" ? row.location_ar : null,
    location_en:
      typeof row.location_en === "string" ? row.location_en : null,
    leader_ar: typeof row.leader_ar === "string" ? row.leader_ar : null,
    leader_en: typeof row.leader_en === "string" ? row.leader_en : null,
    thumbnail_url:
      typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
    featured_image_url:
      typeof row.featured_image_url === "string"
        ? row.featured_image_url
        : null,
    order_num:
      typeof row.order_num === "number" ? row.order_num : null,
    published: row.published === true,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
  };
}

function mapEvent(row: RawRow): ConquestEvent {
  return {
    id: String(row.id ?? ""),
    conquest_id: String(row.conquest_id ?? ""),
    title_ar: String(row.title_ar ?? ""),
    title_en: typeof row.title_en === "string" ? row.title_en : null,
    content_ar: String(row.content_ar ?? ""),
    content_en: typeof row.content_en === "string" ? row.content_en : null,
    event_type:
      typeof row.event_type === "string" ? row.event_type : null,
    order_num:
      typeof row.order_num === "number" ? row.order_num : null,
  };
}

async function loadOfflineConquests(): Promise<ConquestRecord[]> {
  if (!offlineConquestsPromise) {
    offlineConquestsPromise = loadOfflineJson<RawRow[]>("conquests.json").then(
      (rows) =>
        rows
          .filter((row) => row.published === true)
          .map(mapConquest)
          .filter((item) => item.slug && item.name_ar)
          .sort(
            (a, b) =>
              (a.order_num ?? Number.MAX_SAFE_INTEGER) -
              (b.order_num ?? Number.MAX_SAFE_INTEGER),
          ),
    );
  }
  return offlineConquestsPromise;
}

async function loadOfflineEvents(): Promise<ConquestEvent[]> {
  if (!offlineEventsPromise) {
    offlineEventsPromise = loadOfflineJson<RawRow[]>(
      "conquest_events.json",
    ).then((rows) =>
      rows
        .map(mapEvent)
        .filter((item) => item.conquest_id && item.content_ar)
        .sort(
          (a, b) =>
            (a.order_num ?? Number.MAX_SAFE_INTEGER) -
            (b.order_num ?? Number.MAX_SAFE_INTEGER),
        ),
    );
  }
  return offlineEventsPromise;
}

const FALLBACK_RECORDS: ConquestRecord[] = FALLBACK_CONQUESTS.map((item) => ({
  ...item,
  order_num: null,
  published: true,
  metadata: null,
}));

async function getDatabaseConquests(): Promise<ConquestRecord[]> {
  try {
    const rows = await supabaseServerAnonRequest<RawRow[]>(
      "/rest/v1/conquests?select=id,name_ar,name_en,slug,description_ar,description_en,date_hijri,date_gregorian,location_ar,location_en,leader_ar,leader_en,thumbnail_url,featured_image_url,order_num,published,metadata&published=eq.true&order=order_num.asc",
    );
    return rows.map(mapConquest);
  } catch (error) {
    console.error("[conquests] Failed to fetch published conquests:", error);
    return [];
  }
}

export async function getConquests(): Promise<ConquestRecord[]> {
  let offline: ConquestRecord[] = [];
  try {
    offline = await loadOfflineConquests();
  } catch (error) {
    console.error("[conquests] Offline catalogue unavailable:", error);
  }

  const database = await getDatabaseConquests();
  return database.length
    ? mergePublishedBySlug(database, offline)
    : offline.length
      ? offline
      : FALLBACK_RECORDS;
}

export async function getConquestBySlug(
  slug: string,
): Promise<{ conquest: ConquestRecord; events: ConquestEvent[] } | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  let offline: ConquestRecord | null = null;
  let offlineEvents: ConquestEvent[] = [];

  try {
    offline = (await loadOfflineConquests()).find(
      (item) => item.slug === cleanSlug,
    ) ?? null;
    if (offline) {
      offlineEvents = (await loadOfflineEvents()).filter(
        (event) => event.conquest_id === offline?.id,
      );
    }
  } catch (error) {
    console.error("[conquests] Offline detail unavailable:", error);
  }

  try {
    const rows = await supabaseServerAnonRequest<RawRow[]>(
      `/rest/v1/conquests?select=id,name_ar,name_en,slug,description_ar,description_en,date_hijri,date_gregorian,location_ar,location_en,leader_ar,leader_en,thumbnail_url,featured_image_url,order_num,published,metadata&slug=eq.${encodeURIComponent(cleanSlug)}&published=eq.true&limit=1`,
    );
    const row = rows[0];

    if (row) {
      const conquest = mapConquest(row);
      const events = await supabaseServerAnonRequest<RawRow[]>(
        `/rest/v1/conquest_events?select=id,conquest_id,title_ar,title_en,content_ar,content_en,event_type,order_num&conquest_id=eq.${encodeURIComponent(conquest.id)}&order=order_num.asc`,
      ).catch((error) => {
        console.error("[conquests] Failed to fetch conquest events:", error);
        return [];
      });

      return {
        conquest,
        events: events.length > 0 ? events.map(mapEvent) : offlineEvents,
      };
    }
  } catch (error) {
    console.error("[conquests] Failed to fetch conquest detail:", error);
  }

  if (offline) return { conquest: offline, events: offlineEvents };

  const fallback = FALLBACK_RECORDS.find((item) => item.slug === cleanSlug);
  return fallback ? { conquest: fallback, events: [] } : null;
}
