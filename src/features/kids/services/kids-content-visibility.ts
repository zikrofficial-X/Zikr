export function normalizeKidsContentSlug(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function mergeKidsContentWithFallback<T extends { slug: string }>(
  databaseItems: readonly T[],
  fallbackItems: readonly T[],
  knownDatabaseSlugs: ReadonlySet<string>,
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of databaseItems) {
    const slug = normalizeKidsContentSlug(item.slug);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    merged.push(item);
  }

  for (const item of fallbackItems) {
    const slug = normalizeKidsContentSlug(item.slug);
    if (!slug || seen.has(slug) || knownDatabaseSlugs.has(slug)) continue;
    seen.add(slug);
    merged.push(item);
  }

  return merged;
}

export function getFallbackKidsContentBySlug<T extends { slug: string }>(
  slug: string,
  fallbackItems: readonly T[],
  knownDatabaseSlugs: ReadonlySet<string>,
): T | null {
  const normalizedSlug = normalizeKidsContentSlug(slug);
  if (!normalizedSlug || knownDatabaseSlugs.has(normalizedSlug)) return null;
  return fallbackItems.find((item) => normalizeKidsContentSlug(item.slug) === normalizedSlug) ?? null;
}

export function isKidsContentPublishable(type: string, ageAppropriate: boolean): boolean {
  return type !== "story" || ageAppropriate;
}
