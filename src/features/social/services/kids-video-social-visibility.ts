import { getManualReconciliationPlatforms, hasMalformedSocialPlatformResults, normalizeSocialPlatformResults } from "./platform-availability";
import { isSocialPlatformDeletionCurrent } from "./social-deletion-visibility";

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
  if (row.status !== "published" && row.status !== "partial") return [];
  const metadata = asRecord(row.metadata);
  const rawPlatformResults = metadata.platformResults;
  // Duplicate or malformed result entries are ambiguous even if normalization
  // would otherwise keep the last entry for a platform. Public feeds must fail closed.
  if (hasMalformedSocialPlatformResults(rawPlatformResults)) return [];
  const platformResults = normalizeSocialPlatformResults(rawPlatformResults);
  const manualReconciliationPlatforms = new Set<string>(
    getManualReconciliationPlatforms({ ...metadata, sourceMediaMissing: false }),
  );
  // Only an absent/null field is a legacy row. An explicit empty ledger is
  // authoritative and must not fall back to target_platforms.
  const hasPlatformResultLedger = rawPlatformResults !== undefined && rawPlatformResults !== null;
  const platformDeletions = asRecord(metadata.platformDeletions);
  const targets = new Set(
    (Array.isArray(row.target_platforms) ? row.target_platforms : [])
      .filter((platform): platform is string => typeof platform === "string" && SOCIAL_PLATFORMS.has(platform)),
  );
  const isDeleted = (platform: string, deliveryRemoteId?: string) =>
    isSocialPlatformDeletionCurrent(
      platformDeletions[platform],
      deliveryRemoteId,
      row.published_at,
    );

  const delivered = Object.entries(platformResults)
    .filter(([platform, value]) => {
      if (!SOCIAL_PLATFORMS.has(platform) || !targets.has(platform)) return false;
      const result = asRecord(value);
      const remoteId = typeof result.remoteId === "string" ? result.remoteId.trim() : "";
      return result.ok === true && remoteId.length > 0 && !manualReconciliationPlatforms.has(platform) && !isDeleted(platform, remoteId);
    })
    .map(([platform]) => platform);
  if (delivered.length > 0) return delivered;

  // Only legacy rows without a result ledger may infer delivery from the
  // original target list. An explicit result ledger with no live success is
  // authoritative and must not be replaced by that optimistic fallback.
  if (hasPlatformResultLedger || row.status !== "published") return [];
  return [...targets].filter(
    (platform) => !manualReconciliationPlatforms.has(platform) && !isDeleted(platform),
  );
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
    remoteId: string | null;
  };
  type DeletionEvent = {
    timestamp: number;
    remoteId: string | null;
  };

  const targets = new Set<string>();
  const publicationsByPlatform = new Map<string, PublicationEvent[]>();
  const deletionsByPlatform = new Map<string, DeletionEvent[]>();

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

    const platformResults = normalizeSocialPlatformResults(metadata.platformResults);
    if (Number.isFinite(publicationTimestamp)) {
      for (const platform of getConfirmedPublicKidsVideoSocialPlatforms(record)) {
        const delivery = asRecord(platformResults[platform]);
        const rawRemoteId = typeof delivery.remoteId === "string" ? delivery.remoteId.trim() : "";
        const events = publicationsByPlatform.get(platform) ?? [];
        events.push({
          timestamp: publicationTimestamp,
          publishedAt: rowPublishedAt,
          remoteId: rawRemoteId || null,
        });
        publicationsByPlatform.set(platform, events);
      }
    }

    const platformDeletions = asRecord(metadata.platformDeletions);
    for (const platform of SOCIAL_PLATFORMS) {
      const deletion = asRecord(platformDeletions[platform]);
      if (deletion.status !== "deleted") continue;
      const rawRemoteId = typeof deletion.remoteId === "string" ? deletion.remoteId.trim() : "";
      const deletedAt = typeof deletion.deletedAt === "string" ? Date.parse(deletion.deletedAt) : Number.NaN;
      const events = deletionsByPlatform.get(platform) ?? [];
      events.push({
        timestamp: Number.isFinite(deletedAt) ? deletedAt : Number.POSITIVE_INFINITY,
        remoteId: rawRemoteId || null,
      });
      deletionsByPlatform.set(platform, events);
    }
  }

  const latestByPlatform = new Map<string, PublicationEvent>();
  for (const platform of SOCIAL_PLATFORMS) {
    const deletions = deletionsByPlatform.get(platform) ?? [];
    const activePublications = (publicationsByPlatform.get(platform) ?? []).filter((publication) =>
      !deletions.some((deletion) => {
        if (deletion.remoteId && publication.remoteId) {
          return deletion.remoteId === publication.remoteId;
        }
        return deletion.timestamp >= publication.timestamp;
      }),
    );
    const latest = activePublications.reduce<PublicationEvent | null>(
      (current, publication) =>
        !current || publication.timestamp > current.timestamp ? publication : current,
      null,
    );
    if (latest) latestByPlatform.set(platform, latest);
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
