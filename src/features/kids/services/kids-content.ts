import "server-only";

import { isSupabaseConfigured, supabaseServerAdminRequest, supabaseServerAnonRequest } from "@/lib/supabase/server";
import {
  getKidsItemBySlug,
  kidsContent,
  normalizeKidsContentRow,
  type KidsItem,
} from "@/features/kids/data/content";
import type { Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  getFallbackKidsContentBySlug,
  isKidsContentPubliclyVisible,
  mergeKidsContentWithFallback,
  normalizeKidsContentSlug,
  shouldTreatKidsContentLookupAsUnavailable,
} from "@/features/kids/services/kids-content-visibility";

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

type KidsVisibilityDbRow = { slug?: unknown };

type KidsDatabaseState = {
  configured: boolean;
  items: KidsItem[];
  knownSlugs: Set<string> | null;
};

const FALLBACK_SLUG_FILTER = `slug=in.(${FALLBACK_KIDS_CONTENT.map((item) => item.slug).join(",")})`;

async function getDatabaseKidsContent(): Promise<KidsDatabaseState> {
  if (!isSupabaseConfigured()) return { configured: false, items: [], knownSlugs: null };

  const [publicResult, visibilityResult] = await Promise.allSettled([
    Promise.resolve().then(() => supabaseServerAnonRequest<KidsDbRow[]>(
      `/rest/v1/kids_content?select=*&published=eq.true&is_active=eq.true&order=created_at.desc&limit=1000`,
      { timeoutMs: 10_000, retries: 1 },
    )),
    // Defer the service-role call so missing Preview credentials are captured
    // as a rejected result instead of throwing before Promise.allSettled.
    Promise.resolve().then(() => supabaseServerAdminRequest<KidsVisibilityDbRow[]>(
      `/rest/v1/kids_content?select=slug&${FALLBACK_SLUG_FILTER}`,
      { timeoutMs: 10_000, retries: 1 },
    )),
  ]);

  if (publicResult.status === "rejected") {
    console.error("[kids] Failed to load published content:", publicResult.reason);
  }
  if (shouldTreatKidsContentLookupAsUnavailable(publicResult.status, visibilityResult.status)) {
    throw new Error("Kids content lookup is temporarily unavailable.");
  }
  if (visibilityResult.status === "rejected") {
    console.error("[kids] Failed to verify fallback content visibility:", visibilityResult.reason);
  }

  const items = publicResult.status === "fulfilled"
    ? dedupeBySlug(
        (publicResult.value ?? [])
          .map((row) => normalizeKidsContentRow(row))
          .filter((item): item is KidsItem => item !== null && isKidsContentPubliclyVisible(item)),
      )
    : [];
  const knownSlugs = visibilityResult.status === "fulfilled"
    ? new Set(
        (visibilityResult.value ?? [])
          .map((row) => normalizeKidsContentSlug(row.slug))
          .filter(Boolean),
      )
    : null;

  return { configured: true, items, knownSlugs };
}

async function getDatabaseKidsContentBySlug(slug: string): Promise<{
  configured: boolean;
  item: KidsItem | null;
  knownSlugs: Set<string> | null;
}> {
  if (!isSupabaseConfigured()) return { configured: false, item: null, knownSlugs: null };
  const encodedSlug = encodeURIComponent(slug);

  const [publicResult, visibilityResult] = await Promise.allSettled([
    Promise.resolve().then(() => supabaseServerAnonRequest<KidsDbRow[]>(
      `/rest/v1/kids_content?select=*&slug=eq.${encodedSlug}&published=eq.true&is_active=eq.true&limit=1`,
      { timeoutMs: 10_000, retries: 1 },
    )),
    Promise.resolve().then(() => supabaseServerAdminRequest<KidsVisibilityDbRow[]>(
      `/rest/v1/kids_content?select=slug&slug=eq.${encodedSlug}&limit=1`,
      { timeoutMs: 10_000, retries: 1 },
    )),
  ]);

  if (publicResult.status === "rejected") {
    console.error("[kids] Failed to load content by slug:", publicResult.reason);
  }
  if (visibilityResult.status === "rejected") {
    console.error("[kids] Failed to verify fallback slug visibility:", visibilityResult.reason);
  }
  if (shouldTreatKidsContentLookupAsUnavailable(publicResult.status, visibilityResult.status)) {
    throw new Error("Kids content lookup is temporarily unavailable.");
  }

  const normalizedItem = publicResult.status === "fulfilled" && publicResult.value[0]
    ? normalizeKidsContentRow(publicResult.value[0])
    : null;
  const databaseItem = normalizedItem && isKidsContentPubliclyVisible(normalizedItem)
    ? normalizedItem
    : null;
  const knownSlugs = visibilityResult.status === "fulfilled"
    ? new Set(
        (visibilityResult.value ?? [])
          .map((row) => normalizeKidsContentSlug(row.slug))
          .filter(Boolean),
      )
    : null;

  return { configured: true, item: databaseItem, knownSlugs };
}

export async function getKidsContent(locale?: Locale): Promise<KidsItem[]> {
  const activeLocale = locale ?? await getRequestLocale();
  const database = await getDatabaseKidsContent();
  if (!database.configured) {
    const fallback = FALLBACK_KIDS_CONTENT.filter(isKidsContentPubliclyVisible);
    return activeLocale === "en"
      ? fallback.filter((item) => Boolean(item.content_en?.trim()))
      : fallback;
  }

  // If the visibility lookup fails, return only database-approved rows. Never
  // guess that a missing public row is safe to restore from static fallback.
  const merged = database.knownSlugs
    ? mergeKidsContentWithFallback(database.items, FALLBACK_KIDS_CONTENT, database.knownSlugs)
    : database.items;
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

  const database = await getDatabaseKidsContentBySlug(cleanSlug);
  if (!database.configured) {
    const fallback = getKidsItemBySlug(cleanSlug);
    if (!fallback || !isKidsContentPubliclyVisible(fallback)) return null;
    if (activeLocale === "en" && !fallback.content_en?.trim()) return null;
    return fallback;
  }

  if (database.item) {
    if (activeLocale === "en" && !database.item.content_en?.trim()) return null;
    return database.item;
  }

  if (!database.knownSlugs) return null;
  const fallback = getFallbackKidsContentBySlug(cleanSlug, FALLBACK_KIDS_CONTENT, database.knownSlugs);
  if (activeLocale === "en" && !fallback?.content_en?.trim()) return null;
  return fallback;
}
