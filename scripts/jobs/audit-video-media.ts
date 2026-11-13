import { getServerEnv } from "../../src/lib/env";
import { isVideoContentType } from "../../src/features/videos/services/video-publish-approval";
import {
  getConfirmedYoutubeFallbackId,
  isUnlinkedInternalVideoMedia,
  reconcileYoutubeFallbackMetadata,
  resolveLatestConfirmedYoutubeQueueState,
  type YoutubeQueuePublicationState,
} from "../../src/features/videos/services/video-media-contract";
import { supabaseServerAdminExactCount, supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";
import { assertCompleteVideoMediaAuditInventory, isBlockingVideoMediaAuditOutcome } from "../../src/features/videos/services/video-media-audit-outcome";

type JsonRecord = Record<string, unknown>;
type VideoCatalogRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  youtube_id: string | null;
  thumbnail_url: string | null;
  metadata: JsonRecord | null;
  updated_at: string | null;
};
type SocialQueueRow = {
  content_id: string | null;
  content_type: string;
  status: string;
  metadata: JsonRecord | null;
  published_at: string | null;
};
type MediaProbe = {
  status: "available" | "missing" | "unknown";
  httpStatus: number | null;
  contentType: string | null;
  reason?: string;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function validYouTubeId(value: unknown): string | null {
  const id = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}


function cloudinaryAssetUrl(metadata: JsonRecord): string | null {
  for (const key of ["generatedVideoUrl", "videoUrl", "video_url", "sourceVideoUrl"]) {
    const value = metadata[key];
    if (typeof value !== "string" || !value.trim()) continue;
    try {
      const parsed = new URL(value.trim());
      if (
        parsed.protocol === "https:" &&
        parsed.hostname === "res.cloudinary.com" &&
        parsed.pathname.includes("/video/upload/") &&
        /\.(mp4|webm|mov|m4v)$/i.test(parsed.pathname)
      ) return parsed.toString();
    } catch {}
  }
  return null;
}

async function probeCloudinary(url: string): Promise<MediaProbe> {
  const probe = async (method: "HEAD" | "GET") => fetch(url, {
    method,
    ...(method === "GET" ? { headers: { Range: "bytes=0-0" } } : {}),
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  try {
    let response = await probe("HEAD");
    if (response.status === 405 || response.status === 501) {
      response = await probe("GET");
      await response.body?.cancel();
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? null;
    const isVideo = Boolean(contentType && (
      contentType.startsWith("video/") || contentType.includes("application/octet-stream")
    ));
    if ((response.ok || response.status === 206) && isVideo) {
      return { status: "available", httpStatus: response.status, contentType };
    }
    if (response.status === 404 || response.status === 410) {
      return { status: "missing", httpStatus: response.status, contentType, reason: "asset_not_found" };
    }
    if (response.ok || response.status === 206) {
      return { status: "unknown", httpStatus: response.status, contentType, reason: "unexpected_content_type" };
    }
    if ([401, 403].includes(response.status)) {
      return { status: "unknown", httpStatus: response.status, contentType, reason: "asset_access_restricted" };
    }
    return { status: "unknown", httpStatus: response.status, contentType, reason: "transient_or_unclassified_http_status" };
  } catch (error) {
    return {
      status: "unknown",
      httpStatus: null,
      contentType: null,
      reason: error instanceof Error ? error.name : "network_error",
    };
  }
}

function thumbnailFor(metadata: JsonRecord, youtubeId: string | null, current: string | null): string | null {
  if (current?.trim()) return current.trim();
  if (youtubeId) return "https://i.ytimg.com/vi/" + youtubeId + "/hqdefault.jpg";
  const url = cloudinaryAssetUrl(metadata);
  if (url) {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname
      .replace("/video/upload/", "/video/upload/so_0/")
      .replace(/\.(mp4|webm|mov|m4v)$/i, ".jpg");
  }
  return "/branding/og-image.jpg";
}

async function patchCatalog(row: VideoCatalogRow, patch: Record<string, unknown>) {
  const updatedAt = row.updated_at;
  if (!updatedAt) {
    throw new Error("Cannot safely update video media audit without an updated_at compare-and-set token.");
  }
  const filter = "/rest/v1/videos?id=eq." + encodeURIComponent(row.id) +
    "&updated_at=eq." + encodeURIComponent(updatedAt);
  const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(filter, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
  return Boolean(updated?.length);
}

function comparableMediaAudit(value: unknown): JsonRecord {
  const { checkedAt: _checkedAt, ...stableFields } = asRecord(value);
  return stableFields;
}

async function auditOne(
  row: VideoCatalogRow,
  youtubePublicationsByRequest: Map<string, YoutubeQueuePublicationState>,
  now: string,
) {
  const metadata = asRecord(row.metadata);
  if (isUnlinkedInternalVideoMedia(row)) {
    return {
      state: "skipped",
      id: row.id,
      title: row.title,
      reason: "media_explicitly_unlinked",
    };
  }
  const requestId = typeof metadata.videoGenerationRequestId === "string"
    ? metadata.videoGenerationRequestId
    : "";
  const queueState = requestId ? youtubePublicationsByRequest.get(requestId) ?? null : null;
  if (queueState?.status === "conflict") {
    return { state: "conflict", id: row.id, title: row.title, reason: "multiple_youtube_publications_share_timestamp" };
  }
  const queuePublication = queueState?.status === "published" ? queueState : null;
  const queueYouTubeId = queuePublication?.id ?? null;
  const youtubeDeletionConfirmed = queueState?.status === "deleted";
  const existingYouTubeId = validYouTubeId(row.youtube_id);
  const metadataYoutubeId = getConfirmedYoutubeFallbackId({
    youtube_id: row.youtube_id,
    metadata: row.metadata,
  });
  const candidateYoutubeIds = [existingYouTubeId, metadataYoutubeId, queueYouTubeId]
    .filter((value): value is string => value !== null);
  if (!youtubeDeletionConfirmed && new Set(candidateYoutubeIds).size > 1) {
    return { state: "conflict", id: row.id, title: row.title, reason: "catalog_youtube_id_conflicts_with_confirmed_fallback" };
  }
  const confirmedYoutubeFallbackId = youtubeDeletionConfirmed ? null : queueYouTubeId ?? metadataYoutubeId;
  const youtubeId = youtubeDeletionConfirmed ? null : existingYouTubeId ?? confirmedYoutubeFallbackId;
  const hasConfirmedYoutubeFallback = Boolean(
    confirmedYoutubeFallbackId && confirmedYoutubeFallbackId === youtubeId,
  );
  const assetUrl = cloudinaryAssetUrl(metadata);
  const probe = assetUrl ? await probeCloudinary(assetUrl) : null;

  let mediaState: string;
  if (assetUrl && probe?.status === "available") mediaState = "cloudinary_ready";
  else if (assetUrl && probe?.status === "missing") mediaState = "cloudinary_missing";
  else if (!assetUrl && hasConfirmedYoutubeFallback) mediaState = "youtube_only";
  else if (!assetUrl) mediaState = "unavailable";
  else mediaState = typeof metadata.mediaState === "string" ? metadata.mediaState : "unverified";

  const nextMetadata: JsonRecord = {
    ...reconcileYoutubeFallbackMetadata(metadata, queueState),
    mediaState,
    mediaAudit: {
      checkedAt: now,
      source: assetUrl ? "cloudinary_head_or_range" : hasConfirmedYoutubeFallback ? "published_youtube_reference" : "no_confirmed_playable_reference",
      httpStatus: probe?.httpStatus ?? null,
      contentType: probe?.contentType ?? null,
      result: probe?.status ?? (hasConfirmedYoutubeFallback ? "youtube_fallback" : "unavailable"),
      reason: probe?.reason ?? null,
      youtubeFallbackAvailable: hasConfirmedYoutubeFallback,
    },
    ...(queueYouTubeId ? {
      youtubePublishedVideoId: queueYouTubeId,
      youtubePublishedUrl: "https://www.youtube.com/watch?v=" + queueYouTubeId,
      ...(queuePublication?.publishedAt ? { youtubePublishedAt: queuePublication.publishedAt } : {}),
      mediaFallbackAvailable: true,
    } : {}),
  };
  const thumbnail = thumbnailFor(metadata, confirmedYoutubeFallbackId, row.thumbnail_url);
  const patch: Record<string, unknown> = {
    metadata: nextMetadata,
  };
  if (row.youtube_id !== youtubeId) patch.youtube_id = youtubeId;
  if (!row.thumbnail_url && thumbnail) patch.thumbnail_url = thumbnail;

  const mediaStateChanged = nextMetadata.mediaState !== metadata.mediaState;
  const mediaAuditChanged = JSON.stringify(comparableMediaAudit(nextMetadata.mediaAudit)) !==
    JSON.stringify(comparableMediaAudit(metadata.mediaAudit));
  // checkedAt is observational metadata, not a catalog change. Do not rewrite
  // every published row on every daily audit and invalidate admin updated_at guards.
  const confirmedFallbackChanged =
    nextMetadata.youtubePublishedVideoId !== metadata.youtubePublishedVideoId ||
    nextMetadata.youtubePublishedUrl !== metadata.youtubePublishedUrl ||
    nextMetadata.youtubePublishedAt !== metadata.youtubePublishedAt ||
    nextMetadata.mediaFallbackAvailable !== metadata.mediaFallbackAvailable;
  const needsUpdate = mediaStateChanged || mediaAuditChanged || confirmedFallbackChanged ||
    row.youtube_id !== youtubeId ||
    (!row.thumbnail_url && Boolean(thumbnail));
  if (!needsUpdate) {
    return { state: mediaState, id: row.id, updated: false, youtubeFallback: hasConfirmedYoutubeFallback };
  }
  if (!row.updated_at) {
    return {
      state: "conflict",
      id: row.id,
      title: row.title,
      reason: "catalog_row_missing_updated_at_for_compare_and_set",
    };
  }
  const updated = await patchCatalog(row, patch);
  if (!updated) {
    return {
      state: "conflict",
      id: row.id,
      title: row.title,
      reason: "catalog_row_changed_during_media_audit",
    };
  }
  return { state: mediaState, id: row.id, title: row.title, updated: true, youtubeFallback: hasConfirmedYoutubeFallback, httpStatus: probe?.httpStatus ?? null };
}

async function main() {
  const env = getServerEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Video media audit requires the production Supabase service-role environment.");
  }
  const [videos, queue, videoTableCount, socialQueueTableCount] = await Promise.all([
    supabaseServerAdminRequest<VideoCatalogRow[]>(
      "/rest/v1/videos?published=eq.true&metadata->>generator=eq.zikr_internal_video_factory&select=id,slug,title,published,youtube_id,thumbnail_url,metadata,updated_at&order=created_at.asc&limit=1000",
    ),
    supabaseServerAdminRequest<SocialQueueRow[]>(
      "/rest/v1/social_publish_queue?status=in.(published,partial)&select=content_id,content_type,status,metadata,published_at&order=published_at.desc&limit=1000",
    ),
    // Count the whole tables exactly: Supabase PostgREST caps responses at max_rows=1000.
    // If either table reaches that cap, refuse to mutate a possibly partial audit inventory.
    supabaseServerAdminExactCount("videos"),
    supabaseServerAdminExactCount("social_publish_queue"),
  ]);
  assertCompleteVideoMediaAuditInventory(videoTableCount, socialQueueTableCount);

  const youtubeQueueRowsByRequest = new Map<string, SocialQueueRow[]>();
  for (const row of queue ?? []) {
    if (!row.content_id || !isVideoContentType(row.content_type)) continue;
    const requestRows = youtubeQueueRowsByRequest.get(row.content_id) ?? [];
    requestRows.push(row);
    youtubeQueueRowsByRequest.set(row.content_id, requestRows);
  }
  const youtubePublicationsByRequest = new Map<string, YoutubeQueuePublicationState>();
  for (const [requestId, requestRows] of youtubeQueueRowsByRequest) {
    const state = resolveLatestConfirmedYoutubeQueueState(requestRows);
    if (state) youtubePublicationsByRequest.set(requestId, state);
  }

  const rows = videos ?? [];
  const now = new Date().toISOString();
  let cursor = 0;
  const results: Array<Awaited<ReturnType<typeof auditOne>>> = [];
  const concurrency = Math.min(5, Math.max(1, rows.length));
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= rows.length) return;
      try {
        results[index] = await auditOne(rows[index], youtubePublicationsByRequest, now);
      } catch (error) {
        results[index] = {
          state: "error",
          id: rows[index].id,
          title: rows[index].title,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }));

  const summary = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.state] = (acc[result.state] ?? 0) + 1;
    if ("updated" in result && result.updated) acc.updated = (acc.updated ?? 0) + 1;
    return acc;
  }, {});
  console.log("[video-media-audit] " + JSON.stringify({ checked: rows.length, summary, at: now }));
  const blockingResults = results.filter(isBlockingVideoMediaAuditOutcome);
  for (const result of blockingResults) {
    console.error("[video-media-audit] attention:", JSON.stringify(result));
  }
  if (blockingResults.length > 0) {
    console.error(`[video-media-audit] ${blockingResults.length} blocking result(s); marking the job failed.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[video-media-audit] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
