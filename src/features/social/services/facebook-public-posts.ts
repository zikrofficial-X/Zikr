import "server-only";

import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

type SocialQueueRow = {
  id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  target_platforms: string[] | null;
  status: string;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type FacebookPublishedPost = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  facebookUrl: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function facebookDelivery(metadata: Record<string, unknown> | null) {
  const results = metadata?.platformResults;
  if (Array.isArray(results)) {
    return asRecord(results.find((value) => asRecord(value)?.platform === "facebook"));
  }
  return asRecord(asRecord(results)?.facebook);
}

function buildFacebookPostUrl(remoteId: string): string | null {
  if (!/^[A-Za-z0-9._-]{6,160}$/.test(remoteId)) return null;
  const separator = remoteId.lastIndexOf("_");
  if (separator <= 0 || separator === remoteId.length - 1) {
    return "https://www.facebook.com/" + encodeURIComponent(remoteId);
  }
  const pageId = remoteId.slice(0, separator);
  const postId = remoteId.slice(separator + 1);
  return "https://www.facebook.com/" + encodeURIComponent(pageId) + "/posts/" + encodeURIComponent(postId);
}

/**
 * Only display Facebook posts whose delivery ledger confirms a remote Facebook post ID.
 * Drafts, queued items, failed deliveries and posts only published to other platforms stay private.
 */
export async function getFacebookPublishedPosts(limit = 6): Promise<FacebookPublishedPost[]> {
  const safeLimit = Math.max(1, Math.min(12, Math.trunc(limit)));
  try {
    const rows = await supabaseServerAdminRequest<SocialQueueRow[]>(
      "/rest/v1/social_publish_queue?select=id,title,body,image_url,video_url,target_platforms,status,published_at,metadata" +
        "&target_platforms=cs.%7Bfacebook%7D" +
        "&status=in.%28published%2Cpartial%29" +
        "&published_at=not.is.null" +
        "&order=published_at.desc&limit=100",
      { method: "GET", timeoutMs: 8000, retries: 2 },
    );

    return (rows ?? []).flatMap((row) => {
      if (!Array.isArray(row.target_platforms) || !row.target_platforms.includes("facebook")) return [];
      if (!row.published_at || !["published", "partial"].includes(row.status)) return [];
      const delivery = facebookDelivery(row.metadata);
      const remoteId = delivery?.ok === true && typeof delivery.remoteId === "string"
        ? delivery.remoteId.trim()
        : "";
      const facebookUrl = remoteId ? buildFacebookPostUrl(remoteId) : null;
      if (!facebookUrl) return [];

      const title = row.title?.trim() || row.body?.trim().slice(0, 90) || "منشور ذِكر";
      return [{
        id: row.id,
        title,
        body: (row.body ?? "").trim().slice(0, 2400),
        publishedAt: row.published_at,
        imageUrl: safeHttpsUrl(row.image_url),
        videoUrl: safeHttpsUrl(row.video_url),
        facebookUrl,
      }];
    }).slice(0, safeLimit);
  } catch (error) {
    console.error("[videos] Failed to read confirmed Facebook publications:", error instanceof Error ? error.message : "unknown error");
    return [];
  }
}
