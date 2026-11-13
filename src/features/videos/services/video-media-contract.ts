import { normalizeSocialPlatformResults } from "../../social/services/platform-availability";

type VideoMetadata = Record<string, unknown>;

function metadataFor(row: Record<string, unknown>): VideoMetadata {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as VideoMetadata
    : {};
}

/** Preserve evidence that a catalog row was public before an earlier purge. */
export function wasPublishedBeforeMediaPurge(row: Record<string, unknown>): boolean {
  return row.published === true || metadataFor(row).mediaPurgedFromPublished === true;
}

function isValidYoutubeId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{6,20}$/.test(value.trim());
}

function youtubeIdFromUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
      return isValidYoutubeId(id) ? id : null;
    }
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      return null;
    }
    const queryId = parsed.searchParams.get("v");
    if (isValidYoutubeId(queryId)) return queryId.trim();
    const pathMatch = parsed.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,20})(?:\/|$)/);
    return pathMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * A purged internal video may use YouTube only when the publisher recorded an
 * explicit fallback flag, video ID, and matching canonical YouTube URL.
 */
export function getConfirmedYoutubeFallbackId(row: Record<string, unknown>): string | null {
  const metadata = metadataFor(row);
  if (metadata.mediaFallbackAvailable !== true) return null;
  const id = typeof metadata.youtubePublishedVideoId === "string"
    ? metadata.youtubePublishedVideoId.trim()
    : "";
  if (!isValidYoutubeId(id)) return null;
  return youtubeIdFromUrl(metadata.youtubePublishedUrl) === id ? id : null;
}

export type YoutubeQueuePublicationState =
  | { status: "published"; id: string; publishedAt: string }
  | { status: "deleted"; deletedAt: string | null }
  | { status: "conflict" };

/**
 * Resolve the newest confirmed YouTube queue event for one video-generation
 * request. A confirmed deletion wins equal timestamps and malformed deletion
 * timestamps fail closed; a strictly later confirmed publication may restore
 * the fallback.
 */
export function resolveLatestConfirmedYoutubeQueueState(
  rows: unknown[],
): YoutubeQueuePublicationState | null {
  type Publication = { id: string; publishedAt: string; timestamp: number };
  type Deletion = { remoteId: string | null; deletedAt: string | null; timestamp: number };

  // Deletions are scoped to the exact remote post ID. A late deletion of an
  // older upload must not erase a newer YouTube publication for this request.
  const publications = new Map<string, Publication>();
  const deletions = new Map<string, Deletion>();
  let uncorrelatedDeletion: Deletion | null = null;

  for (const value of rows) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    const metadata = metadataFor(row);
    const results = normalizeSocialPlatformResults(metadata.platformResults);
    const youtube = results.youtube && typeof results.youtube === "object" && !Array.isArray(results.youtube)
      ? results.youtube as Record<string, unknown>
      : {};
    const publishedAt = typeof row.published_at === "string" ? row.published_at.trim() : "";
    const publicationTimestamp = publishedAt ? Date.parse(publishedAt) : Number.NaN;

    if (
      (row.status === "published" || row.status === "partial") &&
      Number.isFinite(publicationTimestamp) &&
      youtube.ok === true &&
      isValidYoutubeId(youtube.remoteId)
    ) {
      const id = youtube.remoteId.trim();
      const previous = publications.get(id);
      if (!previous || publicationTimestamp > previous.timestamp) {
        publications.set(id, { id, publishedAt, timestamp: publicationTimestamp });
      }
    }

    const deletionMap = metadata.platformDeletions &&
      typeof metadata.platformDeletions === "object" &&
      !Array.isArray(metadata.platformDeletions)
      ? metadata.platformDeletions as Record<string, unknown>
      : {};
    const youtubeDeletion = deletionMap.youtube &&
      typeof deletionMap.youtube === "object" &&
      !Array.isArray(deletionMap.youtube)
      ? deletionMap.youtube as Record<string, unknown>
      : {};

    if (youtubeDeletion.status === "deleted") {
      const deletedAt = typeof youtubeDeletion.deletedAt === "string"
        ? youtubeDeletion.deletedAt.trim()
        : "";
      const parsedDeletedAt = deletedAt ? Date.parse(deletedAt) : Number.NaN;
      const deletionTimestamp = Number.isFinite(parsedDeletedAt)
        ? parsedDeletedAt
        : Number.POSITIVE_INFINITY;
      const rawDeletionId = typeof youtubeDeletion.remoteId === "string"
        ? youtubeDeletion.remoteId.trim()
        : "";
      const deletionRemoteId = isValidYoutubeId(rawDeletionId) ? rawDeletionId : null;
      const deletion: Deletion = {
        remoteId: deletionRemoteId,
        deletedAt: Number.isFinite(parsedDeletedAt) ? deletedAt : null,
        timestamp: deletionTimestamp,
      };

      if (deletionRemoteId) {
        const previous = deletions.get(deletionRemoteId);
        if (!previous || deletionTimestamp > previous.timestamp) {
          deletions.set(deletionRemoteId, deletion);
        }
      } else if (!uncorrelatedDeletion || deletionTimestamp > uncorrelatedDeletion.timestamp) {
        // Legacy deletion records without a remote ID cannot safely be matched
        // to one of several publications; keep the media audit fail-closed.
        uncorrelatedDeletion = deletion;
      }
    }
  }

  const latestPublicationTimestamp = Math.max(
    Number.NEGATIVE_INFINITY,
    ...[...publications.values()].map((publication) => publication.timestamp),
  );
  const latestActivePublications = [...publications.values()].filter((publication) => {
    const deletion = deletions.get(publication.id);
    return !deletion || deletion.timestamp < publication.timestamp;
  });
  const latestActiveTimestamp = Math.max(
    Number.NEGATIVE_INFINITY,
    ...latestActivePublications.map((publication) => publication.timestamp),
  );

  if (latestActivePublications.length > 0) {
    const newest = latestActivePublications.filter(
      (publication) => publication.timestamp === latestActiveTimestamp,
    );
    if (newest.length > 1) return { status: "conflict" };
    if (
      uncorrelatedDeletion &&
      uncorrelatedDeletion.timestamp >= latestPublicationTimestamp &&
      uncorrelatedDeletion.timestamp >= latestActiveTimestamp
    ) {
      return { status: "conflict" };
    }
    const publication = newest[0];
    return {
      status: "published",
      id: publication.id,
      publishedAt: publication.publishedAt,
    };
  }

  if (uncorrelatedDeletion && uncorrelatedDeletion.timestamp >= latestPublicationTimestamp) {
    return { status: "conflict" };
  }

  const deletionEvents = [...deletions.values()];
  if (deletionEvents.length === 0) return null;
  const latestDeletion = deletionEvents.reduce((latest, current) =>
    current.timestamp > latest.timestamp ? current : latest,
  );
  return { status: "deleted", deletedAt: latestDeletion.deletedAt };
}

