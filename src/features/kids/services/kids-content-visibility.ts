import { isKidsContentType } from "@/features/kids/services/kids-content-validation";

export function isKidsContentPubliclyVisible(item: { type?: unknown; metadata?: unknown }): boolean {
  // Publication and active state are enforced by the database query/RLS policy.
  // age_appropriate is a separate review signal for automated Kids distribution;
  // it must not hide an already-published story from the public Kids library.
  return isKidsContentType(item.type);
}

export function normalizeKidsContentSlug(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}


const GENERIC_KIDS_ENGLISH_CONTENT = /^original educational content prepared for (?:zikr )?families\\.?$/i;

/** Reject known seed placeholders so English pages never present editorial metadata as translated content. */
export function hasKidsEnglishContent(item: { title_en?: unknown; content_en?: unknown }): boolean {
  const title = typeof item.title_en === "string" ? item.title_en.trim() : "";
  const content = typeof item.content_en === "string" ? item.content_en.trim().replace(/\\s+/g, " ") : "";
  return Boolean(title && content) && !GENERIC_KIDS_ENGLISH_CONTENT.test(content);
}

export function mergeKidsContentWithFallback<T extends { slug: string; type?: unknown; metadata?: unknown }>(
  databaseItems: readonly T[],
  fallbackItems: readonly T[],
  knownDatabaseSlugs: ReadonlySet<string>,
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of databaseItems) {
    const slug = normalizeKidsContentSlug(item.slug);
    if (!slug || seen.has(slug) || !isKidsContentPubliclyVisible(item)) continue;
    seen.add(slug);
    merged.push(item);
  }

  for (const item of fallbackItems) {
    if (!isKidsContentPubliclyVisible(item)) continue;
    const slug = normalizeKidsContentSlug(item.slug);
    if (!slug || seen.has(slug) || knownDatabaseSlugs.has(slug)) continue;
    seen.add(slug);
    merged.push(item);
  }

  return merged;
}

export function getFallbackKidsContentBySlug<T extends { slug: string; type?: unknown; metadata?: unknown }>(
  slug: string,
  fallbackItems: readonly T[],
  knownDatabaseSlugs: ReadonlySet<string>,
): T | null {
  const normalizedSlug = normalizeKidsContentSlug(slug);
  if (!normalizedSlug || knownDatabaseSlugs.has(normalizedSlug)) return null;
  return fallbackItems.find((item) =>
    isKidsContentPubliclyVisible(item) &&
    normalizeKidsContentSlug(item.slug) === normalizedSlug,
  ) ?? null;
}

/** Return a temporary-unavailable response only when both independent Kids lookups failed. */
export function shouldTreatKidsContentLookupAsUnavailable(
  publicResultStatus: "fulfilled" | "rejected",
  visibilityResultStatus: "fulfilled" | "rejected",
): boolean {
  return publicResultStatus === "rejected" && visibilityResultStatus === "rejected";
}
