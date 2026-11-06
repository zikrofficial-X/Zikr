import { getServerEnv } from "@/lib/env";
import { readStoredFacebookCredential } from "@/features/social/services/facebook-credentials";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

type QueueRow = {
  id: string;
  title: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
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
type ExistingFacebookInsightRow = { queue_id: string; captured_at: string };

async function getFacebookReelCandidates(limit: number): Promise<Array<{ queueId: string; videoId: string }>> {
  const candidates: Array<{ queueId: string; videoId: string }> = [];
  const now = Date.now();
  const pageSize = 250;
  const maxPages = 20;

  for (let page = 0; page < maxPages && candidates.length < limit; page += 1) {
    const rows = await supabaseServerAdminRequest<QueueRow[]>(
      "/rest/v1/social_publish_queue?content_type=like.*_video&select=id,title,metadata,created_at&order=created_at.asc,id.asc&limit=" +
        pageSize + "&offset=" + page * pageSize,
    );
    const batch = Array.isArray(rows) ? rows : [];
    if (batch.length === 0) break;

    const withVideoIds = batch.flatMap((row) => {
      const videoId = facebookReelId(row.metadata);
      return videoId ? [{ row, videoId }] : [];
    });
    if (withVideoIds.length > 0) {
      const queueIds = withVideoIds.map((item) => item.row.id);
      const existing = await supabaseServerAdminRequest<ExistingFacebookInsightRow[]>(
        "/rest/v1/social_post_insights?platform=eq.facebook_reels&queue_id=in.(" +
          queueIds.join(",") + ")&select=queue_id,captured_at",
      ).catch(() => []);
      const capturedAtByQueueId = new Map(
        (existing ?? []).map((row) => [row.queue_id, row.captured_at]),
      );

      for (const item of withVideoIds) {
        const capturedAt = capturedAtByQueueId.get(item.row.id);
        const timestamp = capturedAt ? Date.parse(capturedAt) : Number.NaN;
        if (Number.isFinite(timestamp) && now - timestamp < REFRESH_INTERVAL_MS) continue;
        candidates.push({ queueId: item.row.id, videoId: item.videoId });
        if (candidates.length >= limit) break;
      }
    }
    if (batch.length < pageSize) break;
  }
  return candidates;
}

/**
 * Reads lifetime statistics for ZIKR's own published Facebook Page Reels.
 * It never republishes content and stores metrics outside social_publish_queue.
 * Meta is called only when the OAuth-managed Page token explicitly includes
 * read_insights and pages_read_engagement.
 */
export async function syncFacebookReelsInsights(limit = MAX_BATCH): Promise<FacebookReelsInsightsSyncResult> {
  const credential = await readStoredFacebookCredential();
  if (!credential?.page_id || !credential.page_access_token) {
    return { configured: false, reason: "not_connected", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }
  const expiry = credential.expires_at ? Date.parse(credential.expires_at) : Number.NaN;
  if (
    credential.connection_status !== "connected" ||
    (credential.expires_at && Number.isFinite(expiry) && expiry <= Date.now())
  ) {
    return { configured: false, reason: "connection_unavailable", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }
  const permissions = new Set(credential.granted_permissions ?? []);
  if (!permissions.has("read_insights") || !permissions.has("pages_read_engagement")) {
    return { configured: false, reason: "permission_missing", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }

  const boundedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 1));
  const candidates = await getFacebookReelCandidates(boundedLimit);
  if (!candidates.length) {
    return { configured: true, candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }

  let fetched = 0;
  let updated = 0;
  let failed = 0;

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

    const capturedAt = new Date().toISOString();
    const upserts = results.flatMap((result) => {
      if (result.error) {
        failed += 1;
        return [];
      }
      fetched += 1;
      return [{
        queue_id: result.candidate.queueId,
        platform: "facebook_reels",
        video_id: result.candidate.videoId,
        metrics: result.metrics,
        captured_at: capturedAt,
        source: "meta-graph-api",
        scope: "page-video-insights",
        period: "lifetime",
        status: Object.keys(result.metrics).length ? "available" : "no-metrics-returned",
        updated_at: capturedAt,
      }];
    });

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

  return { configured: true, candidates: candidates.length, fetched, updated, failed };
}

export type FacebookPageAudienceSnapshot = {
  status: "connected" | "not_connected" | "permission_missing" | "unavailable";
  pageName: string | null;
  followers: number | null;
  likes: number | null;
  capturedAt: string | null;
};

/** Read-only Page audience totals. No posts are created or modified. */
export async function getFacebookPageAudienceSnapshot(): Promise<FacebookPageAudienceSnapshot> {
  const credential = await readStoredFacebookCredential();
  if (!credential?.page_id || !credential.page_access_token || credential.connection_status !== "connected") {
    return { status: "not_connected", pageName: null, followers: null, likes: null, capturedAt: null };
  }
  const permissions = new Set(credential.granted_permissions ?? []);
  if (!permissions.has("pages_read_engagement")) {
    return { status: "permission_missing", pageName: credential.page_name, followers: null, likes: null, capturedAt: null };
  }
  try {
    const version = getServerEnv().FACEBOOK_GRAPH_API_VERSION?.trim() || "v26.0";
    const url = new URL("https://graph.facebook.com/" + version + "/" + encodeURIComponent(credential.page_id));
    url.searchParams.set("fields", "name,followers_count,fan_count");
    url.searchParams.set("access_token", credential.page_access_token);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
    const payload = await response.json().catch(() => ({})) as { name?: string; followers_count?: number; fan_count?: number; error?: unknown };
    if (!response.ok || payload.error) return { status: response.status === 403 ? "permission_missing" : "unavailable", pageName: credential.page_name, followers: null, likes: null, capturedAt: null };
    const valid = (value: unknown): number | null => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
    return { status: "connected", pageName: payload.name ?? credential.page_name, followers: valid(payload.followers_count), likes: valid(payload.fan_count), capturedAt: new Date().toISOString() };
  } catch {
    return { status: "unavailable", pageName: credential.page_name, followers: null, likes: null, capturedAt: null };
  }
}
