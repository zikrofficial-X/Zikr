import { createHash } from "node:crypto";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { publishFacebookReelWithIds, publishToFacebook, publishToYoutube } from "@/features/videos/services/video-automation";
import { getServerEnv } from "@/lib/env";
import { getYouTubeUploadRefreshToken } from "@/features/social/services/youtube-oauth-credentials";
import { getFacebookPageCredentials } from "@/features/social/services/facebook-credentials";
import { extractFacebookReelsNextAllowedAt, isFacebookReelsCooldownDeferredError } from "@/features/social/services/facebook-reels-rate-limit";
import { isVideoContentType, isVideoQueueItemApprovedForPublishing, type VideoPublishRequestSnapshot } from "@/features/videos/services/video-publish-approval";
import { selectEligibleSocialPublishItems } from "@/features/social/services/social-queue-selection";
import { appendSmartLinkDisclosure, MONETAG_SMARTLINK_YOUTUBE_TAGS } from "@/lib/smartlink";
import { canAttemptSocialPlatform, getEnabledSocialPlatforms, getUnavailableSocialPlatforms } from "@/features/social/services/platform-availability";

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
  videoId?: string;
  error?: string;
  approvalBlocked?: boolean;
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
  return /no supported target|requires video_url|requires an absolute video media url|requires an http\(s\) video media url|youtube watch\/embed|oauth|access token|publishing is disabled|not configured|automated qa check/i.test(normalized);
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
    const rows = await supabaseServerAdminRequest<Array<{ status: string; category: string; video_url: string | null; source_hash: string | null; content_hash: string | null; template_version: string | null; content: unknown }>>(
      '/rest/v1/video_generation_requests?id=eq.' + encodeURIComponent(item.content_id) + '&select=status,category,video_url,source_hash,content_hash,template_version,content&limit=1',
    );
    return isVideoQueueItemApprovedForPublishing({
      contentType: item.content_type,
      contentId: item.content_id,
      queuedVideoUrl: item.video_url,
      request: rows?.[0] ?? null,
    });
  } catch (error) {
    console.error("[social-publishing] Automated QA lookup failed; holding video item:", item.id, error);
    return false;
  }
}

