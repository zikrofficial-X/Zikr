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

export function resolveVideoYoutubeId(row: Record<string, unknown>): string | null {
  const metadata = metadataFor(row);
  const mediaState = typeof metadata.mediaState === "string" ? metadata.mediaState : "";
  if (
    metadata.generator === "zikr_internal_video_factory" &&
    ["cloudinary_missing", "unavailable", "youtube_only", "purged"].includes(mediaState)
  ) {
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
    ["cloudinary_missing", "unavailable", "purged"].includes(mediaState)
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
  const mediaState = typeof metadata.mediaState === "string" ? metadata.mediaState : "";
  const internalFallbackState = metadata.generator === "zikr_internal_video_factory" &&
    ["cloudinary_missing", "unavailable", "purged"].includes(mediaState);
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
