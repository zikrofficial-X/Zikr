import "server-only";

import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";
import {
  getKidsItemBySlug,
  kidsContent,
  normalizeKidsContentRow,
  type KidsItem,
} from "@/features/kids/data/content";
import type { Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

type KidsDbRow = Record<string, unknown>;

function dedupeBySlug(items: KidsItem[]): KidsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const slug = item.slug.trim().toLowerCase();
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

const FALLBACK_KIDS_CONTENT = dedupeBySlug(kidsContent);

async function getDatabaseKidsContent(): Promise<KidsItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const rows = await supabaseServerAnonRequest<KidsDbRow[]>(
      "/rest/v1/kids_content?select=*&published=eq.true&order=created_at.desc&limit=1000",
      { timeoutMs: 10_000, retries: 1 },
    );

    return dedupeBySlug(
      (rows ?? [])
        .map((row) => normalizeKidsContentRow(row))
        .filter((item): item is KidsItem => Boolean(item)),
    );
  } catch (error) {
    console.error("[kids] Failed to load published content:", error);
    return [];
  }
}

export async function getKidsContent(locale?: Locale): Promise<KidsItem[]> {
  const activeLocale = locale ?? await getRequestLocale();
  const database = await getDatabaseKidsContent();
  if (!database.length) {
    return activeLocale === "en"
      ? FALLBACK_KIDS_CONTENT.filter((item) => Boolean(item.content_en?.trim()))
      : FALLBACK_KIDS_CONTENT;
  }

  const databaseSlugs = new Set(
    database.map((item) => item.slug.trim().toLowerCase()),
  );

  const merged = [
    ...database,
    ...FALLBACK_KIDS_CONTENT.filter(
      (item) => !databaseSlugs.has(item.slug.trim().toLowerCase()),
    ),
  ];
  return activeLocale === "en"
    ? merged.filter((item) => Boolean(item.title_en?.trim() && item.content_en?.trim()))
    : merged;
}

export async function getKidsContentBySlug(
  slug: string,
  locale?: Locale,
): Promise<KidsItem | null> {
  const activeLocale = locale ?? await getRequestLocale();
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  if (isSupabaseConfigured()) {
    try {
      const rows = await supabaseServerAnonRequest<KidsDbRow[]>(
        "/rest/v1/kids_content?select=*&slug=eq." +
          encodeURIComponent(cleanSlug) +
          "&published=eq.true&limit=1",
        { timeoutMs: 10_000, retries: 1 },
      );
      const databaseItem = rows[0]
        ? normalizeKidsContentRow(rows[0])
        : null;
      if (databaseItem) {
        if (activeLocale === "en" && !databaseItem.content_en?.trim()) return null;
        return databaseItem;
      }
    } catch (error) {
      console.error("[kids] Failed to load content by slug:", error);
    }
  }

  const fallback = getKidsItemBySlug(cleanSlug);
  if (activeLocale === "en" && !fallback?.content_en?.trim()) return null;
  return fallback;
}
