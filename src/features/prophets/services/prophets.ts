import { supabaseServerAnonRequest } from "@/lib/supabase/server";

import type { Prophet } from "@/features/prophets/types/prophets";
import { prophets as FALLBACK_PROPHETS } from "@/features/prophets/data/fallback";

export async function getProphets(): Promise<Prophet[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/prophets?select=*&published=eq.true&order=order_num.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch prophets:", error);
    return null;
  });

  if (!rows?.length) return FALLBACK_PROPHETS.map((r) => ({
    id: r.id,
    nameAr: r.nameAr,
    nameEn: r.nameEn,
    slug: r.slug,
    bioAr: r.bioAr,
    orderNum: r.order,
    published: true,
  }));

  return rows.map(r => ({
    id: r.id as string,
    nameAr: r.name_ar as string,
    nameEn: r.name_en as string,
    slug: r.slug as string,
    bioAr: r.bio_ar as string | undefined,
    featuredImageUrl: r.featured_image_url as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    orderNum: r.order_num as number | undefined,
    published: r.published as boolean,
  }));
}

