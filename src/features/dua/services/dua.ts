import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  isSupabaseConfigured,
  supabaseServerAnonRequest,
} from "@/lib/supabase/server";

import type { DuaCategory, Dua } from "@/features/dua/types/dua";
import { resolveCanonicalPublished } from "@/lib/data/content-merge";
import {
  FALLBACK_DUA_CATEGORIES,
  FALLBACK_DUAS,
} from "@/features/dua/data/fallback";
import { getRequestLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";

type DuaRow = Record<string, unknown>;

let offlineDuasPromise: Promise<Dua[]> | null = null;

async function loadOfflineDuas(): Promise<Dua[]> {
  if (!offlineDuasPromise) {
    offlineDuasPromise = readFile(
      path.join(
        process.cwd(),
        "public",
        "offline-content",
        "v1",
        "duas.json",
      ),
      "utf8",
    ).then((raw) => {
      const rows = JSON.parse(raw) as DuaRow[];

      return rows
        .filter((row) => row.published === true)
        .map(mapDuaRow)
        .filter((dua) => dua.slug && dua.textAr);
    });
  }

  return offlineDuasPromise;
}

function mapDuaRow(row: DuaRow): Dua {
  return {
    id: String(row.id ?? ""),
    titleAr: String(row.title_ar ?? ""),
    titleEn:
      typeof row.title_en === "string" && row.title_en.length > 0
        ? row.title_en
        : "",
    slug: String(row.slug ?? ""),
    textAr: String(row.text_ar ?? ""),
    textEn: typeof row.text_en === "string" ? row.text_en : undefined,
    occasionAr:
      typeof row.occasion_ar === "string" ? row.occasion_ar : undefined,
    sourceAr:
      typeof row.source_ar === "string" ? row.source_ar : undefined,
    benefitsAr:
      typeof row.benefits_ar === "string" ? row.benefits_ar : undefined,
    categoryId:
      typeof row.category_id === "string" ? row.category_id : undefined,
    published: row.published === true,
  };
}

async function getOfflineOrFallbackDuas(): Promise<Dua[]> {
  try {
    const local = await loadOfflineDuas();
    if (local.length > 0) return local;
  } catch (error) {
    console.error("[dua] Offline dua catalogue unavailable:", error);
  }

  return FALLBACK_DUAS;
}

export async function getDuaCategories(): Promise<DuaCategory[]> {
  if (!isSupabaseConfigured()) return FALLBACK_DUA_CATEGORIES;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/dua_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&order=name_ar.asc",
  ).catch((error) => {
    console.error("[dua] Failed to fetch dua categories:", error);
    return [];
  });

  if (rows.length === 0) return FALLBACK_DUA_CATEGORIES;

  const mapped = rows
    .map((row) => ({
      id: String(row.id ?? ""),
      nameAr: String(row.name_ar ?? ""),
      nameEn: String(row.name_en ?? ""),
      slug: String(row.slug ?? ""),
      icon: typeof row.icon === "string" ? row.icon : undefined,
    }))
    .filter((category) => category.slug);

  return Array.from(
    new Map(
      [...FALLBACK_DUA_CATEGORIES, ...mapped].map((category) => [
        category.slug,
        category,
      ]),
    ).values(),
  );
}

export async function getDuas(
  categoryId?: string,
  limit = 50,
  locale?: Locale,
): Promise<Dua[]> {
  const activeLocale = locale ?? await getRequestLocale();
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const localDuas = await getOfflineOrFallbackDuas();
  const fallback =
    categoryId && categoryId !== "all"
      ? localDuas.filter((dua) => dua.categoryId === categoryId)
      : localDuas;

  if (!isSupabaseConfigured()) return fallback.slice(0, safeLimit);

  let query =
    "/rest/v1/duas?select=id,title_ar,title_en,slug,text_ar,text_en,occasion_ar,source_ar,benefits_ar,category_id,published&published=eq.true";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
  }

  query += `&limit=${safeLimit}`;

  const rows = await supabaseServerAnonRequest<DuaRow[]>(query).catch(
    (error) => {
      console.error("[dua] Failed to fetch duas:", error);
      return [];
    },
  );

  if (rows.length === 0) return fallback.slice(0, safeLimit);

  const mapped = rows
    .map(mapDuaRow)
    .filter((dua) => dua.slug && dua.textAr);

  return resolveCanonicalPublished(mapped, fallback).slice(0, safeLimit);
}

export async function getDuaBySlug(slug: string, locale?: Locale): Promise<Dua | null> {
  const activeLocale = locale ?? await getRequestLocale();
  const cleanSlug = slug?.trim() ?? "";
  if (!cleanSlug) return null;

  const localDuas = await getOfflineOrFallbackDuas();
  const localMatch = localDuas.find((dua) => dua.slug === cleanSlug);

  if (!isSupabaseConfigured()) return localMatch ?? null;

  const safeSlug = encodeURIComponent(cleanSlug);
  const rows = await supabaseServerAnonRequest<DuaRow[]>(
    `/rest/v1/duas?select=*&slug=eq.${safeSlug}&published=eq.true&limit=1`,
  ).catch((error) => {
    console.error("[dua] Failed to fetch dua by slug:", error);
    return [];
  });

  if (!rows.length) return localMatch ?? null;

  return mapDuaRow(rows[0]);
}
