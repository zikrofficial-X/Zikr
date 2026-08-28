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
