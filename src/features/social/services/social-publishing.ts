import { createHash } from "node:crypto";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { publishToFacebook, publishToYoutube } from "@/features/videos/services/video-automation";
import { getServerEnv } from "@/lib/env";
import { getFacebookPageCredentials } from "@/features/social/services/facebook-credentials";
import { extractFacebookReelsNextAllowedAt, isFacebookReelsCooldownDeferredError } from "@/features/social/services/facebook-reels-rate-limit";
import { isVideoContentType, isVideoQueueItemApprovedForPublishing } from "@/features/videos/services/video-publish-approval";

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
      normalized.includes("access token") ||
      normalized.includes("oauth-managed publishing center") ||
      normalized.includes("reauthorization_required") ||
      normalized.includes("reconnect the page")
    )
  );
}

const SOCIAL_DEFAULT_MAX_ATTEMPTS = 5;
const SOCIAL_MAX_ATTEMPTS_CAP = 8;

function socialMaxAttempts(metadata: Record<string, unknown> | null) {
  const configured = Number(metadata?.maxAttempts ?? process.env.SOCIAL_MAX_RETRIES ?? SOCIAL_DEFAULT_MAX_ATTEMPTS);
  return Math.max(1, Math.min(SOCIAL_MAX_ATTEMPTS_CAP, Number.isFinite(configured) ? Math.floor(configured) : SOCIAL_DEFAULT_MAX_ATTEMPTS));
}

function socialRetryDelayMinutes(attempt: number, itemId: string) {
  const seed = [...itemId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return Math.min(240, 2 ** Math.min(Math.max(0, attempt - 1), 7) + (seed % 6));
}

function isPermanentSocialFailure(message: string | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return /no supported target|requires video_url|requires an absolute video media url|requires an http\(s\) video media url|youtube watch\/embed|oauth|access token|publishing is disabled|not configured|human qa approval/i.test(normalized);
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

async function hasVideoApprovalForQueueItem(item: SocialPublishQueueItem): Promise<boolean> {
  if (!isVideoContentType(item.content_type)) return true;
  if (!item.content_id || !item.video_url) return false;
  try {
    const rows = await supabaseServerAdminRequest<Array<{ status: string; video_url: string | null; content: unknown }>>(
      '/rest/v1/video_generation_requests?id=eq.' + encodeURIComponent(item.content_id) + '&select=status,video_url,content&limit=1',
    );
    return isVideoQueueItemApprovedForPublishing({
      contentType: item.content_type,
      contentId: item.content_id,
      queuedVideoUrl: item.video_url,
      request: rows?.[0] ?? null,
      requireApproval: process.env.AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL?.trim().toLowerCase() !== "false",
    });
  } catch (error) {
    console.error("[social-publishing] Approval lookup failed; holding video item:", item.id, error);
    return false;
  }
}

export async function getPendingSocialPublishItems(
  limit = 10
): Promise<SocialPublishQueueItem[]> {
  const now = encodeURIComponent(new Date().toISOString());
  const path =
    `/rest/v1/social_publish_queue?or=(and(status.eq.queued,or(scheduled_at.is.null,scheduled_at.lte.${now})),and(status.eq.partial,or(scheduled_at.is.null,scheduled_at.lte.${now})),and(status.eq.failed,or(scheduled_at.is.null,scheduled_at.lte.${now})))&order=scheduled_at.asc.nullsfirst,created_at.asc&limit=${limit}`;
  try {
    const rows =
      (await supabaseServerAdminRequest<SocialPublishQueueItem[]>(path)) || [];

    const eligible = await Promise.all(rows.map(async (item) => {
      const metadata = item.metadata ?? {};
      const attempts = Number(metadata.attempts ?? 0);
      const maxAttempts = socialMaxAttempts(metadata);
      if (metadata.authBlocked === true || metadata.permanentFailure === true || attempts >= maxAttempts) return null;
      if (!(await hasVideoApprovalForQueueItem(item))) return null;
      return item;
    }));
    return eligible.filter((item): item is SocialPublishQueueItem => item !== null);
  } catch (error) {
    console.error("[social-publishing] Failed to fetch queue:", error);
    return [];
  }
}

async function recoverStaleSocialPublishItems() {
  const staleBefore = encodeURIComponent(new Date(Date.now() - 20 * 60_000).toISOString());
  try {
    const stale = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
      `/rest/v1/social_publish_queue?status=eq.processing&updated_at=lt.${staleBefore}&select=id,metadata&limit=50`,
    );
    for (const item of stale ?? []) {
      const metadata = item.metadata ?? {};
      const attempts = Number(metadata.attempts ?? 0) + 1;
      const maxAttempts = socialMaxAttempts(metadata);
      const terminal = attempts >= maxAttempts;
      await supabaseServerAdminRequest(
        `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.processing`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            status: terminal ? "failed" : "partial",
            scheduled_at: terminal ? null : new Date(Date.now() + socialRetryDelayMinutes(attempts, item.id) * 60_000).toISOString(),
            error_message: "تمت استعادة عملية نشر عالقة تلقائيًا وسيُعاد تشغيل المنصات غير المكتملة.",
            metadata: { ...metadata, attempts, maxAttempts, staleRecovery: true },
            updated_at: new Date().toISOString(),
          }),
        },
      );
    }
  } catch (error) {
    console.error("[social-publishing] Failed to recover stale items:", error);
  }
}