async function getApprovedVideoQueueItemIds(
  items: readonly SocialPublishQueueItem[],
): Promise<Set<string>> {
  const videoItems = items.filter((item) => isVideoContentType(item.content_type));
  const contentIds = [...new Set(
    videoItems
      .map((item) => item.content_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  )];
  if (contentIds.length === 0) return new Set();

  try {
    const filter = contentIds.map((id) => encodeURIComponent(id)).join(",");
    const rows = await supabaseServerAdminRequest<Array<VideoPublishRequestSnapshot & { id: string }>>(
      `/rest/v1/video_generation_requests?id=in.(${filter})&select=id,status,category,video_url,source_hash,content_hash,template_version,content`,
    );
    const requestsById = new Map<string, VideoPublishRequestSnapshot>();
    for (const row of rows ?? []) {
      const { id, ...request } = row;
      requestsById.set(id, request);
    }

    const approvedIds = new Set<string>();
    for (const item of videoItems) {
      if (!item.content_id || !item.video_url) continue;
      if (isVideoQueueItemApprovedForPublishing({
        contentType: item.content_type,
        contentId: item.content_id,
        queuedVideoUrl: item.video_url,
        request: requestsById.get(item.content_id) ?? null,
      })) {
        approvedIds.add(item.id);
      }
    }
    return approvedIds;
  } catch (error) {
    console.error("[social-publishing] Batch video approval lookup failed; holding video items:", error);
    return new Set();
  }
}

export async function getPendingSocialPublishItems(
  limit = 10,
  enabledPlatforms: readonly SocialPlatform[] = getEnabledSocialPlatforms(process.env),
): Promise<SocialPublishQueueItem[]> {
  const now = encodeURIComponent(new Date().toISOString());
  const publishAfterValue = process.env.SOCIAL_PUBLISH_AFTER ?? "2026-11-06T20:00:00Z";
  const publishAfterDate = new Date(publishAfterValue);
  if (!Number.isFinite(publishAfterDate.getTime())) {
    console.error("[social-publishing] Invalid SOCIAL_PUBLISH_AFTER cutoff; refusing to read or claim queue rows.");
    return [];
  }
  const createdSince = encodeURIComponent(publishAfterDate.toISOString());
  const effectiveLimit = Math.max(1, Math.min(100, Math.floor(limit) || 1));
  // Read a wider candidate window before applying automated-QA eligibility. Held
  // videos must not occupy the small delivery batch and starve written posts.
  const candidateLimit = Math.max(100, Math.min(500, effectiveLimit * 25));
  const maxAttemptsFor = (metadata: Record<string, unknown> | null) => socialMaxAttempts(metadata);
  const statusPriority: SocialQueueStatus[] = ["partial", "queued", "failed"];
  try {
    const batches = await Promise.all(statusPriority.map((status) =>
      supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        `/rest/v1/social_publish_queue?status=eq.${status}&or=(scheduled_at.is.null,scheduled_at.lte.${now})&created_at=gte.${createdSince}&order=scheduled_at.asc.nullsfirst,created_at.asc&limit=${candidateLimit}`,
      ),
    ));
    const candidates = batches.flatMap((batch) => Array.isArray(batch) ? batch : []);
    const runnableCandidates = candidates.filter((item) =>
      item.target_platforms.some((platform) =>
        canAttemptSocialPlatform({
          platform,
          enabledPlatforms,
          metadata: item.metadata ?? {},
          maxAttempts: maxAttemptsFor(item.metadata),
        }),
      ),
    );
    const approvedVideoQueueItemIds = await getApprovedVideoQueueItemIds(runnableCandidates);
    return selectEligibleSocialPublishItems(runnableCandidates, {
      enabledPlatforms,
      approvedVideoQueueItemIds,
      maxAttemptsFor,
      limit: effectiveLimit,
    });
  } catch (error) {
    console.error("[social-publishing] Failed to fetch queue:", error);
    return [];
  }
}
async function recoverStaleSocialPublishItems() {
  const staleBefore = encodeURIComponent(new Date(Date.now() - 20 * 60_000).toISOString());
  const cutoff = new Date(process.env.SOCIAL_PUBLISH_AFTER ?? "2026-11-06T20:00:00Z");
  if (!Number.isFinite(cutoff.getTime())) {
    console.error("[social-publishing] Invalid SOCIAL_PUBLISH_AFTER cutoff; stale recovery is disabled.");
    return;
  }
  const createdSince = encodeURIComponent(cutoff.toISOString());
  try {
    const stale = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
      `/rest/v1/social_publish_queue?status=eq.processing&updated_at=lt.${staleBefore}&created_at=gte.${createdSince}&select=id,metadata&limit=50`,
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
  limit = 10,
  enabledPlatforms: readonly SocialPlatform[] = getEnabledSocialPlatforms(process.env),
): Promise<SocialPublishQueueItem[]> {
  await retryPendingPublishedVideoCleanup(25);
  await recoverStaleSocialPublishItems();
  const normalItems = await getPendingSocialPublishItems(limit, enabledPlatforms);
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
): Promise<string | { remoteId: string; videoId?: string } | null> {
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
  let kidsAudience = true;
  try {
    kidsAudience = (await getYouTubeVideoDisclosure(item)).selfDeclaredMadeForKids;
  } catch (error) {
    // Do not add an external advertising link when the audience cannot be verified.
    console.warn("[social-publishing] SmartLink omitted because video audience could not be verified:", item.id, error);
  }
  const metadata = {
    title: item.title,
    description: appendSmartLinkDisclosure(item.body ?? "", !kidsAudience),
  };
  if (asReel) {
    return publishFacebookReelWithIds(item.id, metadata, mediaUrl, credentials.pageId);
  }
  return publishToFacebook(item.id, metadata, mediaUrl, credentials.pageId, false);
}

async function getYouTubeVideoDisclosure(item: SocialPublishQueueItem): Promise<{
  selfDeclaredMadeForKids: boolean;
  containsSyntheticMedia: boolean;
}> {
  if (!isVideoContentType(item.content_type)) {
    return { selfDeclaredMadeForKids: false, containsSyntheticMedia: false };
  }
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
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return { selfDeclaredMadeForKids: false, containsSyntheticMedia: false };
  }
  const value = content as Record<string, unknown>;
  const aiProvider = typeof value.aiProvider === "string" ? value.aiProvider.trim() : "";
  return {
    selfDeclaredMadeForKids: value.audience === "kids",
    // The YouTube API disclosure flag is set for media generated by an AI video provider.
    // The local ZIKR template renderer is not treated as photorealistic synthetic footage.
    containsSyntheticMedia: aiProvider.length > 0 && aiProvider !== "template",
  };
}

