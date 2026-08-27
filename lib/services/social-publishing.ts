import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { publishToFacebook, publishToYoutube } from "@/lib/services/video-automation";
import { getServerEnv } from "@/lib/env";

export type SocialPlatform = "facebook" | "facebook_reels" | "youtube";
export type SocialQueueStatus =
  "queued" | "processing" | "published" | "partial" | "failed";

export interface SocialPublishQueueItem {
  id: string;
  content_type: string;
  content_id: string | null;
  title: string;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  target_platforms: SocialPlatform[];
  status: SocialQueueStatus;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

type PlatformResult = {
  platform: SocialPlatform;
  ok: boolean;
  remoteId?: string | null;
  error?: string;
};

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const isProduction = process.env.VERCEL_ENV === "production";
  const fallback = isProduction
    ? "https://zikrmediaofficial.vercel.app"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://zikrmediaofficial.vercel.app";

  return (isProduction ? "https://zikrmediaofficial.vercel.app" : configured || fallback).replace(/\/$/, "");
}

function publicUrl(item: SocialPublishQueueItem) {
  const publicPath = item.metadata?.publicPath;
  if (typeof publicPath === "string" && publicPath.startsWith("/"))
    return `${siteUrl()}${publicPath}`;
  return siteUrl();
}

async function markQueueItem(
  itemId: string,
  status: SocialQueueStatus,
  patch: Record<string, unknown> = {}
) {
  await supabaseServerAdminRequest(
    `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status,
        updated_at: new Date().toISOString(),
        ...patch,
      }),
    }
  );
}

export async function getPendingSocialPublishItems(
  limit = 10
): Promise<SocialPublishQueueItem[]> {
  const now = encodeURIComponent(new Date().toISOString());
  const path = `/rest/v1/social_publish_queue?status=eq.queued&or=(scheduled_at.is.null,scheduled_at.lte.${now})&order=scheduled_at.asc.nullsfirst,created_at.asc&limit=${limit}`;
  try {
    return (
      (await supabaseServerAdminRequest<SocialPublishQueueItem[]>(path)) || []
    );
  } catch (error) {
    console.error("[social-publishing] Failed to fetch queue:", error);
    return [];
  }
}

export async function claimPendingSocialPublishItems(
  limit = 10
): Promise<SocialPublishQueueItem[]> {
  const items = await getPendingSocialPublishItems(limit);
  const claimed: SocialPublishQueueItem[] = [];

  for (const item of items) {
    try {
      const result = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.queued`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            status: "processing",
            error_message: null,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      if (Array.isArray(result) && result[0]) claimed.push(result[0]);
    } catch (error) {
      console.error(`[social-publishing] Failed to claim queue item ${item.id}:`, error);
    }
  }

  return claimed;
}

async function publishFacebookPost(
  item: SocialPublishQueueItem
): Promise<string | null> {
  const env = getServerEnv();
  const pageId = env.FACEBOOK_PAGE_ID;
  const pageAccessToken = env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !pageAccessToken)
    throw new Error(
      "FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN are not configured"
    );

  const params = new URLSearchParams({
    access_token: pageAccessToken,
    message: [item.title, item.body, publicUrl(item)]
      .filter(Boolean)
      .join("\n\n"),
  });
  if (item.image_url) params.set("link", item.image_url);

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Facebook post failed (HTTP ${res.status}): ${body.slice(0, 300)}`
    );
  }
  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}

async function publishFacebookReelItem(
  item: SocialPublishQueueItem
): Promise<string | null> {
  if (!item.video_url) throw new Error("Facebook Reels publishing requires video_url");
  const env = getServerEnv();
  if (!env.FACEBOOK_PAGE_ID) throw new Error("FACEBOOK_PAGE_ID is not configured");
  return publishToFacebook(
    item.id,
    { title: item.title, description: item.body ?? "" },
    item.video_url,
    env.FACEBOOK_PAGE_ID,
    true
  );
}

async function publishYoutubeItem(
  item: SocialPublishQueueItem
): Promise<string | null> {
  if (!item.video_url) throw new Error("YouTube publishing requires video_url");
  return publishToYoutube(
    item.id,
    {
      title: item.title,
      description: [item.body ?? "", publicUrl(item)]
        .filter(Boolean)
        .join("\n\n"),
      tags: ["zikr", "islamic", item.content_type],
      categoryId: "27",
      isShort: item.metadata?.videoFormat !== "horizontal",
    },
    item.video_url
  );
}

async function publishPlatform(
  item: SocialPublishQueueItem,
  platform: SocialPlatform
): Promise<PlatformResult> {
  try {
    const remoteId =
      platform === "facebook"
        ? item.video_url
          ? await publishToFacebook(
              item.id,
              { title: item.title, description: item.body ?? "" },
              item.video_url,
              getServerEnv().FACEBOOK_PAGE_ID,
              false
            )
          : await publishFacebookPost(item)
        : platform === "facebook_reels"
          ? await publishFacebookReelItem(item)
          : await publishYoutubeItem(item);
    return { platform, ok: Boolean(remoteId), remoteId };
  } catch (error) {
    return {
      platform,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function processSocialPublishItem(
  item: SocialPublishQueueItem,
  options: { alreadyClaimed?: boolean } = {}
): Promise<boolean> {
  if (!options.alreadyClaimed) {
    await markQueueItem(item.id, "processing");
  }
  const platforms = item.target_platforms.filter(
    (p): p is SocialPlatform => p === "facebook" || p === "facebook_reels" || p === "youtube"
  );
  if (platforms.length === 0) {
    await markQueueItem(item.id, "failed", {
      error_message: "No supported target platforms selected",
    });
    return false;
  }

  const results = await Promise.all(
    platforms.map(platform => publishPlatform(item, platform))
  );
  const failures = results.filter(result => !result.ok);
  const successes = results.filter(result => result.ok);
  const nextStatus: SocialQueueStatus =
    failures.length === 0
      ? "published"
      : successes.length > 0
        ? "partial"
        : "failed";

  await markQueueItem(item.id, nextStatus, {
    published_at: successes.length > 0 ? new Date().toISOString() : null,
    error_message:
      failures
        .map(
          failure => `${failure.platform}: ${failure.error ?? "unknown error"}`
        )
        .join("; ") || null,
    metadata: {
      ...(item.metadata ?? {}),
      platformResults: results,
    },
  });

  return nextStatus === "published";
}
