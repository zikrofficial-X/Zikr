import { normalizeSocialPlatformResults } from "./platform-availability";

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
  const rawPlatformResults = metadata.platformResults;
  const platformResults = normalizeSocialPlatformResults(rawPlatformResults);
  const hasPlatformResultLedger = Array.isArray(rawPlatformResults)
    ? rawPlatformResults.length > 0
    : Object.keys(platformResults).length > 0;
  const platformDeletions = asRecord(metadata.platformDeletions);
  const isDeleted = (platform: string, deliveryRemoteId?: string) => {
    const deletion = asRecord(platformDeletions[platform]);
    if (deletion.status !== "deleted") return false;

    const deletedRemoteId = typeof deletion.remoteId === "string" ? deletion.remoteId.trim() : "";
    if (deletedRemoteId) {
      // A shared queue published_at can advance when another platform retries.
      // Tie confirmed deletions to the exact remote post ID instead.
      return !deliveryRemoteId || deletedRemoteId === deliveryRemoteId;
    }

    // Legacy deletions without a remote ID cannot be tied to a later delivery.
    // Fail closed rather than letting a shared published_at timestamp resurrect
    // a post that may still be the one that was deleted.
    return true;
  };

  const delivered = Object.entries(platformResults)
    .filter(([platform, value]) => {
      if (!SOCIAL_PLATFORMS.has(platform)) return false;
      const result = asRecord(value);
      const remoteId = typeof result.remoteId === "string" ? result.remoteId.trim() : "";
      return result.ok === true && remoteId.length > 0 && !isDeleted(platform, remoteId);
    })
    .map(([platform]) => platform);
  if (delivered.length > 0) return delivered;

  // Only legacy rows without a result ledger may infer delivery from the
  // original target list. An explicit result ledger with no live success is
  // authoritative and must not be replaced by that optimistic fallback.
  if (hasPlatformResultLedger || row.status !== "published") return [];
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
 * platforms from the original row, and deletion state stays scoped to its exact remote post.
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
    timestamp: number;
    publishedAt: string | null;
  };
  const targets = new Set<string>();
  const latestByPlatform = new Map<string, PublicationEvent>();

  // Deletions are applied to their exact queue row and remote ID by
  // getConfirmedPublicKidsVideoSocialPlatforms. Do not turn a deletion on an
  // older row into a platform-wide tombstone that hides a newer live post.
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
          publicationTimestamp > current.timestamp
        ) {
          latestByPlatform.set(platform, {
            timestamp: publicationTimestamp,
            publishedAt: rowPublishedAt,
          });
        }
      }
    }
  }

  const platforms = [...SOCIAL_PLATFORMS].filter((platform) => latestByPlatform.has(platform));
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