/** Keep the catalog's YouTube fallback in sync with an authoritative queue event. */
export function reconcileYoutubeFallbackMetadata(
  metadataValue: unknown,
  state: YoutubeQueuePublicationState | null,
): VideoMetadata {
  const metadata = metadataValue && typeof metadataValue === "object" && !Array.isArray(metadataValue)
    ? { ...metadataValue as VideoMetadata }
    : {};

  if (state?.status === "deleted") {
    return {
      ...metadata,
      youtubePublishedVideoId: null,
      youtubePublishedUrl: null,
      youtubePublishedAt: null,
      mediaFallbackAvailable: false,
    };
  }

  if (state?.status === "published") {
    return {
      ...metadata,
      youtubePublishedVideoId: state.id,
      youtubePublishedUrl: "https://www.youtube.com/watch?v=" + state.id,
      youtubePublishedAt: state.publishedAt,
      mediaFallbackAvailable: true,
    };
  }

  return metadata;
}

export function isUnlinkedInternalVideoMedia(row: Record<string, unknown>): boolean {
  const metadata = metadataFor(row);
  return metadata.generator === "zikr_internal_video_factory" && metadata.mediaState === "unlinked";
}

/** Keep an explicit purge tombstone until a confirmed publication recovery changes it. */
export function isPurgedInternalVideoMedia(row: Record<string, unknown>): boolean {
  const metadata = metadataFor(row);
  return metadata.generator === "zikr_internal_video_factory" && metadata.mediaState === "purged";
}

export function resolveVideoYoutubeId(row: Record<string, unknown>): string | null {
  const metadata = metadataFor(row);
  if (isUnlinkedInternalVideoMedia(row)) return null;
  if (metadata.generator === "zikr_internal_video_factory") {
    // Internal factory IDs are usable only after the publisher recorded the
    // remote ID and matching canonical URL, regardless of the current media state.
    return getConfirmedYoutubeFallbackId(row);
  }
  const id = typeof row.youtube_id === "string" ? row.youtube_id.trim() : "";
  return isValidYoutubeId(id) ? id : null;
}

