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

export type KidsVideoSocialPublication = {
  status: "published" | "partial";
  platforms: string[];
  publishedAt: string | null;
};

/**
 * Aggregate the original social queue row and any supplemental target rows for
 * one generated Kids video. A newer supplemental row must not hide confirmed
 * platforms from the original row, and a confirmed deletion wins across rows.
 */
export function resolveKidsVideoSocialPublication(
  rowsInput: readonly unknown[],
  stored: unknown,
  queueReadSucceeded: boolean,
): KidsVideoSocialPublication | null {
  if (!queueReadSucceeded) return null;

  const rows = rowsInput.filter((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const row = value as Record<string, unknown>;
    const metadata = asRecord(row.metadata);
    return typeof row.content_type === "string" &&
      row.content_type.endsWith("_video") &&
      metadata.audience === "kids";
  });

  if (rows.length === 0) {
    if (rowsInput.length > 0) return null;
    const storedRecord = asRecord(stored);
    const storedPlatforms = Array.isArray(storedRecord.platforms)
      ? [...new Set(storedRecord.platforms.filter(
          (platform): platform is string =>
            typeof platform === "string" && SOCIAL_PLATFORMS.has(platform),
        ))]
      : [];
    if (storedPlatforms.length === 0) return null;
    return {
      status: storedRecord.status === "published" ? "published" : "partial",
      platforms: storedPlatforms,
      publishedAt: typeof storedRecord.publishedAt === "string" &&
        Number.isFinite(Date.parse(storedRecord.publishedAt))
        ? storedRecord.publishedAt
        : null,
    };
  }

  const targets = new Set<string>();
  const delivered = new Set<string>();
  const deleted = new Set<string>();
  let publishedAt: string | null = null;
  let latestPublishedAt = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const record = row as Record<string, unknown>;
    const metadata = asRecord(record.metadata);
    const rowTargets = Array.isArray(record.target_platforms)
      ? record.target_platforms.filter(
          (platform): platform is string =>
            typeof platform === "string" && SOCIAL_PLATFORMS.has(platform),
        )
      : [];
    for (const platform of rowTargets) targets.add(platform);

    for (const platform of getConfirmedPublicKidsVideoSocialPlatforms(record)) {
      delivered.add(platform);
    }

    const deletions = asRecord(metadata.platformDeletions);
    for (const [platform, value] of Object.entries(deletions)) {
      if (SOCIAL_PLATFORMS.has(platform) && asRecord(value).status === "deleted") {
        deleted.add(platform);
      }
    }

    const rowPublishedAt = record.published_at;
    if (
      getConfirmedPublicKidsVideoSocialPlatforms(record).length > 0 &&
      typeof rowPublishedAt === "string" &&
      Number.isFinite(Date.parse(rowPublishedAt))
    ) {
      const timestamp = Date.parse(rowPublishedAt);
      if (timestamp > latestPublishedAt) {
        latestPublishedAt = timestamp;
        publishedAt = rowPublishedAt;
      }
    }
  }

  const platforms = [...SOCIAL_PLATFORMS].filter(
    (platform) => delivered.has(platform) && !deleted.has(platform),
  );
  if (platforms.length === 0) return null;

  const allTargetsPublished = targets.size > 0
    ? [...targets].every((platform) => platforms.includes(platform))
    : rows.some((row) => (row as Record<string, unknown>).status === "published");

  return {
    status: allTargetsPublished ? "published" : "partial",
    platforms,
    publishedAt,
  };
}
