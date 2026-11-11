const SOCIAL_PLATFORMS = new Set(["youtube", "facebook", "facebook_reels"]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

/**
 * Resolve only confirmed, still-existing Kids social publications.
 * A successful remote deletion must override both the original platform result
 * and the legacy target_platforms fallback so public feeds cannot report a
 * deleted post as still published.
 */
export function getConfirmedPublicKidsVideoSocialPlatforms(value: unknown): string[] {
  const row = asRecord(value);
  const metadata = asRecord(row.metadata);
  const platformResults = asRecord(metadata.platformResults);
  const platformDeletions = asRecord(metadata.platformDeletions);
  const isDeleted = (platform: string) =>
    asRecord(platformDeletions[platform]).status === "deleted";

  const delivered = Object.entries(platformResults)
    .filter(([platform, value]) => {
      if (!SOCIAL_PLATFORMS.has(platform) || isDeleted(platform)) return false;
      const result = asRecord(value);
      return result.ok === true &&
        typeof result.remoteId === "string" &&
        result.remoteId.trim().length > 0;
    })
    .map(([platform]) => platform);
  if (delivered.length > 0) return delivered;

  // Only legacy rows without a result ledger may infer delivery from the
  // original target list. An explicit result ledger with no live success is
  // authoritative and must not be replaced by that optimistic fallback.
  if (Object.keys(platformResults).length > 0 || row.status !== "published") return [];
  const targets = Array.isArray(row.target_platforms) ? row.target_platforms : [];
  return [...new Set(targets.filter(
    (platform): platform is string =>
      typeof platform === "string" && SOCIAL_PLATFORMS.has(platform) && !isDeleted(platform),
  ))];
}

export function isPublicKidsVideoSocialQueueRow(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (row.status !== "published" && row.status !== "partial") return false;
  if (typeof row.content_type !== "string" || !row.content_type.endsWith("_video")) return false;
  if (typeof row.published_at !== "string" || !Number.isFinite(Date.parse(row.published_at))) return false;

  const metadata = asRecord(row.metadata);
  if (metadata.audience !== "kids") return false;
  if (row.status === "published") return true;

  const platformResults = asRecord(metadata.platformResults);
  const platformDeletions = asRecord(metadata.platformDeletions);
  const hasConfirmedDelivery = Object.values(platformResults).some((value) => {
    const result = asRecord(value);
    return result.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0;
  });
  const hasConfirmedDeletion = Object.values(platformDeletions).some((value) =>
    asRecord(value).status === "deleted",
  );
  // Keep a partially deleted row available to override stale catalog badges,
  // but never expose an ordinary partial row with no confirmed remote result.
  return hasConfirmedDelivery || hasConfirmedDeletion;
}
