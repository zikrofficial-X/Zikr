import { getServerEnv } from "@/lib/env";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

type QueueRow = {
  id: string;
  title: string;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
};

type YoutubeStatistics = {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
};

type YoutubeVideo = {
  id: string;
  statistics?: YoutubeStatistics;
};

type YoutubeVideosResponse = {
  items?: YoutubeVideo[];
  error?: { message?: string };
};

export type YoutubePostInsightsSyncResult = {
  configured: boolean;
  candidates: number;
  fetched: number;
  updated: number;
};

const INSIGHTS_REFRESH_MS = 6 * 60 * 60 * 1000;
const MAX_INSIGHTS_BATCH = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asCount(value: string | undefined): number | null {
  if (value == null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function remoteYoutubeId(metadata: Record<string, unknown> | null): string | null {
  const platformResults = metadata?.platformResults;
  if (!isRecord(platformResults)) return null;
  const youtube = platformResults.youtube;
  if (!isRecord(youtube) || youtube.ok !== true || typeof youtube.remoteId !== "string") return null;
  const id = youtube.remoteId.trim();
  return /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
}

function shouldRefresh(metadata: Record<string, unknown> | null, now: number): boolean {
  const insights = metadata?.platformInsights;
  if (!isRecord(insights) || !isRecord(insights.youtube)) return true;
  const capturedAt = insights.youtube.capturedAt;
  if (typeof capturedAt !== "string") return true;
  const timestamp = Date.parse(capturedAt);
  return !Number.isFinite(timestamp) || now - timestamp >= INSIGHTS_REFRESH_MS;
}

/**
 * Sync only public YouTube Data API statistics for ZIKR's own published videos.
 * Audience retention and watch-time are intentionally not fabricated; those
 * require YouTube Analytics OAuth authorization and are not returned here.
 */
export async function syncYoutubePublishedPostInsights(
  limit = MAX_INSIGHTS_BATCH,
): Promise<YoutubePostInsightsSyncResult> {
  const apiKey = getServerEnv().YOUTUBE_API_KEY?.trim();
  if (!apiKey) return { configured: false, candidates: 0, fetched: 0, updated: 0 };

  const boundedLimit = Math.max(1, Math.min(250, Math.floor(limit)));
  const rows = await supabaseServerAdminRequest<QueueRow[]>(
    "/rest/v1/social_publish_queue?status=eq.published&published_at=not.is.null&content_type=like.*_video&select=id,title,metadata,published_at&order=published_at.desc&limit=" + boundedLimit,
  );
  const now = Date.now();
  const candidates = (rows ?? [])
    .flatMap((row) => {
      const videoId = remoteYoutubeId(row.metadata);
      if (!videoId || !shouldRefresh(row.metadata, now)) return [];
      return [{ row, videoId }];
    })
    .slice(0, MAX_INSIGHTS_BATCH);

  if (!candidates.length) return { configured: true, candidates: 0, fetched: 0, updated: 0 };

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", candidates.map((item) => item.videoId).join(","));
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    // Do not include the request URL or API key in logs/errors.
    throw new Error("YouTube public statistics request failed (HTTP " + response.status + ").");
  }
  const payload = (await response.json()) as YoutubeVideosResponse;
  if (payload.error) throw new Error("YouTube public statistics endpoint returned an API error.");

  const byId = new Map<string, YoutubeVideo>((payload.items ?? []).map((video) => [video.id, video]));
  const capturedAt = new Date().toISOString();
  let updated = 0;

  for (const { row, videoId } of candidates) {
    const video = byId.get(videoId);
    if (!video?.statistics) continue;
    const currentMetadata = row.metadata ?? {};
    const currentInsights = isRecord(currentMetadata.platformInsights)
      ? currentMetadata.platformInsights
      : {};
    const nextMetadata = {
      ...currentMetadata,
      platformInsights: {
        ...currentInsights,
        youtube: {
          videoId,
          views: asCount(video.statistics.viewCount),
          likes: asCount(video.statistics.likeCount),
          comments: asCount(video.statistics.commentCount),
          capturedAt,
          source: "youtube-data-api-v3",
          scope: "public-statistics",
        },
      },
    };
    await supabaseServerAdminRequest(
      "/rest/v1/social_publish_queue?id=eq." + encodeURIComponent(row.id) + "&status=eq.published",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ metadata: nextMetadata, updated_at: capturedAt }),
      },
    );
    updated += 1;
  }

  return { configured: true, candidates: candidates.length, fetched: byId.size, updated };
}