async function publishYoutubeItem(item: SocialPublishQueueItem): Promise<string | null> {
  if (!item.video_url) throw new Error("YouTube publishing requires video_url");
  const mediaUrl = assertPublishableVideoUrl(item.video_url, "youtube");
  const env = getServerEnv();
  const refreshToken = await getYouTubeUploadRefreshToken();
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !refreshToken) {
    throw new Error("YouTube OAuth is not configured: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and a stored credential with youtube.upload, youtube.readonly and yt-analytics.readonly scopes are required.");
  }
  const disclosure = await getYouTubeVideoDisclosure(item);
  return publishToYoutube(
    item.id,
    {
      title: item.title,
      description: appendSmartLinkDisclosure(
        [item.body ?? "", publicUrl(item)].filter(Boolean).join("\n\n"),
        !disclosure.selfDeclaredMadeForKids,
      ),
      tags: [
        "zikr",
        "islamic",
        item.content_type,
        ...(disclosure.selfDeclaredMadeForKids ? [] : [...MONETAG_SMARTLINK_YOUTUBE_TAGS]),
      ],
      categoryId: "27",
      isShort: item.metadata?.videoFormat !== "horizontal",
    },
    mediaUrl,
    disclosure,
  );
}

async function publishPlatform(
  item: SocialPublishQueueItem,
  platform: SocialPlatform
): Promise<PlatformResult> {
  try {
    // The automated QA snapshot is re-read immediately before every channel call.
    // Any source, content, template or media change holds the not-yet-sent target.
    if (!(await hasVideoApprovalForQueueItem(item))) {
      return { platform, ok: false, approvalBlocked: true, error: "Video held because automated QA is missing, incomplete or stale." };
    }
    const publication =
      platform === "facebook"
        ? item.video_url
          ? await publishFacebookVideoItem(item, false)
          : await publishFacebookPost(item)
        : platform === "facebook_reels"
          ? await publishFacebookVideoItem(item, true)
          : await publishYoutubeItem(item);
    const remoteId = typeof publication === "string"
      ? publication
      : publication && typeof publication === "object"
        ? publication.remoteId
        : null;
    const videoId = publication && typeof publication === "object" && "videoId" in publication
      ? publication.videoId
      : undefined;

    if (!remoteId) {
      throw new Error(
        `${platform} publisher completed without returning a remote post/video ID. Check provider credentials, permissions, and the target page/channel.`
      );
    }

    return { platform, ok: true, remoteId, ...(videoId ? { videoId } : {}) };
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
    if (parts[0] !== cloudName || parts[1] !== "video" || parts[2] !== "upload" || !publicId.startsWith("auto-")) {
      throw new Error("Only ZIKR auto-generated upload videos can be deleted");
    }
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
    const message = error instanceof Error ? error.message : String(error);
    const alreadyMissing =
      message.startsWith("Supabase REST 404:") ||
      message.includes('"code":"NoSuchKey"') ||
      message.includes('"message":"Object not found"');
    if (!alreadyMissing) throw error;
  }
}

/**
 * Remove temporary video artifacts only after every requested social target
 * has confirmed publication. Provider post IDs and text/audit records stay.
 * Failed cleanup is retried by the social publishing worker.
 */
