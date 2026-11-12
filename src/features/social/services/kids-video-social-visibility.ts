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
  const rowPublishedAt = typeof row.published_at === "string" ? Date.parse(row.published_at) : Number.NaN;
  const isDeleted = (platform: string) => {
    const deletion = asRecord(platformDeletions[platform]);
    if (deletion.status !== "deleted") return false;
    const deletedAt = typeof deletion.deletedAt === "string" ? Date.parse(deletion.deletedAt) : Number.NaN;
    // If either side lacks a timestamp, keep the deletion authoritative.
    return !Number.isFinite(rowPublishedAt) || !Number.isFinite(deletedAt) || deletedAt >= rowPublishedAt;
  };

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

  const metadata = asRecord(row.metadata);
  if (metadata.audience !== "kids") return false;
  const hasConfirmedDelivery = getConfirmedPublicKidsVideoSocialPlatforms(row).length > 0;
  const hasConfirmedDeletion = Object.values(asRecord(metadata.platformDeletions)).some((value) =>
    asRecord(value).status === "deleted",
  );
  if (row.status === "published") {
    return typeof row.published_at === "string" &&
      Number.isFinite(Date.parse(row.published_at)) &&
      hasConfirmedDelivery;
  }
  // Keep a partially deleted row available to override stale catalog badges.
  // A delivery badge still requires a verifiable publication timestamp.
  const hasValidPublishedAt = typeof row.published_at === "string" && Number.isFinite(Date.parse(row.published_at));
  return hasConfirmedDeletion || (hasValidPublishedAt && hasConfirmedDelivery);
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

  type PublicationEvent = {
    state: "published" | "deleted";
    timestamp: number;
    publishedAt: string | null;
  };
  const targets = new Set<string>();
  const latestByPlatform = new Map<string, PublicationEvent>();

  for (const row of rows) {
    const record = row as Record<string, unknown>;
    const metadata = asRecord(record.metadata);
    const rowPublishedAt = typeof record.published_at === "string" ? record.published_at : null;
    const parsedPublishedAt = rowPublishedAt ? Date.parse(rowPublishedAt) : Number.NaN;
    const publicationTimestamp = Number.isFinite(parsedPublishedAt)
      ? parsedPublishedAt
      : Number.NEGATIVE_INFINITY;
    const rowTargets = Array.isArray(record.target_platforms)
      ? record.target_platforms.filter(
          (platform): platform is string =>
            typeof platform === "string" && SOCIAL_PLATFORMS.has(platform),
        )
      : [];
    for (const platform of rowTargets) targets.add(platform);

    // An unversioned success cannot supersede a deletion or become a public badge.
    if (Number.isFinite(publicationTimestamp)) {
      for (const platform of getConfirmedPublicKidsVideoSocialPlatforms(record)) {
        const current = latestByPlatform.get(platform);
      if (
        !current ||
        publicationTimestamp > current.timestamp ||
        (publicationTimestamp === current.timestamp && current.state === "deleted")
      ) {
          latestByPlatform.set(platform, {
            state: "published",
            timestamp: publicationTimestamp,
            publishedAt: rowPublishedAt,
          });
        }
      }
    }

    const deletions = asRecord(metadata.platformDeletions);
    for (const [platform, value] of Object.entries(deletions)) {
      if (!SOCIAL_PLATFORMS.has(platform) || asRecord(value).status !== "deleted") continue;
      const deletedAt = asRecord(value).deletedAt;
      const parsedDeletedAt = typeof deletedAt === "string" ? Date.parse(deletedAt) : Number.NaN;
      // Missing deletion timestamps fail closed and cannot be superseded by an
      // unversioned or otherwise unprovable publication.
      const deletionTimestamp = Number.isFinite(parsedDeletedAt)
        ? parsedDeletedAt
        : Number.POSITIVE_INFINITY;
      const current = latestByPlatform.get(platform);
      if (!current || deletionTimestamp >= current.timestamp) {
        // A confirmed deletion wins ties; only a later confirmed publication
        // can make the platform visible again.
        latestByPlatform.set(platform, {
          state: "deleted",
          timestamp: deletionTimestamp,
          publishedAt: null,
        });
      }
    }
  }

  const platforms = [...SOCIAL_PLATFORMS].filter(
    (platform) => latestByPlatform.get(platform)?.state === "published",
  );
  if (platforms.length === 0) return null;

  const activePublicationTimes = platforms
    .map((platform) => latestByPlatform.get(platform))
    .filter((event): event is PublicationEvent => event !== undefined && Number.isFinite(event.timestamp));
  const latestPublication = activePublicationTimes.reduce<PublicationEvent | null>(
    (latest, event) => !latest || event.timestamp > latest.timestamp ? event : latest,
    null,
  );
  const allTargetsPublished = targets.size > 0
    ? [...targets].every((platform) => platforms.includes(platform))
    : rows.some((row) => (row as Record<string, unknown>).status === "published");

  return {
    status: allTargetsPublished ? "published" : "partial",
    platforms,
    publishedAt: latestPublication?.publishedAt ?? null,
  };
}
