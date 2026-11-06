import { getServerEnv } from "@/lib/env";
import { readStoredFacebookCredential } from "@/features/social/services/facebook-credentials";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

type QueueRow = {
  id: string;
  title: string;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
};

type GraphInsight = {
  name?: string;
  period?: string;
  values?: Array<{ value?: unknown }>;
};

type GraphInsightsResponse = {
  data?: GraphInsight[];
  error?: { message?: string; code?: number };
};

export type FacebookReelsInsightsSyncResult = {
  configured: boolean;
  reason?: "not_connected" | "permission_missing" | "connection_unavailable";
  candidates: number;
  fetched: number;
  updated: number;
  failed: number;
};

export const FACEBOOK_REELS_INSIGHT_METRICS = [
  "fb_reels_total_plays",
  "blue_reels_play_count",
  "fb_reels_replay_count",
  "post_video_avg_time_watched",
  "post_video_view_time",
  "post_video_followers",
  "post_video_social_actions",
  "post_video_likes_by_reaction_type",
] as const;

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MAX_BATCH = 25;
const GRAPH_TIMEOUT_MS = 15_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function facebookReelId(metadata: Record<string, unknown> | null): string | null {
  const results = metadata?.platformResults;
  if (!isRecord(results)) return null;
  const reel = results.facebook_reels;
  if (!isRecord(reel) || reel.ok !== true || typeof reel.remoteId !== "string") return null;
  const id = reel.remoteId.trim();
  return /^[0-9]{8,}$/.test(id) ? id : null;
}

export function shouldRefreshFacebookReelsInsights(
  metadata: Record<string, unknown> | null,
  now: number,
): boolean {
  const platformInsights = metadata?.platformInsights;
  if (!isRecord(platformInsights) || !isRecord(platformInsights.facebookReels)) return true;
  const capturedAt = platformInsights.facebookReels.capturedAt;
  if (typeof capturedAt !== "string") return true;
  const timestamp = Date.parse(capturedAt);
  return !Number.isFinite(timestamp) || now - timestamp >= REFRESH_INTERVAL_MS;
}

function safeMetricValue(value: unknown): number | Record<string, number> | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (!isRecord(value)) return null;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] >= 0,
  );
  return entries.length ? Object.fromEntries(entries) : null;
}

export function parseFacebookReelsInsights(data: GraphInsight[]): Record<string, number | Record<string, number>> {
  const allowed = new Set<string>(FACEBOOK_REELS_INSIGHT_METRICS);
  const result: Record<string, number | Record<string, number>> = {};
  for (const metric of data) {
    if (!metric.name || !allowed.has(metric.name)) continue;
    const value = safeMetricValue(metric.values?.[0]?.value);
    if (value !== null) result[metric.name] = value;
  }
  return result;
}

async function fetchReelInsights(videoId: string, pageAccessToken: string): Promise<Record<string, number | Record<string, number>>> {
  const version = getServerEnv().FACEBOOK_GRAPH_API_VERSION?.trim() || "v26.0";
  const url = new URL(
    "https://graph.facebook.com/" + version + "/" + encodeURIComponent(videoId) + "/video_insights",
  );
  url.searchParams.set("metric", FACEBOOK_REELS_INSIGHT_METRICS.join(","));
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("access_token", pageAccessToken);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as GraphInsightsResponse;
  if (!response.ok || payload.error) {
    // Do not expose the request URL, Page token, or raw provider response.
    throw new Error("Meta Facebook Reels insights request failed (HTTP " + response.status + ").");
  }
  return parseFacebookReelsInsights(Array.isArray(payload.data) ? payload.data : []);
}

/**
 * Reads lifetime statistics for ZIKR's own published Facebook Page Reels.
 * It never republishes content, and it will not call Meta until the connected
 * Page token explicitly includes read_insights and pages_read_engagement.
 */
export async function syncFacebookReelsInsights(limit = MAX_BATCH): Promise<FacebookReelsInsightsSyncResult> {
  const credential = await readStoredFacebookCredential();
  if (!credential?.page_id || !credential.page_access_token) {
    return { configured: false, reason: "not_connected", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }
  const expiry = credential.expires_at ? Date.parse(credential.expires_at) : NaN;
  if (credential.connection_status !== "connected" ||
      (credential.expires_at && Number.isFinite(expiry) && expiry <= Date.now())) {
    return { configured: false, reason: "connection_unavailable", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }
  const permissions = new Set(credential.granted_permissions ?? []);
  if (!permissions.has("read_insights") || !permissions.has("pages_read_engagement")) {
    return { configured: false, reason: "permission_missing", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }

  const boundedLimit = Math.max(1, Math.min(MAX_BATCH, Math.floor(limit)));
  const rows = await supabaseServerAdminRequest<QueueRow[]>(
    "/rest/v1/social_publish_queue?status=eq.published&published_at=not.is.null&content_type=like.*_video&select=id,title,metadata,published_at&order=published_at.desc&limit=250",
  );
  const now = Date.now();
  const candidates = (rows ?? [])
    .flatMap((row) => {
      const videoId = facebookReelId(row.metadata);
      if (!videoId || !shouldRefreshFacebookReelsInsights(row.metadata, now)) return [];
      return [{ row, videoId }];
    })
    .slice(0, boundedLimit);

  if (!candidates.length) {
    return { configured: true, candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }

  let fetched = 0;
  let updated = 0;
  let failed = 0;
  const capturedAt = new Date().toISOString();

  for (let index = 0; index < candidates.length; index += 4) {
    const group = candidates.slice(index, index + 4);
    const results = await Promise.all(group.map(async (candidate) => {
      try {
        const metrics = await fetchReelInsights(candidate.videoId, credential.page_access_token);
        return { candidate, metrics, error: false };
      } catch (error) {
        console.error(
          "[social-worker] Facebook Reels insights unavailable:",
          error instanceof Error ? error.message : "Unknown Meta insights error",
        );
        return { candidate, metrics: {}, error: true };
      }
    }));

    for (const result of results) {
      if (result.error) {
        failed += 1;
        continue;
      }
      fetched += 1;
      if (!Object.keys(result.metrics).length) continue;
      const currentMetadata = result.candidate.row.metadata ?? {};
      const currentInsights = isRecord(currentMetadata.platformInsights)
        ? currentMetadata.platformInsights
        : {};
      const nextMetadata = {
        ...currentMetadata,
        platformInsights: {
          ...currentInsights,
          facebookReels: {
            videoId: result.candidate.videoId,
            metrics: result.metrics,
            capturedAt,
            source: "meta-graph-api",
            scope: "page-video-insights",
            period: "lifetime",
          },
        },
      };
      await supabaseServerAdminRequest(
        "/rest/v1/social_publish_queue?id=eq." +
          encodeURIComponent(result.candidate.row.id) +
          "&status=eq.published",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ metadata: nextMetadata, updated_at: capturedAt }),
        },
      );
      updated += 1;
    }
  }

  return { configured: true, candidates: candidates.length, fetched, updated, failed };
}
