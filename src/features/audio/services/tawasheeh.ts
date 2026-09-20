import "server-only";

import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";
import {
  tawasheeh as fallbackTawasheeh,
  type Tawasheeh,
} from "@/features/audio/data/tawasheeh-fallback";

export type TawasheehItem = {
  id: string;
  title_ar: string;
  title_en: string;
  slug?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  artist_ar: string | null;
  artist_en: string | null;
  duration: number;
  views: number;
  featured: boolean;
  audio_url: string;
  thumbnail_url?: string | null;
  metadata: Record<string, unknown> | null;
  category?: {
    id: string;
    name_ar: string;
    name_en: string | null;
    slug: string;
    icon: string | null;
  } | null;
};

export type TawasheehQuery = {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  featured?: boolean;
};

export type TawasheehResult = {
  data: TawasheehItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type TawasheehCategory = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  order_num: number | null;
};

function normalizeLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(1, Math.trunc(value as number)));
}

function normalizeOffset(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value as number));
}

function mapFallback(item: Tawasheeh): TawasheehItem {
  return {
    id: item.id,
    title_ar: item.titleAr,
    title_en: item.titleEn,
    slug: item.id,
    description_ar: null,
    description_en: null,
    artist_ar: item.artistAr,
    artist_en: item.artistEn,
    duration: item.duration,
    views: item.views,
    featured: item.featured,
    audio_url: item.audioUrl,
    thumbnail_url: null,
    metadata: { source_url: item.audioUrl },
    category: null,
  };
}

async function getDatabaseTawasheeh(): Promise<TawasheehItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await supabaseServerAnonRequest<TawasheehItem[]>(
      "/rest/v1/tawasheeh?select=id,title_ar,title_en,slug,description_ar,description_en,artist_ar,artist_en,duration,views,featured,audio_url,thumbnail_url,metadata,category:tawasheeh_categories(id,name_ar,name_en,slug,icon)&published=eq.true&audio_url=not.is.null&order=featured.desc,created_at.desc&limit=1000",
      { timeoutMs: 10_000, retries: 1 },
    );
  } catch (error) {
    console.error("[tawasheeh] Database catalogue unavailable:", error);
    return [];
  }
}

export async function getTawasheeh(
  query: TawasheehQuery = {},
): Promise<TawasheehResult> {
  const limit = normalizeLimit(query.limit);
  const offset = normalizeOffset(query.offset);
  const search = query.search?.trim().toLocaleLowerCase("ar") ?? "";
  const category = query.category?.trim() ?? "";

  let items = await getDatabaseTawasheeh();

  if (!items.length) {
    items = fallbackTawasheeh.map(mapFallback);
  }

  if (category) {
    items = items.filter((item) => item.category?.id === category || item.category?.slug === category);
  }

  if (query.featured) {
    items = items.filter((item) => item.featured);
  }

  if (search) {
    items = items.filter((item) =>
      [item.title_ar, item.title_en, item.artist_ar ?? "", item.artist_en ?? ""]
        .some((value) => value.toLocaleLowerCase("ar").includes(search)),
    );
  }

  const total = items.length;
  const data = items.slice(offset, offset + limit);

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  };
}

export async function getTawasheehCategories(): Promise<TawasheehCategory[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await supabaseServerAnonRequest<TawasheehCategory[]>(
      "/rest/v1/tawasheeh_categories?select=id,name_ar,name_en,slug,description_ar,description_en,icon,order_num&published=eq.true&order=order_num.asc",
      { timeoutMs: 10_000, retries: 1 },
    );
  } catch (error) {
    console.error("[tawasheeh] Category catalogue unavailable:", error);
    return [];
  }
}