async function syncYouTubeVideoReferenceToCatalog(
  item: SocialPublishQueueItem,
  result: unknown,
): Promise<void> {
  if (!isVideoContentType(item.content_type) || !item.content_id || !result || typeof result !== "object") return;
  const platformResult = result as Partial<PlatformResult>;
  const youtubeId = typeof platformResult.remoteId === "string" ? platformResult.remoteId.trim() : "";
  if (platformResult.ok !== true || !/^[A-Za-z0-9_-]{6,20}$/.test(youtubeId)) return;

  try {
    const rows = await supabaseServerAdminRequest<Array<{
      id: string;
      youtube_id: string | null;
      metadata: Record<string, unknown> | null;
      updated_at: string | null;
    }>>(
      "/rest/v1/videos?metadata->>videoGenerationRequestId=eq." +
        encodeURIComponent(item.content_id) +
        "&select=id,youtube_id,metadata,updated_at&limit=2",
    );
    if (!rows?.length) {
      console.warn("[social-publishing] YouTube upload succeeded but no matching public catalog record was found:", item.content_id);
      return;
    }
    if (rows.length !== 1) {
      console.error("[social-publishing] YouTube catalog reconciliation stopped: generation request maps to multiple video rows:", item.content_id);
      return;
    }
    const row = rows[0];
    if (row.youtube_id && row.youtube_id !== youtubeId) {
      console.error("[social-publishing] YouTube catalog reconciliation stopped: existing YouTube ID differs from the confirmed platform result:", item.content_id);
      return;
    }
    const metadata = row.metadata ?? {};
    const nextMetadata = {
      ...metadata,
      youtubePublishedVideoId: youtubeId,
      youtubePublishedUrl: "https://www.youtube.com/watch?v=" + youtubeId,
      youtubePublishedAt: new Date().toISOString(),
      mediaFallbackAvailable: true,
    };
    const updatedAt = row.updated_at;
    const query = "/rest/v1/videos?id=eq." + encodeURIComponent(row.id) +
      (updatedAt ? "&updated_at=eq." + encodeURIComponent(updatedAt) : "");
    const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(query, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        youtube_id: youtubeId,
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!updated?.length) {
      console.warn("[social-publishing] YouTube catalog pointer update was skipped after a concurrent catalog change:", item.content_id);
    }
  } catch (error) {
    // The daily media reconciliation worker retries this idempotently.
    console.error("[social-publishing] YouTube catalog reference sync failed:", item.content_id, error);
  }
}

async function disposePublishedVideo(item: SocialPublishQueueItem): Promise<boolean> {
  if (!item.video_url || !item.content_id) return true;

  // Social delivery is not permission to delete either the public playback master
  // or its staging backup. The public catalog depends on the master, while the
  // retention worker owns the staging copy after the 48-hour grace period.
  const requestRows = await supabaseServerAdminRequest<Array<{ content: Record<string, unknown> | null }>>(
    "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(item.content_id) + "&select=content&limit=1",
  );
  const existingContent = requestRows?.[0]?.content ?? {};
  const publishedAt = item.published_at ?? new Date().toISOString();
  const publishedTime = Date.parse(publishedAt);
  const stagingCleanupEligibleAt = new Date(
    (Number.isFinite(publishedTime) ? publishedTime : Date.now()) + 48 * 60 * 60 * 1000,
  ).toISOString();

  await supabaseServerAdminRequest(
    "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(item.content_id),
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        content: { ...existingContent, stagingCleanupDeferred: true, stagingCleanupEligibleAt },
        updated_at: new Date().toISOString(),
      }),
    },
  );

  await markQueueItem(item.id, "published", {
    metadata: {
      ...(item.metadata ?? {}),
      stagingCleanupDeferred: true,
      stagingCleanupEligibleAt,
      videoCleanupPending: false,
      videoCleanupErrors: [],
    },
  });
  return true;
}

