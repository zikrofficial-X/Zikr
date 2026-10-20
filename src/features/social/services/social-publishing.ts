import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { publishToFacebook, publishToYoutube } from "@/features/videos/services/video-automation";
import { getServerEnv } from "@/lib/env";
import { getFacebookPageCredentials } from "@/features/social/services/facebook-credentials";

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
  const env = getServerEnv();
  return (env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

function assertPublishableVideoUrl(videoUrl: string, target: "facebook" | "youtube") {
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    throw new Error(target + " publishing requires an absolute video media URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(target + " publishing requires an http(s) video media URL");
  }

  const host = parsed.hostname.toLowerCase();
  const isYoutubeWatchUrl =
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtu.be" ||
    host.endsWith(".youtu.be");

  if (isYoutubeWatchUrl) {
    throw new Error(
      target +
        " publishing requires the original media file or an approved direct media URL; YouTube watch/embed URLs cannot be republished as video assets"
    );
  }

  return parsed.toString();
}

function publicUrl(item: SocialPublishQueueItem) {
  const publicPath = item.metadata?.publicPath;
  if (typeof publicPath === "string" && publicPath.startsWith("/")) {
    const base = siteUrl();
    if (!base) throw new Error("NEXT_PUBLIC_SITE_URL is not configured for social publishing");
    return `${base}${publicPath}`;
  }
  return siteUrl();
}

function isFacebookAuthFailure(error: string | undefined) {
  if (!error) return false;
  const normalized = error.toLowerCase();
  return (
    normalized.includes("facebook") &&
    (
      normalized.includes("session has expired") ||
      normalized.includes("error validating access token") ||
      normalized.includes("oauthexception") ||
      normalized.includes("invalid oauth") ||
      normalized.includes("access token")
    )
  );
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
  const path =
    `/rest/v1/social_publish_queue?or=(and(status.eq.queued,or(scheduled_at.is.null,scheduled_at.lte.${now})),and(status.eq.partial,or(scheduled_at.is.null,scheduled_at.lte.${now})))&order=scheduled_at.asc.nullsfirst,created_at.asc&limit=${limit}`;
  try {
    const rows =
      (await supabaseServerAdminRequest<SocialPublishQueueItem[]>(path)) || [];

    return rows.filter((item) => {
      const metadata = item.metadata ?? {};
      const authBlocked = metadata.authBlocked === true;
      const attempts = Number(metadata.attempts ?? 0);
      const maxAttempts = Math.max(1, Number(metadata.maxAttempts ?? 5));
      return !authBlocked && attempts < maxAttempts;
    });
  } catch (error) {
    console.error("[social-publishing] Failed to fetch queue:", error);
    return [];
  }
}

export async function claimPendingSocialPublishItems(
  limit = 10
): Promise<SocialPublishQueueItem[]> {
  const normalItems = await getPendingSocialPublishItems(limit);
  // Failed Facebook-auth items are intentionally not auto-retried. An expired
  // page token will otherwise create an unbounded retry loop and repeated provider
  // requests. Admin can manually requeue them after credentials are repaired.
  const items = normalItems;
  const claimed: SocialPublishQueueItem[] = [];

  for (const item of items) {
    try {
      const claimStatus = item.status === "partial" ? "partial" : item.status === "failed" ? "failed" : "queued";
      const result = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.${claimStatus}&updated_at=eq.${encodeURIComponent(item.updated_at)}`,
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

async function publishFacebookPost(item: SocialPublishQueueItem): Promise<string | null> {
  const env = getServerEnv();
  const credentials = await getFacebookPageCredentials();
  if (!credentials.isEnabled) {
    throw new Error("Facebook publishing is disabled. Connect and enable the Page from the admin publishing center.");
  }

  const params = new URLSearchParams({
    access_token: credentials.accessToken,
    message: [item.title, item.body, publicUrl(item)].filter(Boolean).join("\n\n"),
  });
  if (item.image_url) params.set("link", item.image_url);

  const version = env.FACEBOOK_GRAPH_API_VERSION || "v26.0";
  const res = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(credentials.pageId)}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Facebook post failed (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}

async function publishFacebookReelItem(item: SocialPublishQueueItem): Promise<string | null> {
  const credentials = await getFacebookPageCredentials();
  if (!credentials.isEnabled) {
    throw new Error("Facebook publishing is disabled. Connect and enable the Page from the admin publishing center.");
  }
  if (!item.video_url) throw new Error("Facebook Reels publishing requires video_url");
  const mediaUrl = assertPublishableVideoUrl(item.video_url, "facebook");
  return publishToFacebook(
    item.id,
    { title: item.title, description: item.body ?? "" },
    mediaUrl,
    credentials.pageId,
    true
  );
}

async function publishYoutubeItem(item: SocialPublishQueueItem): Promise<string | null> {
  if (!item.video_url) throw new Error("YouTube publishing requires video_url");
  const mediaUrl = assertPublishableVideoUrl(item.video_url, "youtube");
  const env = getServerEnv();
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !env.YOUTUBE_REFRESH_TOKEN) {
    throw new Error("YouTube OAuth is not configured: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN are required");
  }
  return publishToYoutube(
    item.id,
    {
      title: item.title,
      description: [item.body ?? "", publicUrl(item)].filter(Boolean).join("\n\n"),
      tags: ["zikr", "islamic", item.content_type],
      categoryId: "27",
      isShort: item.metadata?.videoFormat !== "horizontal",
    },
    mediaUrl
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
              assertPublishableVideoUrl(item.video_url, "facebook"),
              (() => {
                const env = getServerEnv();
                if (!env.FACEBOOK_PAGE_ID) throw new Error("FACEBOOK_PAGE_ID is not configured");
                if (!env.FACEBOOK_PAGE_ACCESS_TOKEN) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not configured");
                return env.FACEBOOK_PAGE_ID;
              })(),
              false
            )
          : await publishFacebookPost(item)
        : platform === "facebook_reels"
          ? await publishFacebookReelItem(item)
          : await publishYoutubeItem(item);

    if (!remoteId) {
      throw new Error(
        `${platform} publisher completed without returning a remote post/video ID. Check provider credentials, permissions, and the target page/channel.`
      );
    }

    return { platform, ok: true, remoteId };
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
): Promise<"published" | "auth_blocked" | "failed"> {
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
    return "failed";
  }

  const previous =
    item.metadata?.platformResults && typeof item.metadata.platformResults === "object"
      ? (item.metadata.platformResults as Record<string, unknown>)
      : {};

  const pendingPlatforms = platforms.filter(platform => {
    const prior = previous[platform];
    return !(prior && typeof prior === "object" && (prior as { ok?: unknown }).ok === true && typeof (prior as { remoteId?: unknown }).remoteId === "string");
  });

  const results = await Promise.all(
    pendingPlatforms.map(platform => publishPlatform(item, platform))
  );

  const mergedResults: Record<string, PlatformResult> = {};
  for (const platform of platforms) {
    const prior = previous[platform];
    if (prior && typeof prior === "object") mergedResults[platform] = prior as PlatformResult;
  }
  for (const result of results) mergedResults[result.platform] = result;

  const finalResults = platforms.map(platform => mergedResults[platform]).filter(Boolean);
  const failures = finalResults.filter(result => !result.ok);
  const successes = finalResults.filter(result => result.ok);
  const nextStatus: SocialQueueStatus =
    failures.length === 0
      ? "published"
      : successes.length > 0
        ? "partial"
        : "failed";

  const hasAuthFailure = failures.some(failure =>
    (failure.platform === "facebook" || failure.platform === "facebook_reels") &&
    isFacebookAuthFailure(failure.error)
  );
  const hasNonAuthFailure = failures.some(failure => !isFacebookAuthFailure(failure.error));

  const attempts = Number(item.metadata?.attempts ?? 0) + 1;
  const maxAttempts = Math.max(1, Number(item.metadata?.maxAttempts ?? 5));
  const shouldRetry = attempts < maxAttempts && (hasAuthFailure || nextStatus === "partial");
  const retryDelayMinutes = hasAuthFailure
    ? 15
    : Math.min(60, 2 ** Math.min(attempts, 6));
  const nextRetryAt = shouldRetry
    ? new Date(Date.now() + retryDelayMinutes * 60_000).toISOString()
    : null;

  await markQueueItem(item.id, shouldRetry ? "partial" : nextStatus, {
    scheduled_at: nextRetryAt,
    published_at: successes.length > 0 ? new Date().toISOString() : null,
    error_message:
      failures
        .map(failure => `${failure.platform}: ${failure.error ?? "unknown error"}`)
        .join("; ") || null,
    metadata: {
      ...(item.metadata ?? {}),
      attempts,
      maxAttempts,
      nextRetryAt,
      authBlocked: hasAuthFailure,
      platformResults: mergedResults,
    },
  });

  if (nextStatus === "published") return "published";
  if (hasAuthFailure && !hasNonAuthFailure) return "auth_blocked";
  return "failed";
}
