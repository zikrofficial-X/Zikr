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
