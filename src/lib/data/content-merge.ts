export function mergePublishedBySlug<T extends { slug: string }>(
  primary: T[],
  fallback: T[],
): T[] {
  const seen = new Set(primary.map(item => item.slug));
  return [
    ...primary,
    ...fallback.filter(item => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    }),
  ];
}

/**
 * Canonical public-content policy:
 * published database content is authoritative whenever it exists.
 * Offline/static data is a cold fallback for an unavailable or empty
 * canonical catalogue, not a second publication source.
 */
export function resolveCanonicalPublished<T>(
  primary: T[],
  fallback: T[],
): T[] {
  return primary.length > 0 ? primary : fallback;
}