export async function resetQueuedSocialVideoMedia(limit = 100): Promise<{ attempted: number; cleaned: number; pending: number }> {
  const maxItems = Math.max(1, Math.min(100, Math.floor(limit)));
  const cutoff = new Date(process.env.SOCIAL_PUBLISH_AFTER ?? "2026-11-06T20:00:00Z");
  if (!Number.isFinite(cutoff.getTime())) throw new Error("Invalid SOCIAL_PUBLISH_AFTER cutoff.");
  const createdSince = encodeURIComponent(cutoff.toISOString());
  const select = "select=id,content_type,content_id,title,body,image_url,video_url,target_platforms,status,scheduled_at,published_at,error_message,metadata,created_at,updated_at&";
  const queueItems = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
    "/rest/v1/social_publish_queue?status=eq.queued&created_at=gte." + createdSince + "&video_url=not.is.null&" + select + "order=created_at.asc&limit=" + maxItems,
  );
  const retryItems = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
    "/rest/v1/social_publish_queue?status=eq.failed&created_at=gte." + createdSince + "&metadata->>queueResetPending=eq.true&video_url=not.is.null&" + select + "order=updated_at.asc&limit=" + maxItems,
  );
  const items = [...(queueItems ?? []), ...(retryItems ?? [])];
  if (!items.length) return { attempted: 0, cleaned: 0, pending: 0 };

  const ids = items.map(item => item.content_id).filter((id): id is string => Boolean(id));
  if (ids.length !== items.length || new Set(ids).size !== items.length ||
      new Set(items.map(item => item.video_url)).size !== items.length) {
    throw new Error("Reset stopped: queued media rows must have unique request IDs and video URLs.");
  }

  const requests = await supabaseServerAdminRequest<QueueResetGeneration[]>(
    "/rest/v1/video_generation_requests?id=in.(" + ids.join(",") + ")&select=id,status,video_url,content",
  );
  const byId = new Map((requests ?? []).map(request => [request.id, request]));
  const env = getServerEnv();
  const expectedHost = env.NEXT_PUBLIC_SUPABASE_URL ? new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";
  const plan = items.map(item => {
    if (!isVideoContentType(item.content_type) || !item.content_id || !item.video_url) {
      throw new Error("Reset stopped: selected queue item is not a video.");
    }
    const request = byId.get(item.content_id);
    if (!request || !["completed", "failed"].includes(request.status) || request.video_url !== item.video_url) {
      throw new Error("Reset stopped: generation request mismatch for " + item.id);
    }
    const queueBackup = item.metadata?.supabaseOriginalVideoUrl;
    const requestBackup = request.content?.supabaseOriginalVideoUrl;
    const backupUrl = typeof queueBackup === "string"
      ? queueBackup
      : typeof requestBackup === "string" ? requestBackup : null;
    const delivery = new URL(item.video_url);
    if (delivery.protocol !== "https:" || delivery.hostname !== "res.cloudinary.com" ||
        !delivery.pathname.includes("/video/upload/")) {
      throw new Error("Reset stopped: unmanaged Cloudinary delivery URL for " + item.id);
    }
    if (backupUrl !== null) {
      const backup = new URL(backupUrl);
      if (!expectedHost || backup.protocol !== "https:" || backup.hostname !== expectedHost ||
          !backup.pathname.startsWith("/storage/v1/object/public/videos/automated/") ||
          !backup.pathname.endsWith(".mp4")) {
        throw new Error("Reset stopped: unmanaged legacy Supabase backup for " + item.id);
      }
    }
    return { item, request, backupUrl };
  });

  let cleaned = 0;
  let pending = 0;
  for (const { item, request, backupUrl } of plan) {
    const content = request.content ?? {};
    const resetAt = new Date().toISOString();
    await markQueueItem(item.id, "failed", {
      error_message: "Operator reset: pending video discarded before publication.",
      metadata: { ...(item.metadata ?? {}), supabaseOriginalVideoUrl: backupUrl, queueResetAt: resetAt, queueResetPending: true },
    });
    await supabaseServerAdminRequest("/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(request.id), {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "failed",
        error_message: "Operator reset: pending video discarded before publication.",
        content: { ...content, supabaseOriginalVideoUrl: backupUrl, queueResetAt: resetAt, queueResetPending: true },
        updated_at: resetAt,
      }),
    });

    try {
      if (backupUrl !== null) await deleteManagedVideoUrl(backupUrl, env);
      await deleteManagedVideoUrl(item.video_url as string, env);
      const disposedAt = new Date().toISOString();
      await supabaseServerAdminRequest("/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(request.id), {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          video_url: null,
          content: { ...content, supabaseOriginalVideoUrl: null, queueResetAt: resetAt, queueResetPending: false, videoDisposedAt: disposedAt },
          updated_at: disposedAt,
        }),
      });
      await markQueueItem(item.id, "failed", {
        video_url: null,
        metadata: { ...(item.metadata ?? {}), supabaseOriginalVideoUrl: null, queueResetAt: resetAt, queueResetPending: false, videoDisposedAt: disposedAt },
      });
      cleaned += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markQueueItem(item.id, "failed", {
        error_message: "Operator reset started; video cleanup is pending retry.",
        metadata: { ...(item.metadata ?? {}), supabaseOriginalVideoUrl: backupUrl, queueResetAt: resetAt, queueResetPending: true, queueResetError: message.slice(0, 1000) },
      });
      pending += 1;
    }
  }
  return { attempted: plan.length, cleaned, pending };
}

