import { getServerEnv } from "@/lib/env";
import { readStoredFacebookCredential } from "@/features/social/services/facebook-credentials";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

type QueueRow = {
  id: string;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
};
type GraphCount = { summary?: { total_count?: number } };
type GraphPost = {
  id?: string;
  permalink_url?: string;
  created_time?: string;
  shares?: { count?: number };
  reactions?: GraphCount;
  comments?: GraphCount;
  error?: { message?: string; code?: number };
};
type GraphResponse = GraphPost;

export type FacebookPostInsightsSyncResult = {
  configured: boolean;
  reason?: "not_connected" | "permission_missing" | "connection_unavailable";
  candidates: number;
  fetched: number;
  updated: number;
  failed: number;
};

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MAX_BATCH = 25;
const TIMEOUT_MS = 12_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function remoteFacebookPostId(metadata: Record<string, unknown> | null): string | null {
  const results = metadata?.platformResults;
  if (!isRecord(results)) return null;
  const post = results.facebook;
  if (!isRecord(post) || post.ok !== true || typeof post.remoteId !== "string") return null;
  const id = post.remoteId.trim();
  return /^[0-9]+(?:_[0-9]+)?$/.test(id) ? id : null;
}

export function shouldRefreshFacebookPostInsights(metadata: Record<string, unknown> | null, now: number): boolean {
  const platformInsights = metadata?.platformInsights;
  if (!isRecord(platformInsights) || !isRecord(platformInsights.facebookPost)) return true;
  const capturedAt = platformInsights.facebookPost.capturedAt;
  if (typeof capturedAt !== "string") return true;
  const timestamp = Date.parse(capturedAt);
  return !Number.isFinite(timestamp) || now - timestamp >= REFRESH_INTERVAL_MS;
}

export function parseFacebookPostInsights(post: GraphPost): {
  likes: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  permalink: string | null;
  createdAt: string | null;
} {
  const count = (value: unknown): number | null => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
  const permalink = typeof post.permalink_url === "string" && /^https:\/\//i.test(post.permalink_url) ? post.permalink_url : null;
  const createdAt = typeof post.created_time === "string" && Number.isFinite(Date.parse(post.created_time)) ? post.created_time : null;
  const reactions = count(post.reactions?.summary?.total_count);
  return {
    // Meta post reaction summaries include Likes and other reaction types.
    // Keep the label honest: likes is intentionally null unless Meta returns a likes edge.
    likes: null,
    reactions,
    comments: count(post.comments?.summary?.total_count),
    shares: count(post.shares?.count),
    permalink,
    createdAt,
  };
}

async function fetchFacebookPostInsights(postId: string, token: string): Promise<ReturnType<typeof parseFacebookPostInsights>> {
  const version = getServerEnv().FACEBOOK_GRAPH_API_VERSION?.trim() || "v26.0";
  const url = new URL("https://graph.facebook.com/" + version + "/" + encodeURIComponent(postId));
  url.searchParams.set("fields", "id,permalink_url,created_time,shares,reactions.limit(0).summary(true),comments.limit(0).summary(true)");
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  const payload = await response.json().catch(() => ({})) as GraphResponse;
  if (!response.ok || payload.error) {
    throw new Error("Meta Facebook post insights request failed (HTTP " + response.status + ").");
  }
  return parseFacebookPostInsights(payload);
}

/** Reads read-only interaction counts for ZIKR Page feed posts already published by ZIKR. */
export async function syncFacebookPublishedPostInsights(limit = MAX_BATCH): Promise<FacebookPostInsightsSyncResult> {
  const credential = await readStoredFacebookCredential();
  if (!credential?.page_id || !credential.page_access_token) {
    return { configured: false, reason: "not_connected", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }
  const expiry = credential.expires_at ? Date.parse(credential.expires_at) : Number.NaN;
  if (credential.connection_status !== "connected" || (credential.expires_at && Number.isFinite(expiry) && expiry <= Date.now())) {
    return { configured: false, reason: "connection_unavailable", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }
  const permissions = new Set(credential.granted_permissions ?? []);
  if (!permissions.has("pages_read_engagement")) {
    return { configured: false, reason: "permission_missing", candidates: 0, fetched: 0, updated: 0, failed: 0 };
  }

  const boundedLimit = Math.max(1, Math.min(MAX_BATCH, Math.floor(limit)));
  const rows = await supabaseServerAdminRequest<QueueRow[]>(
    "/rest/v1/social_publish_queue?status=eq.published&published_at=not.is.null&target_platforms=cs.{facebook}&select=id,metadata,published_at&order=published_at.desc&limit=250",
  );
  const now = Date.now();
  const candidates = (rows ?? []).flatMap(row => {
    const postId = remoteFacebookPostId(row.metadata);
    if (!postId || !shouldRefreshFacebookPostInsights(row.metadata, now)) return [];
    return [{ row, postId }];
  }).slice(0, boundedLimit);

  let fetched = 0;
  let updated = 0;
  let failed = 0;
  const capturedAt = new Date().toISOString();
  for (let index = 0; index < candidates.length; index += 4) {
    const group = candidates.slice(index, index + 4);
    const outcomes = await Promise.all(group.map(async candidate => {
      try {
        return { candidate, metrics: await fetchFacebookPostInsights(candidate.postId, credential.page_access_token), error: false };
      } catch (error) {
        console.error("[social-worker] Facebook post insights unavailable:", error instanceof Error ? error.message : "Unknown Meta post insights error");
        return { candidate, metrics: null, error: true };
      }
    }));
    for (const outcome of outcomes) {
      if (outcome.error) failed += 1;
      else fetched += 1;
      const metadata = outcome.candidate.row.metadata ?? {};
      const existing = isRecord(metadata.platformInsights) ? metadata.platformInsights : {};
      const nextMetadata = {
        ...metadata,
        platformInsights: {
          ...existing,
          facebookPost: {
            postId: outcome.candidate.postId,
            ...(outcome.metrics ?? {}),
            capturedAt,
            source: "meta-graph-api",
            scope: "page-post-lifetime",
            status: outcome.error ? "temporarily-unavailable" : "available",
          },
        },
      };
      await supabaseServerAdminRequest(
        "/rest/v1/social_publish_queue?id=eq." + encodeURIComponent(outcome.candidate.row.id) + "&status=eq.published",
        { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ metadata: nextMetadata, updated_at: capturedAt }) },
      );
      updated += 1;
    }
  }
  return { configured: true, candidates: candidates.length, fetched, updated, failed };
}
