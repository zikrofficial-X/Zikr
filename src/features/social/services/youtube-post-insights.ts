import { getServerEnv } from "@/lib/env";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

type QueueRow = {
  id: string;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
};

type ExistingInsightRow = { queue_id: string; captured_at: string };
type YoutubeStatistics = {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
};
type YoutubeVideo = { id: string; statistics?: YoutubeStatistics };
type YoutubeVideosResponse = { items?: YoutubeVideo[]; error?: { message?: string } };
type InsightUpsert = {
  queue_id: string;
  platform: "youtube";
  video_id: string;
  metrics: { views: number | null; likes: number | null; comments: number | null };
  captured_at: string;
  source: "youtube-data-api-v3";
  scope: "public-statistics";
  updated_at: string;
};

export type YoutubePostInsightsSyncResult = {
  configured: boolean;
  candidates: number;
  fetched: number;
  updated: number;
};

const INSIGHTS_REFRESH_MS = 6 * 60 * 60 * 1000;
const MAX_INSIGHTS_BATCH = 50;
const INSIGHTS_PAGE_SIZE = 250;
const MAX_SCAN_PAGES = 20;

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

function shouldRefresh(capturedAt: string | null | undefined, now: number): boolean {
  if (!capturedAt) return true;
  const timestamp = Date.parse(capturedAt);
  return !Number.isFinite(timestamp) || now - timestamp >= INSIGHTS_REFRESH_MS;
}

async function getCandidates(limit: number): Promise<Array<{ queueId: string; videoId: string }>> {
  const candidates: Array<{ queueId: string; videoId: string }> = [];
  const now = Date.now();

  for (let page = 0; page < MAX_SCAN_PAGES && candidates.length < limit; page += 1) {
    const offset = page * INSIGHTS_PAGE_SIZE;
    const rows = await supabaseServerAdminRequest<QueueRow[]>(
      "/rest/v1/social_publish_queue?status=eq.published&published_at=not.is.null&content_type=like.*_video&select=id,metadata,published_at&order=published_at.asc,id.asc&limit=" +
        INSIGHTS_PAGE_SIZE + "&offset=" + offset,
    );
    const batch = Array.isArray(rows) ? rows : [];
    if (batch.length === 0) break;

    const withVideoIds = batch.flatMap((row) => {
      const videoId = remoteYoutubeId(row.metadata);
      return videoId ? [{ row, videoId }] : [];
    });

    if (withVideoIds.length > 0) {
      const queueIds = withVideoIds.map((item) => item.row.id);
      const existing = await supabaseServerAdminRequest<ExistingInsightRow[]>(
        "/rest/v1/social_post_insights?platform=eq.youtube&queue_id=in.(" +
          queueIds.join(",") + ")&select=queue_id,captured_at",
      ).catch(() => []);
      const capturedAtByQueueId = new Map(
        (existing ?? []).map((row) => [row.queue_id, row.captured_at]),
      );

      for (const item of withVideoIds) {
        if (!shouldRefresh(capturedAtByQueueId.get(item.row.id), now)) continue;
        candidates.push({ queueId: item.row.id, videoId: item.videoId });
        if (candidates.length >= limit) break;
      }
    }

    if (batch.length < INSIGHTS_PAGE_SIZE) break;
  }

  return candidates;
}

/**
 * Reads public statistics for ZIKR's own published YouTube videos.
 * Insights are stored in a private analytics table; social_publish_queue is read-only.
 * Retention, watch-time and private audience metrics are never inferred or fabricated.
 */
export async function syncYoutubePublishedPostInsights(
  limit = MAX_INSIGHTS_BATCH,
): Promise<YoutubePostInsightsSyncResult> {
  const apiKey = getServerEnv().YOUTUBE_API_KEY?.trim();
  if (!apiKey) return { configured: false, candidates: 0, fetched: 0, updated: 0 };

  const boundedLimit = Math.max(1, Math.min(250, Math.floor(limit) || 1));
  const candidates = await getCandidates(boundedLimit);
  if (candidates.length === 0) {
    return { configured: true, candidates: 0, fetched: 0, updated: 0 };
  }

  let fetched = 0;
  let updated = 0;

  for (let index = 0; index < candidates.length; index += MAX_INSIGHTS_BATCH) {
    const group = candidates.slice(index, index + MAX_INSIGHTS_BATCH);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", group.map((item) => item.videoId).join(","));
    url.searchParams.set("key", apiKey);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      throw new Error("YouTube public statistics request failed (HTTP " + response.status + ").");
    }
    const payload = (await response.json()) as YoutubeVideosResponse;
    if (payload.error) throw new Error("YouTube public statistics endpoint returned an API error.");

    const byId = new Map<string, YoutubeVideo>(
      (payload.items ?? []).map((video): [string, YoutubeVideo] => [video.id, video]),
    );
    fetched += byId.size;
    const capturedAt = new Date().toISOString();
    const upserts: InsightUpsert[] = [];

    for (const candidate of group) {
      const video = byId.get(candidate.videoId);
      if (!video?.statistics) continue;
      upserts.push({
        queue_id: candidate.queueId,
        platform: "youtube",
        video_id: candidate.videoId,
        metrics: {
          views: asCount(video.statistics.viewCount),
          likes: asCount(video.statistics.likeCount),
          comments: asCount(video.statistics.commentCount),
        },
        captured_at: capturedAt,
        source: "youtube-data-api-v3",
        scope: "public-statistics",
        updated_at: capturedAt,
      });
    }

    if (upserts.length > 0) {
      await supabaseServerAdminRequest(
        "/rest/v1/social_post_insights?on_conflict=queue_id,platform",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(upserts),
        },
      );
      updated += upserts.length;
    }
  }

  return { configured: true, candidates: candidates.length, fetched, updated };
}