export function shouldKeepPublishedVideoAfterMediaPurge(
  row: Record<string, unknown>,
  includeFiles: boolean,
): boolean {
  return includeFiles === true &&
    row.published === true &&
    getConfirmedYoutubeFallbackId(row) !== null;
}

export function resolveVideoMediaUrl(row: Record<string, unknown>): string | null {
  const metadata = metadataFor(row);
  if (isUnlinkedInternalVideoMedia(row)) return null;
  const mediaState = typeof metadata.mediaState === "string" ? metadata.mediaState : "";
  const youtubeId = resolveVideoYoutubeId(row);
  const youtubeUrl = youtubeId
    ? "https://www.youtube.com/watch?v=" + encodeURIComponent(youtubeId)
    : null;

  // A purged internal master must never fall through to a stale Cloudinary
  // source/generated URL. Only an explicitly confirmed YouTube publication is
  // a safe playback fallback.
  if (
    metadata.generator === "zikr_internal_video_factory" &&
    ["cloudinary_missing", "unavailable", "youtube_only", "purged"].includes(mediaState)
  ) {
    return youtubeUrl;
  }

  const candidates = metadata.generator === "zikr_internal_video_factory"
    ? [
        metadata.generatedVideoUrl,
        metadata.videoUrl,
        metadata.video_url,
        metadata.sourceVideoUrl,
      ]
    : [
        metadata.sourceVideoUrl,
        metadata.generatedVideoUrl,
        metadata.videoUrl,
        metadata.video_url,
      ];
  for (const value of candidates) {
    if (typeof value !== "string") continue;
    try {
      const parsed = new URL(value.trim());
      if (metadata.generator === "zikr_internal_video_factory") {
        if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") continue;
      } else if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        continue;
      }
      return parsed.toString();
    } catch {
      continue;
    }
  }

  return youtubeUrl;
}

export function resolveVideoThumbnail(
  row: Record<string, unknown>,
  fallbackImage: string,
): string {
  const metadata = metadataFor(row);
  if (isUnlinkedInternalVideoMedia(row)) return fallbackImage;
  const mediaState = typeof metadata.mediaState === "string" ? metadata.mediaState : "";
  const internalFallbackState = metadata.generator === "zikr_internal_video_factory" &&
    ["cloudinary_missing", "unavailable", "youtube_only", "purged"].includes(mediaState);
  const youtubeId = resolveVideoYoutubeId(row);
  if (internalFallbackState) {
    return youtubeId
      ? "https://i.ytimg.com/vi/" + encodeURIComponent(youtubeId) + "/hqdefault.jpg"
      : fallbackImage;
  }

  const direct = typeof row.thumbnail_url === "string" ? row.thumbnail_url.trim() : "";
  if (direct) return direct;

  for (const key of ["thumbnailUrl", "thumbnail_url", "sourceThumbnailUrl", "generatedThumbnailUrl"]) {
    const value = metadata[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
  }

  for (const key of ["generatedVideoUrl", "videoUrl", "video_url"]) {
    const value = metadata[key];
    if (typeof value !== "string") continue;
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") continue;
      if (!parsed.pathname.includes("/video/upload/")) continue;
      const posterPath = parsed.pathname
        .replace("/video/upload/", "/video/upload/so_0/")
        .replace(/\.(mp4|webm|mov|m4v)$/i, ".jpg");
      return parsed.origin + posterPath;
    } catch {
      continue;
    }
  }

  if (youtubeId) {
    return "https://i.ytimg.com/vi/" + encodeURIComponent(youtubeId) + "/hqdefault.jpg";
  }
  return fallbackImage;
}

/**
 * A purge may hide a video before its already-successful YouTube upload has
 * been reconciled. Restore it only when it was public before that purge and
 * the applicable automated QA gates still pass.
 */
export function shouldRestorePurgedPublishedVideo(row: Record<string, unknown>): boolean {
  const metadata = metadataFor(row);
  const qa = metadata.automatedVideoQa && typeof metadata.automatedVideoQa === "object" && !Array.isArray(metadata.automatedVideoQa)
    ? metadata.automatedVideoQa as Record<string, unknown>
    : {};
  const audience = metadata.audience;
  const audienceEligible = audience === "general" ||
    (audience === "kids" && metadata.kidsVideoQaStatus === "passed");

  return row.published === false &&
    metadata.generator === "zikr_internal_video_factory" &&
    metadata.mediaState === "purged" &&
    metadata.mediaPurgedFromPublished === true &&
    qa.status === "passed" &&
    audienceEligible;
}
