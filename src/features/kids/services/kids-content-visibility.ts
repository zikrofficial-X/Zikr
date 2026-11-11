function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function isKidsContentPubliclyVisible(item: { type?: unknown; metadata?: unknown }): boolean {
  if (item.type !== "story") return true;
  return asRecord(item.metadata).age_appropriate === true;
}

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
    if (!isKidsContentPubliclyVisible(item)) continue;
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
  return fallbackItems.find((item) =>
    isKidsContentPubliclyVisible(item) &&
    normalizeKidsContentSlug(item.slug) === normalizedSlug,
  ) ?? null;
}
