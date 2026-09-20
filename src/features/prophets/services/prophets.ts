import { supabaseServerAnonRequest } from "@/lib/supabase/server";

import type { Prophet } from "@/features/prophets/types/prophets";
import { prophets as FALLBACK_PROPHETS } from "@/features/prophets/data/fallback";

export interface ProphetWithStats extends Prophet {
  storyChars: number;
  storySections: number;
}

function mapFallbackProphet(row: (typeof FALLBACK_PROPHETS)[number]): Prophet {
  return {
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    slug: row.slug,
    bioAr: row.bioAr,
    orderNum: row.order,
    published: true,
  };
}

function mapProphetRow(row: Record<string, unknown>): Prophet {
  return {
    id: String(row.id),
    nameAr: String(row.name_ar ?? ""),
    nameEn: String(row.name_en ?? ""),
    slug: String(row.slug ?? ""),
    bioAr: typeof row.bio_ar === "string" ? row.bio_ar : undefined,
    featuredImageUrl:
      typeof row.featured_image_url === "string"
        ? row.featured_image_url
        : undefined,
    thumbnailUrl:
      typeof row.thumbnail_url === "string" ? row.thumbnail_url : undefined,
    orderNum:
      typeof row.order_num === "number" ? row.order_num : undefined,
    published: row.published === true,
  };
}

export async function getProphets(): Promise<Prophet[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/prophets?select=*&published=eq.true&order=order_num.asc",
  ).catch((error) => {
    console.error("[prophets] Failed to fetch published prophets:", error);
    return null;
  });

  if (!rows?.length) return FALLBACK_PROPHETS.map(mapFallbackProphet);

  return rows.map(mapProphetRow);
}

export async function getProphetsWithStats(): Promise<ProphetWithStats[]> {
  const prophets = await getProphets();

  if (!prophets.length) return [];

  const prophetIds = prophets
    .map((prophet) => prophet.id)
    .filter((id) => id.length > 0);

  if (!prophetIds.length) {
    return prophets.map((prophet) => ({
      ...prophet,
      storyChars: 0,
      storySections: 0,
    }));
  }

  const encodedIds = prophetIds.map((id) => encodeURIComponent(id)).join(",");
  const rows = await supabaseServerAnonRequest<
    Array<{ prophet_id: string; content_ar: string | null }>
  >(
    `/rest/v1/prophet_sections?select=prophet_id,content_ar&prophet_id=in.(${encodedIds})`,
  ).catch((error) => {
    console.error("[prophets] Failed to fetch prophet story stats:", error);
    return [];
  });

  const stats = new Map<string, { chars: number; sections: number }>();

  for (const row of rows) {
    const current = stats.get(row.prophet_id) ?? { chars: 0, sections: 0 };
    current.chars += row.content_ar?.length ?? 0;
    current.sections += 1;
    stats.set(row.prophet_id, current);
  }

  return prophets.map((prophet) => ({
    ...prophet,
    storyChars: stats.get(prophet.id)?.chars ?? 0,
    storySections: stats.get(prophet.id)?.sections ?? 0,
  }));
}