export async function claimPendingSocialPublishItems(
  limit = 10
): Promise<SocialPublishQueueItem[]> {
  await retryPendingPublishedVideoCleanup(25);
  await recoverStaleSocialPublishItems();
  const normalItems = await getPendingSocialPublishItems(limit);
  // Failed Facebook-auth items are intentionally not auto-retried. An expired
  // page token will otherwise create an unbounded retry loop and repeated provider
  // requests. Admin can manually requeue them after credentials are repaired.
  const items = normalItems;
  const claimed: SocialPublishQueueItem[] = [];

  for (const item of items) {
    try {
      const claimStatus = item.status === "partial" ? "partial" : item.status === "failed" ? "failed" : "queued";
      // Atomic claim: the status predicate is the concurrency guard. Exact updated_at
      // equality is intentionally avoided because PostgREST/JSON timestamp normalization
      // can make a still-eligible row match zero rows and silently strand the queue.
      const result = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.${claimStatus}`,
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

async function publishFacebookVideoItem(
  item: SocialPublishQueueItem,
  asReel: boolean
): Promise<string | null> {
  const credentials = await getFacebookPageCredentials();
  if (!credentials.isEnabled) {
    throw new Error("Facebook publishing is disabled. Connect and enable the Page from the admin publishing center.");
  }
  if (!item.video_url) {
    throw new Error(asReel ? "Facebook Reels publishing requires video_url" : "Facebook video publishing requires video_url");
  }
  const mediaUrl = assertPublishableVideoUrl(item.video_url, "facebook");
  // Both feed videos and Reels use the verified OAuth-managed Page token stored in Supabase.
  // GitHub Actions must never need a duplicate Facebook Page token secret.
  return publishToFacebook(
    item.id,
    { title: item.title, description: item.body ?? "" },
    mediaUrl,
    credentials.pageId,
    asReel
  );
}

async function isMadeForKidsVideo(item: SocialPublishQueueItem): Promise<boolean> {
  if (!isVideoContentType(item.content_type)) return false;
  if (!item.content_id) throw new Error("YouTube video audience metadata is unavailable; publishing was held.");

  const rows = await supabaseServerAdminRequest<Array<{ content: unknown }>>(
    "/rest/v1/video_generation_requests?id=eq." +
      encodeURIComponent(item.content_id) +
      "&select=content&limit=1",
  );
  if (!Array.isArray(rows) || !rows[0]) {
    throw new Error("YouTube video audience metadata is unavailable; publishing was held.");
  }

  const content = rows[0].content;
  if (!content || typeof content !== "object" || Array.isArray(content)) return false;
  return (content as Record<string, unknown>).audience === "kids";
}

async function publishYoutubeItem(item: SocialPublishQueueItem): Promise<string | null> {
  if (!item.video_url) throw new Error("YouTube publishing requires video_url");
  const mediaUrl = assertPublishableVideoUrl(item.video_url, "youtube");
  const env = getServerEnv();
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !env.YOUTUBE_REFRESH_TOKEN) {
    throw new Error("YouTube OAuth is not configured: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN are required");
  }
  const madeForKids = await isMadeForKidsVideo(item);
  return publishToYoutube(
    item.id,
    {
      title: item.title,
      description: [item.body ?? "", publicUrl(item)].filter(Boolean).join("\n\n"),
      tags: ["zikr", "islamic", item.content_type],
      categoryId: "27",
      isShort: item.metadata?.videoFormat !== "horizontal",
    },
    mediaUrl,
    { selfDeclaredMadeForKids: madeForKids },
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
          ? await publishFacebookVideoItem(item, false)
          : await publishFacebookPost(item)
        : platform === "facebook_reels"
          ? await publishFacebookVideoItem(item, true)
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

/**
 * Remove temporary video artifacts only after every requested social target
 * has confirmed publication. Provider post IDs and the text/audit records stay.
 * Supabase originals are kept only until Cloudinary and Supabase cleanup succeed.
 */
async function deleteManagedVideoUrl(
  value: string,
  env: ReturnType<typeof getServerEnv>,
) {
  const parsed = new URL(value);

  if (parsed.hostname === "res.cloudinary.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex < 0) throw new Error("Unrecognized Cloudinary delivery URL");

    const publicParts = parts.slice(uploadIndex + 1);
    const version = publicParts[0] ?? "";
    if (version.startsWith("v") && version.slice(1).length > 0 && [...version.slice(1)].every(character => character >= "0" && character <= "9")) {
      publicParts.shift();
    }
    const fileName = publicParts.pop() ?? "";
    const extensionIndex = fileName.lastIndexOf(".");
    const publicId = [...publicParts, extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName].filter(Boolean).join("/");
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (!cloudName || !apiKey || !apiSecret || !publicId) {
      throw new Error("Cloudinary delete credentials or public ID are unavailable");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureBase = "public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;
    const signature = createHash("sha1").update(signatureBase).digest("hex");
    const form = new URLSearchParams({ public_id: publicId, timestamp, api_key: apiKey, signature });
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloudName) + "/video/destroy",
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(15_000) },
    );
    const result = await response.json().catch(() => ({})) as { result?: string; error?: { message?: string } };
    if (!response.ok || (result.result !== "ok" && result.result !== "not found")) {
      throw new Error(result.error?.message || "Cloudinary asset deletion failed");
    }
    return;
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || parsed.hostname !== new URL(supabaseUrl).hostname) {
    throw new Error("Video URL is not a managed ZIKR media asset");
  }
  const publicPrefix = "/storage/v1/object/public/videos/";
  if (!parsed.pathname.startsWith(publicPrefix)) {
    throw new Error("Supabase video URL is outside the managed videos bucket");
  }
  const objectPath = parsed.pathname.slice(publicPrefix.length);
  if (!objectPath) throw new Error("Supabase video object path is empty");
  const encodedPath = objectPath
    .split("/")
    .map(segment => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
  try {
    await supabaseServerAdminRequest("/storage/v1/object/videos/" + encodedPath, {
      method: "DELETE",
      // The DELETE request has no body; the shared REST helper omits Content-Type.
    });
  } catch (error) {
    // Cleanup is idempotent: a retry after a previous successful DELETE may see 404.
    if (!(error instanceof Error) || !error.message.startsWith("Supabase REST 404:")) throw error;
  }
}

/**
 * Remove temporary video artifacts only after every requested social target
 * has confirmed publication. Provider post IDs and text/audit records stay.
 * Failed cleanup is retried by the social publishing worker.
 */
async function disposePublishedVideo(item: SocialPublishQueueItem): Promise<boolean> {
  if (!item.video_url) return true;
  const env = getServerEnv();
  const backupUrl =
    typeof item.metadata?.supabaseOriginalVideoUrl === "string"
      ? item.metadata.supabaseOriginalVideoUrl
      : null;
  // Remove the Supabase staging copy first. Keep the public Cloudinary URL alive
  // until the staging delete succeeds, so a retry never strands a live queue row.
  const candidates = [...new Set([backupUrl, item.video_url].filter((value): value is string => Boolean(value)))];
  const failures: string[] = [];

  for (const candidate of candidates) {
    try {
      await deleteManagedVideoUrl(candidate, env);
    } catch (error) {
      failures.push((candidate.includes("cloudinary.com") ? "Cloudinary: " : "Supabase: ") +
        (error instanceof Error ? error.message : String(error)));
      break;
    }
  }

  if (failures.length) {
    console.error("[social-publishing] Published video cleanup incomplete:", item.id, failures);
    await markQueueItem(item.id, "published", {
      metadata: { ...(item.metadata ?? {}), videoCleanupPending: true, videoCleanupErrors: failures },
    });
    return false;
  }

  if (item.content_id) {
    const requestRows = await supabaseServerAdminRequest<Array<{ content: Record<string, unknown> | null }>>(
      "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(item.content_id) + "&select=content&limit=1",
    );
    const existingContent = requestRows?.[0]?.content ?? {};
    await supabaseServerAdminRequest(
      "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(item.content_id),
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          video_url: null,
          content: { ...existingContent, supabaseOriginalVideoUrl: null, videoDisposedAt: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }),
      },
    );
  }

  await markQueueItem(item.id, "published", {
    video_url: null,
    metadata: {
      ...(item.metadata ?? {}),
      supabaseOriginalVideoUrl: null,
      videoDisposedAt: new Date().toISOString(),
      videoCleanupPending: false,
      videoCleanupErrors: [],
    },
  });
  return true;
}

export async function retryPendingPublishedVideoCleanup(limit = 25): Promise<{
  attempted: number;
  cleaned: number;
  pending: number;
}> {
  let attempted = 0;
  let cleaned = 0;
  try {
    const rows = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
      "/rest/v1/social_publish_queue?status=eq.published&video_url=not.is.null&order=updated_at.asc&limit=" + Math.max(1, Math.min(500, Math.floor(limit))),
    );
    for (const item of rows ?? []) {
      if (!isVideoContentType(item.content_type)) continue;
      attempted += 1;
      if (await disposePublishedVideo(item)) cleaned += 1;
    }
  } catch (error) {
    console.error("[social-publishing] Failed to retry published-video cleanup:", error);
  }
  return { attempted, cleaned, pending: Math.max(0, attempted - cleaned) };
}

export async function processSocialPublishItem(
  item: SocialPublishQueueItem,
  options: { alreadyClaimed?: boolean } = {}
): Promise<"published" | "auth_blocked" | "approval_blocked" | "deferred" | "failed"> {
  if (!(await hasVideoApprovalForQueueItem(item))) {
    await markQueueItem(item.id, "queued", {
      error_message: "Video held for human QA approval before public publishing.",
      metadata: { ...(item.metadata ?? {}), approvalBlocked: true },
    });
    return "approval_blocked";
  }

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
  // The local pacing guard is an expected deferral, not a provider error.
  // Keep it queued as partial, but do not surface it as a red failure.
  const deferredFailures = failures.filter(failure =>
    failure.platform === "facebook_reels" && isFacebookReelsCooldownDeferredError(failure.error)
  );
  const operationalFailures = failures.filter(failure => !deferredFailures.includes(failure));
  const nextStatus: SocialQueueStatus =
    failures.length === 0
      ? "published"
      : successes.length > 0
        ? "partial"
        : "failed";

  const hasAuthFailure = operationalFailures.some(failure =>
    (failure.platform === "facebook" || failure.platform === "facebook_reels") &&
    isFacebookAuthFailure(failure.error)
  );
  const hasNonAuthFailure = operationalFailures.some(failure => !isFacebookAuthFailure(failure.error));
  const hasTransientFailure = operationalFailures.some(failure => {
    const message = failure.error?.toLowerCase() || "";
    return /http\s+(408|425|429|500|502|503|504)|timeout|timed out|fetch failed|temporar|rate limit|overloaded|quota/i.test(message);
  });
  const facebookReelsNextAllowedAt = failures
    .filter(failure => failure.platform === "facebook_reels")
    .map(failure => extractFacebookReelsNextAllowedAt(failure.error))
    .find((value): value is string => Boolean(value)) ?? null;

  // Meta code 368 triggers a shared cooldown. Defer the whole queue row until
  // that time without burning per-item attempts or re-uploading successful targets.
  const attempts = facebookReelsNextAllowedAt
    ? 0
    : Number(item.metadata?.attempts ?? 0) + 1;
  const maxAttempts = socialMaxAttempts(item.metadata);
  const hasPermanentFailure = operationalFailures.some(failure => isPermanentSocialFailure(failure.error));
  const shouldRetry = Boolean(facebookReelsNextAllowedAt) ||
    (attempts < maxAttempts && !hasAuthFailure && !hasPermanentFailure && (hasTransientFailure || nextStatus === "partial"));
  const retryDelayMinutes = hasAuthFailure
    ? 15
    : socialRetryDelayMinutes(attempts, item.id);
  const nextRetryAt = facebookReelsNextAllowedAt ?? (shouldRetry
    ? new Date(Date.now() + retryDelayMinutes * 60_000).toISOString()
    : null);
  const persistedStatus: SocialQueueStatus = facebookReelsNextAllowedAt
    ? "partial"
    : shouldRetry
      ? "partial"
      : nextStatus;

  await markQueueItem(item.id, persistedStatus, {
    scheduled_at: nextRetryAt,
    published_at: successes.length > 0 ? new Date().toISOString() : null,
    error_message:
      operationalFailures
        .map(failure => `${failure.platform}: ${failure.error ?? "unknown error"}`)
        .join("; ") || null,
    metadata: {
      ...(item.metadata ?? {}),
      attempts,
      maxAttempts,
      nextRetryAt,
      authBlocked: hasAuthFailure,
      permanentFailure: hasPermanentFailure,
      facebookReelsNextAllowedAt,
      deferredPlatforms: deferredFailures.map(failure => failure.platform),
      platformResults: mergedResults,
    },
  });

  if (nextStatus === "published") {
    if (isVideoContentType(item.content_type)) await disposePublishedVideo(item);
    return "published";
  }
  if (deferredFailures.length > 0 && operationalFailures.length === 0) return "deferred";
  if (hasAuthFailure && !hasNonAuthFailure) return "auth_blocked";
  return "failed";
}