type QueueResetGeneration = {
  id: string;
  status: string;
  video_url: string | null;
  content: Record<string, unknown> | null;
};

export async function retryPendingPublishedVideoCleanup(limit = 25): Promise<{
  attempted: number;
  cleaned: number;
  pending: number;
  error?: string;
}> {
  let attempted = 0;
  let cleaned = 0;
  try {
    const cutoff = new Date(process.env.SOCIAL_PUBLISH_AFTER ?? "2026-11-06T20:00:00Z");
    if (!Number.isFinite(cutoff.getTime())) throw new Error("Invalid SOCIAL_PUBLISH_AFTER cutoff.");
    const rows = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
      "/rest/v1/social_publish_queue?status=eq.published&video_url=not.is.null&created_at=gte." +
        encodeURIComponent(cutoff.toISOString()) +
        "&order=updated_at.asc&limit=" + Math.max(1, Math.min(100, Math.floor(limit))),
    );
    for (const item of rows ?? []) {
      if (!isVideoContentType(item.content_type)) continue;
      attempted += 1;
      if (await disposePublishedVideo(item)) cleaned += 1;
    }
  } catch (error) {
    console.error("[social-publishing] Failed to retry published-video cleanup:", error);
    return {
      attempted,
      cleaned,
      pending: Math.max(1, attempted - cleaned),
      error: error instanceof Error ? error.message : String(error),
    };
  }
  return { attempted, cleaned, pending: Math.max(0, attempted - cleaned) };
}

