import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";

import type { DuaCategory, Dua } from "@/features/dua/types/dua";
import { FALLBACK_DUA_CATEGORIES, FALLBACK_DUAS } from "@/features/dua/data/fallback";

export async function getDuaCategories(): Promise<DuaCategory[]> {
  if (!isSupabaseConfigured()) return FALLBACK_DUA_CATEGORIES;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/dua_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&order=name_ar.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch dua categories:", error);
    return [];
  });

  if (rows.length === 0) return FALLBACK_DUA_CATEGORIES;

  if (rows.length === 0) return fallback.slice(0, safeLimit);

  return rows.map(r => ({
    id: r.id as string,
    nameAr: r.name_ar as string,
    nameEn: r.name_en as string,
    slug: r.slug as string,
    icon: r.icon as string | undefined,
  }));
}

export async function getDuas(categoryId?: string, limit = 50): Promise<Dua[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const fallback = categoryId && categoryId !== "all"
    ? FALLBACK_DUAS.filter((dua) => dua.categoryId === categoryId)
    : FALLBACK_DUAS;

  if (!isSupabaseConfigured()) return fallback.slice(0, safeLimit);

  let query =
    "/rest/v1/duas?select=id,title_ar,title_en,slug,text_ar,occasion_ar,source_ar,benefits_ar,category_id,published&published=eq.true";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
  }

  query += `&limit=${safeLimit}`;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    query
  ).catch(error => {
    console.error("[content] Failed to fetch duas:", error);
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    titleAr: r.title_ar as string,
    titleEn: r.title_en as string,
    slug: r.slug as string,
    textAr: r.text_ar as string,
    occasionAr: r.occasion_ar as string | undefined,
    sourceAr: r.source_ar as string | undefined,
    benefitsAr: r.benefits_ar as string | undefined,
    categoryId: r.category_id as string | undefined,
    published: r.published as boolean,
  }));
}

export async function getDuaBySlug(slug: string): Promise<Dua | null> {
  const cleanSlug = slug?.trim() ?? '';
  if (!cleanSlug) return null;
  if (!isSupabaseConfigured()) return FALLBACK_DUAS.find((dua) => dua.slug === cleanSlug) ?? null;

  const safeSlug = encodeURIComponent(cleanSlug);
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/duas?select=*&slug=eq.${safeSlug}&published=eq.true&limit=1`
  ).catch(error => {
    console.error("[content] Failed to fetch dua by slug:", error);
    return [];
  });

  if (!rows.length) return FALLBACK_DUAS.find((dua) => dua.slug === cleanSlug) ?? null;
  const r = rows[0];

  return {
    id: r.id as string,
    titleAr: r.title_ar as string,
    titleEn: r.title_en as string,
    slug: r.slug as string,
    textAr: r.text_ar as string,
    textEn: r.text_en as string | undefined,
    occasionAr: r.occasion_ar as string | undefined,
    sourceAr: r.source_ar as string | undefined,
    benefitsAr: r.benefits_ar as string | undefined,
    categoryId: r.category_id as string | undefined,
    published: r.published as boolean,
  };
}

