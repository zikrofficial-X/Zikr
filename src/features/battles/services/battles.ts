import { readFile } from "node:fs/promises";
import path from "node:path";

import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { mergePublishedBySlug } from "@/lib/data/content-merge";

export type BattleRecord = {
  id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  date_hijri: string | null;
  date_gregorian: string | null;
  location_ar: string | null;
  location_en?: string | null;
  description_ar: string | null;
  description_en?: string | null;
  thumbnail_url: string | null;
  featured_image_url?: string | null;
  order_num: number | null;
  published: boolean;
  metadata?: Record<string, unknown> | null;
};

export type BattleEvent = {
  id: string;
  battle_id: string;
  title_ar: string;
  title_en?: string | null;
  content_ar: string;
  content_en?: string | null;
  event_type: string | null;
  order_num: number | null;
};

const LEGACY_BATTLE_SLUGS: Record<string, string> = {
  qaynuqa: "banu-qaynuqa",
  nadir: "banu-nadir",
  qurayza: "banu-qurayza",
  mutah: "mu-tah",
  salasel: "dhat-salasil",
};

type RawRow = Record<string, unknown>;

let offlineBattlesPromise: Promise<BattleRecord[]> | null = null;
let offlineEventsPromise: Promise<BattleEvent[]> | null = null;

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

function mapBattle(row: RawRow): BattleRecord {
  return {
    id: String(row.id ?? ""),
    name_ar: String(row.name_ar ?? ""),
    name_en: typeof row.name_en === "string" ? row.name_en : undefined,
    slug: String(row.slug ?? ""),
    date_hijri: typeof row.date_hijri === "string" ? row.date_hijri : null,
    date_gregorian:
      typeof row.date_gregorian === "string" ? row.date_gregorian : null,
    location_ar:
      typeof row.location_ar === "string" ? row.location_ar : null,
    location_en:
      typeof row.location_en === "string" ? row.location_en : null,
    description_ar:
      typeof row.description_ar === "string" ? row.description_ar : null,
    description_en:
      typeof row.description_en === "string" ? row.description_en : null,
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

function mapEvent(row: RawRow): BattleEvent {
  return {
    id: String(row.id ?? ""),
    battle_id: String(row.battle_id ?? ""),
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

async function loadOfflineBattles(): Promise<BattleRecord[]> {
  if (!offlineBattlesPromise) {
    offlineBattlesPromise = loadOfflineJson<RawRow[]>("battles.json").then(
      (rows) =>
        rows
          .filter((row) => row.published === true)
          .map(mapBattle)
          .filter((battle) => battle.slug && battle.name_ar)
          .sort(
            (a, b) =>
              (a.order_num ?? Number.MAX_SAFE_INTEGER) -
              (b.order_num ?? Number.MAX_SAFE_INTEGER),
          ),
    );
  }
  return offlineBattlesPromise;
}

async function loadOfflineEvents(): Promise<BattleEvent[]> {
  if (!offlineEventsPromise) {
    offlineEventsPromise = loadOfflineJson<RawRow[]>(
      "battle_events.json",
    ).then((rows) =>
      rows
        .map(mapEvent)
        .filter((event) => event.battle_id && event.content_ar)
        .sort(
          (a, b) =>
            (a.order_num ?? Number.MAX_SAFE_INTEGER) -
            (b.order_num ?? Number.MAX_SAFE_INTEGER),
        ),
    );
  }
  return offlineEventsPromise;
}

function canonicalSlug(slug: string): string {
  return LEGACY_BATTLE_SLUGS[slug] ?? slug;
}

async function getDatabaseBattles(): Promise<BattleRecord[]> {
  try {
    const rows = await supabaseServerAnonRequest<RawRow[]>(
      "/rest/v1/battles?select=id,name_ar,name_en,slug,date_hijri,date_gregorian,location_ar,location_en,description_ar,description_en,thumbnail_url,featured_image_url,order_num,published,metadata&published=eq.true&order=order_num.asc",
    );
    return rows.map(mapBattle);
  } catch (error) {
    console.error("[battles] Failed to fetch published battles:", error);
    return [];
  }
}

export async function getBattles(): Promise<BattleRecord[]> {
  let offline: BattleRecord[] = [];
  try {
    offline = await loadOfflineBattles();
  } catch (error) {
    console.error("[battles] Offline catalogue unavailable:", error);
  }

  const database = await getDatabaseBattles();
  if (!database.length) return offline;

  return mergePublishedBySlug(database, offline);
}

export async function getBattleBySlug(
  slug: string,
): Promise<{ battle: BattleRecord; events: BattleEvent[] } | null> {
  const cleanSlug = canonicalSlug(slug.trim());
  if (!cleanSlug) return null;

  let offlineBattle: BattleRecord | null = null;
  let offlineEvents: BattleEvent[] = [];

  try {
    const battles = await loadOfflineBattles();
    offlineBattle = battles.find((battle) => battle.slug === cleanSlug) ?? null;

    if (offlineBattle) {
      offlineEvents = (await loadOfflineEvents()).filter(
        (event) => event.battle_id === offlineBattle?.id,
      );
    }
  } catch (error) {
    console.error("[battles] Offline detail unavailable:", error);
  }

  try {
    const rows = await supabaseServerAnonRequest<RawRow[]>(
      `/rest/v1/battles?select=id,name_ar,name_en,slug,date_hijri,date_gregorian,location_ar,location_en,description_ar,description_en,thumbnail_url,featured_image_url,order_num,published,metadata&slug=eq.${encodeURIComponent(cleanSlug)}&published=eq.true&limit=1`,
    );

    const row = rows[0];
    if (row) {
      const battle = mapBattle(row);
      const events = await supabaseServerAnonRequest<RawRow[]>(
        `/rest/v1/battle_events?select=id,battle_id,title_ar,title_en,content_ar,content_en,event_type,order_num&battle_id=eq.${encodeURIComponent(battle.id)}&order=order_num.asc`,
      ).catch((error) => {
        console.error("[battles] Failed to fetch battle events:", error);
        return [];
      });

      return {
        battle,
        events: events.length > 0 ? events.map(mapEvent) : offlineEvents,
      };
    }
  } catch (error) {
    console.error("[battles] Failed to fetch battle detail:", error);
  }

  return offlineBattle
    ? { battle: offlineBattle, events: offlineEvents }
    : null;
}

export function getCanonicalBattleSlug(slug: string): string {
  return canonicalSlug(slug);
}