export async function processSocialPublishItem(
  item: SocialPublishQueueItem,
  options: { alreadyClaimed?: boolean; enabledPlatforms?: readonly SocialPlatform[] } = {},
): Promise<"published" | "auth_blocked" | "approval_blocked" | "deferred" | "failed"> {
  if (!(await hasVideoApprovalForQueueItem(item))) {
    await markQueueItem(item.id, "queued", {
      error_message: "Video held for automated qa check before public publishing.",
      metadata: { ...(item.metadata ?? {}), approvalBlocked: true },
    });
    return "approval_blocked";
  }

  if (!options.alreadyClaimed) await markQueueItem(item.id, "processing");

  const platforms = item.target_platforms.filter(
    (platform): platform is SocialPlatform => platform === "facebook" || platform === "facebook_reels" || platform === "youtube",
  );
  if (platforms.length === 0) {
    await markQueueItem(item.id, "failed", { error_message: "No supported target platforms selected" });
    return "failed";
  }

  const enabledPlatforms = options.enabledPlatforms ?? getEnabledSocialPlatforms(process.env);
  const previous = item.metadata?.platformResults && typeof item.metadata.platformResults === "object" && !Array.isArray(item.metadata.platformResults)
    ? item.metadata.platformResults as Record<string, unknown>
    : {};
  const previousMetadata = item.metadata ?? {};
  const maxAttempts = socialMaxAttempts(previousMetadata);
  const runnablePlatforms = platforms.filter(platform => canAttemptSocialPlatform({
    platform, enabledPlatforms, metadata: previousMetadata, maxAttempts,
  }));
  const unavailablePlatforms = getUnavailableSocialPlatforms(platforms, enabledPlatforms);

  if (runnablePlatforms.length === 0) {
    const allTargetsSucceeded = platforms.every(platform => {
      const result = previous[platform];
      return Boolean(result && typeof result === "object" && (result as PlatformResult).ok === true &&
        typeof (result as PlatformResult).remoteId === "string" && (result as PlatformResult).remoteId?.trim());
    });
    if (allTargetsSucceeded) {
      await markQueueItem(item.id, "published", { error_message: null, scheduled_at: null });
      if (isVideoContentType(item.content_type)) await disposePublishedVideo({ ...item, metadata: previousMetadata });
      return "published";
    }
    if (unavailablePlatforms.length > 0) {
      const nextRetryAt = new Date(Date.now() + 15 * 60_000).toISOString();
      await markQueueItem(item.id, "queued", {
        scheduled_at: nextRetryAt,
        error_message: "Waiting for configured publishing channels: " + unavailablePlatforms.join(", "),
        metadata: { ...previousMetadata, unavailablePlatforms, nextRetryAt },
      });
      return "deferred";
    }
    const blockedFacebook = platforms.some(platform => {
      const result = previous[platform] as PlatformResult | undefined;
      return result?.ok === false && isFacebookAuthFailure(result.error);
    });
    await markQueueItem(item.id, platforms.some(platform => previous[platform] && (previous[platform] as PlatformResult).ok === true) ? "partial" : "failed", {
      error_message: "No eligible target remains; repair the platform connection or review the channel-specific failure.",
      scheduled_at: null,
      metadata: { ...previousMetadata, unavailablePlatforms: [] },
    });
    return blockedFacebook ? "auth_blocked" : "failed";
  }

  const results = await Promise.all(runnablePlatforms.map(platform => publishPlatform(item, platform)));
  const mergedResults: Record<string, PlatformResult> = {};
  for (const platform of platforms) {
    const prior = previous[platform];
    if (prior && typeof prior === "object") mergedResults[platform] = prior as PlatformResult;
  }
  for (const result of results) {
    // Automated QA deferrals are not provider failures; keep them out of the
    // permanent per-platform result ledger so a corrected render can be retried.
    if (result.approvalBlocked) continue;
    mergedResults[result.platform] = result;
  }

  const allResults = platforms.map(platform => mergedResults[platform]).filter((result): result is PlatformResult => Boolean(result));
  const successes = allResults.filter(result => result.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0);
  const failures = results.filter(result => !result.ok && !result.approvalBlocked);
  const approvalDeferredPlatforms = results.filter(result => result.approvalBlocked).map(result => result.platform);
  const deferredFailures = failures.filter(failure =>
    failure.platform === "facebook_reels" && isFacebookReelsCooldownDeferredError(failure.error),
  );
  const operationalFailures = failures.filter(failure => !deferredFailures.includes(failure));
  const allTargetsSucceeded = platforms.every(platform => {
    const result = mergedResults[platform];
    return result?.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0;
  });

  const hasAuthFailure = operationalFailures.some(failure =>
    (failure.platform === "facebook" || failure.platform === "facebook_reels") && isFacebookAuthFailure(failure.error),
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

  const maxAttemptsByPlatform = {
    ...((previousMetadata.platformAttempts && typeof previousMetadata.platformAttempts === "object" && !Array.isArray(previousMetadata.platformAttempts))
      ? previousMetadata.platformAttempts as Record<string, number>
      : {}),
  };
  for (const result of results) {
    if (result.approvalBlocked) continue;
    maxAttemptsByPlatform[result.platform] = Number(maxAttemptsByPlatform[result.platform] ?? 0) + 1;
  }
  const attemptedProviderCalls = results.filter(result => !result.approvalBlocked).length;
  const attempts = facebookReelsNextAllowedAt
    ? Number(previousMetadata.attempts ?? 0)
    : Number(previousMetadata.attempts ?? 0) + (attemptedProviderCalls > 0 ? 1 : 0);
  const retryableOperationalFailures = operationalFailures.some(failure => {
    const currentPlatformAttempts = Number(maxAttemptsByPlatform[failure.platform] ?? 0);
    return currentPlatformAttempts < maxAttempts && !isFacebookAuthFailure(failure.error) && !isPermanentSocialFailure(failure.error);
  });
  const hasDeferredTargets = unavailablePlatforms.length > 0 || approvalDeferredPlatforms.length > 0 || deferredFailures.length > 0;
  const shouldRetry = Boolean(facebookReelsNextAllowedAt) || hasDeferredTargets ||
    (retryableOperationalFailures && (hasTransientFailure || successes.length > 0));
  const retryDelayMinutes = hasAuthFailure ? 15 : socialRetryDelayMinutes(attempts, item.id);
  const nextRetryAt = facebookReelsNextAllowedAt ?? (shouldRetry
    ? new Date(Date.now() + (hasDeferredTargets ? 15 : retryDelayMinutes) * 60_000).toISOString()
    : null);

  const nextStatus: SocialQueueStatus = allTargetsSucceeded
    ? "published"
    : successes.length > 0 || hasDeferredTargets
      ? "partial"
      : "failed";
  const onlyDeferred = hasDeferredTargets && operationalFailures.length === 0 && successes.length === 0;
  const persistedStatus: SocialQueueStatus = allTargetsSucceeded
    ? "published"
    : onlyDeferred
      ? "queued"
      : shouldRetry
        ? "partial"
        : nextStatus;

  const authBlockedPlatforms = operationalFailures
    .filter(failure => isFacebookAuthFailure(failure.error))
    .map(failure => failure.platform);
  const permanentFailurePlatforms = operationalFailures
    .filter(failure => isPermanentSocialFailure(failure.error))
    .map(failure => failure.platform);
  const publishMetadata = {
    ...previousMetadata,
    attempts,
    maxAttempts,
    platformAttempts: maxAttemptsByPlatform,
    nextRetryAt,
    authBlocked: authBlockedPlatforms.length > 0,
    authBlockedPlatforms,
    permanentFailure: permanentFailurePlatforms.length > 0,
    permanentFailurePlatforms,
    unavailablePlatforms,
    approvalDeferredPlatforms,
    facebookReelsNextAllowedAt,
    deferredPlatforms: deferredFailures.map(failure => failure.platform),
    platformResults: mergedResults,
  };

  const errorMessages = operationalFailures.map(failure => `${failure.platform}: ${failure.error ?? "unknown error"}`);
  if (unavailablePlatforms.length) errorMessages.push("Waiting for channel configuration: " + unavailablePlatforms.join(", "));
  if (approvalDeferredPlatforms.length) errorMessages.push("Video held for a fresh automated QA check: " + approvalDeferredPlatforms.join(", "));
  await markQueueItem(item.id, persistedStatus, {
    scheduled_at: nextRetryAt,
    published_at: successes.length > 0 ? new Date().toISOString() : null,
    error_message: errorMessages.join("; ") || null,
    metadata: publishMetadata,
  });

  // Persist the confirmed YouTube video ID to the public catalog even when
  // another requested target is deferred; this provides a resilient playback fallback.
  await syncYouTubeVideoReferenceToCatalog(item, mergedResults.youtube);

  if (allTargetsSucceeded) {
    if (isVideoContentType(item.content_type)) await disposePublishedVideo({ ...item, metadata: publishMetadata });
    return "published";
  }
  if (hasDeferredTargets && operationalFailures.length === 0) {
    return approvalDeferredPlatforms.length > 0 && unavailablePlatforms.length === 0 ? "approval_blocked" : "deferred";
  }
  if (hasAuthFailure && !hasNonAuthFailure) return "auth_blocked";
  return "failed";
}