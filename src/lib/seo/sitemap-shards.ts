export const SITEMAP_PAGE_SIZE = 45_000;

export function getSitemapShardCountForEntryCount(entryCount: number): number {
  if (!Number.isSafeInteger(entryCount) || entryCount < 0) {
    throw new RangeError("Sitemap entry count must be a non-negative safe integer.");
  }
  return Math.max(1, Math.ceil(entryCount / SITEMAP_PAGE_SIZE));
}

export function getSitemapShard<T>(entries: readonly T[], shardId: number): T[] {
  if (!Number.isSafeInteger(shardId) || shardId < 0) return [];
  const start = shardId * SITEMAP_PAGE_SIZE;
  return entries.slice(start, start + SITEMAP_PAGE_SIZE);
}
