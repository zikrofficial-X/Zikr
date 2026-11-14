import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { assertCloudinaryVideoUrl } from "@/features/videos/services/video-media-url";
import { publishFacebookReelWithIds, publishToFacebook, publishToYoutube } from "@/features/videos/services/video-automation";
import { getServerEnv } from "@/lib/env";
import { getYouTubeUploadRefreshToken } from "@/features/social/services/youtube-oauth-credentials";
import { resolveYouTubeVideoDisclosure } from "@/features/social/services/youtube-video-disclosure";
import { getFacebookPageCredentials } from "@/features/social/services/facebook-credentials";
import { resolveSocialPublishCutoff } from "@/features/social/services/facebook-queue-recovery-policy";
import { extractFacebookReelsNextAllowedAt, isFacebookReelsCooldownDeferredError } from "@/features/social/services/facebook-reels-rate-limit";
import { isVideoContentType, isVideoQueueItemApprovedForPublishing, type VideoPublishRequestSnapshot } from "@/features/videos/services/video-publish-approval";
import { shouldRestorePurgedPublishedVideo } from "@/features/videos/services/video-media-contract";
import {
  buildDueSocialQueueClaimFilter,
  buildSocialPublishLeaseFilter,
  mergeUniqueSocialPublishCandidates,
  requireSocialQueueRows,
  selectEligibleSocialPublishItems,
} from "@/features/social/services/social-queue-selection";
import { getPublishedVideoStagingCleanupEligibleAt, PUBLISHED_VIDEO_CLEANUP_POSTGREST_FILTER, shouldRetryPublishedVideoCleanup } from "@/features/social/services/published-video-cleanup";
import { patchSocialQueueMetadataWithCas } from "@/features/social/services/social-queue-metadata";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";
import { buildSocialPublishInFlightMetadata, buildStaleSocialPublishRecoveryFilter, buildStaleSocialPublishRecoveryMetadata, clearRevalidatedSocialApprovalDeferrals, clearSocialPublishInFlightMetadata } from "@/features/social/services/social-publish-recovery-policy";
import { isEligibleKidsWrittenPostForPublishing, isKidsWrittenPostCandidate, type CurrentKidsStory } from "@/features/social/services/written-content";
import { canAttemptSocialPlatform, getEnabledSocialPlatforms, getManualReconciliationPlatforms, getUnavailableSocialPlatforms, isAmbiguousProviderOutcome, isAuthBlocked, isPermanentSocialFailure, mergeAuthBlockedPlatforms, normalizeSocialPlatformResults } from "@/features/social/services/platform-availability";

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
  requiresReconciliation?: boolean;
  approvalBlocked?: boolean;
};

function siteUrl() {
  const env = getServerEnv();
  return (env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

function assertPublishableVideoUrl(videoUrl: string, target: "facebook" | "youtube") {
  return assertCloudinaryVideoUrl(videoUrl, target);
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

async function markQueueItem(
  itemId: string,
  status: SocialQueueStatus,
  patch: Record<string, unknown> = {},
  expectedLease?: { status: SocialQueueStatus; updatedAt: string },
): Promise<boolean> {
  const now = new Date();
  const updatedAt = expectedLease
    ? buildNextRowVersionUpdatedAt(expectedLease.updatedAt, now)
    : now.toISOString();
  const filter = expectedLease
    ? buildSocialPublishLeaseFilter(itemId, expectedLease.status, expectedLease.updatedAt)
    : `id=eq.${encodeURIComponent(itemId)}`;
  const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/social_publish_queue?${filter}`,
    {
      method: "PATCH",
      headers: { Prefer: expectedLease ? "return=representation" : "return=minimal" },
      body: JSON.stringify({
        ...patch,
        status,
        updated_at: updatedAt,
      }),
    }
  );
  return !expectedLease || (Array.isArray(updated) && updated.length > 0);
}

async function hasVideoApprovalForQueueItem(item: SocialPublishQueueItem): Promise<boolean> {
  if (item.metadata?.sourceMediaMissing === true) return false;
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

type WrittenPostSourceApproval = "not_applicable" | "approved" | "blocked" | "unavailable";

function isKidsWrittenQueueItem(item: SocialPublishQueueItem): boolean {
  const metadata = item.metadata ?? {};
  const publicPath = typeof metadata.publicPath === "string" ? metadata.publicPath : "";
  return metadata.audience === "kids" ||
    isKidsWrittenPostCandidate(item) ||
    publicPath === "/kids" ||
    publicPath.startsWith("/kids/");
}

async function checkWrittenPostSourceApproval(
  item: SocialPublishQueueItem,
): Promise<WrittenPostSourceApproval> {
  if (item.content_type !== "written_post") return "not_applicable";

  const metadata = item.metadata ?? {};
  const sourceId = item.content_id;
  const kidsPost = isKidsWrittenQueueItem(item);
  if (kidsPost) {
    if (!isKidsWrittenPostCandidate(item) || metadata.audience !== "kids") return "blocked";
    if (!sourceId || metadata.kidsContentId !== sourceId) return "blocked";

    try {
      const rows = await supabaseServerAdminRequest<CurrentKidsStory[]>(
        "/rest/v1/kids_content?id=eq." + encodeURIComponent(sourceId) +
          "&select=id,slug,title_ar,age_group,type,published,is_active,metadata&limit=2",
      );
      if (!Array.isArray(rows)) throw new Error("Kids source lookup returned invalid data.");
      if (rows.length !== 1) return "blocked";
      return isEligibleKidsWrittenPostForPublishing(item, rows[0]) ? "approved" : "blocked";
    } catch (error) {
      console.error("[social-publishing] Kids written-post approval lookup failed; holding item:", item.id, error);
      return "unavailable";
    }
  }

  if (!sourceId) return "blocked";
  try {
    const articles = await supabaseServerAdminRequest<Array<{ id: string; published: unknown }>>(
      "/rest/v1/articles?id=eq." + encodeURIComponent(sourceId) +
        "&select=id,published&limit=2",
    );
    if (!Array.isArray(articles)) throw new Error("Written article publication lookup returned invalid data.");
    if (articles.length !== 1) return "blocked";
    if (articles[0].published === true) return "approved";
    if (typeof articles[0].published !== "boolean") {
      throw new Error("Written article publication flag is invalid.");
    }

    const scheduledRows = await supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/content_publish_queue?content_table=eq.articles&content_id=eq." +
        encodeURIComponent(sourceId) +
        "&status=in.(queued,processing)&select=id&limit=2",
    );
    if (!Array.isArray(scheduledRows)) {
      throw new Error("Written article publication schedule lookup returned invalid data.");
    }
    return scheduledRows.length > 0 ? "unavailable" : "blocked";
  } catch (error) {
    console.error("[social-publishing] Written article publication lookup failed; holding item:", item.id, error);
    return "unavailable";
  }
}

async function getApprovedVideoQueueItemIds(
  items: readonly SocialPublishQueueItem[],
): Promise<Set<string>> {
  const videoItems = items.filter((item) => isVideoContentType(item.content_type) && item.metadata?.sourceMediaMissing !== true);
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
  const createdSince = encodeURIComponent(resolveSocialPublishCutoff(process.env.SOCIAL_PUBLISH_AFTER));
  const effectiveLimit = Math.max(1, Math.min(100, Math.floor(limit) || 1));
  // Read a wider candidate window before applying automated-QA eligibility. Held
  // videos must not occupy the small delivery batch and starve written posts.
  const candidateLimit = Math.max(100, Math.min(500, effectiveLimit * 25));
  const maxAttemptsFor = (metadata: Record<string, unknown> | null) => socialMaxAttempts(metadata);
  const statusPriority: SocialQueueStatus[] = ["partial", "queued", "failed"];
  try {
    const select = "id,content_type,content_id,title,body,image_url,video_url,target_platforms,status,scheduled_at,published_at,error_message,metadata,created_at,updated_at";
    const dueAndRecent = `or=(scheduled_at.is.null,scheduled_at.lte.${now})&created_at=gte.${createdSince}&select=${select}&order=scheduled_at.asc.nullsfirst,created_at.asc&limit=${candidateLimit}`;
    const [batches, writtenCandidates] = await Promise.all([
      Promise.all(statusPriority.map((status) =>
        supabaseServerAdminRequest<SocialPublishQueueItem[]>(
          `/rest/v1/social_publish_queue?status=eq.${status}&${dueAndRecent}`,
        ),
      )),
      // A dedicated written-post window prevents a large held-video backlog
      // from hiding every written post beyond the general candidate limit.
      supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        `/rest/v1/social_publish_queue?status=in.(${statusPriority.join(",")})&content_type=eq.written_post&${dueAndRecent}`,
      ),
    ]);
    const validatedBatches = batches.map((batch, index) =>
      requireSocialQueueRows<SocialPublishQueueItem>(batch, `social publish ${statusPriority[index] ?? "status"} query`),
    );
    const validatedWrittenCandidates = requireSocialQueueRows<SocialPublishQueueItem>(
      writtenCandidates,
      "written-post social publish query",
    );
    const candidates = mergeUniqueSocialPublishCandidates(
      ...validatedBatches,
      validatedWrittenCandidates,
    );
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
    throw new Error("Failed to fetch social publish queue candidates; refusing to report an empty successful batch.");
  }
}

async function recoverStaleSocialPublishItems() {
  const staleBefore = new Date(Date.now() - 20 * 60_000).toISOString();
  const createdSince = encodeURIComponent(resolveSocialPublishCutoff(process.env.SOCIAL_PUBLISH_AFTER));
  try {
    const stale = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
      `/rest/v1/social_publish_queue?status=eq.processing&updated_at=lt.${encodeURIComponent(staleBefore)}&created_at=gte.${createdSince}&select=id,metadata,target_platforms,updated_at&order=updated_at.asc,id.asc&limit=50`,
    );
    const staleRows = requireSocialQueueRows<SocialPublishQueueItem>(stale, "stale social publish query");
    let recovered = 0;
    for (const item of staleRows) {
      const metadata = item.metadata ?? {};
      const recoveredAt = new Date().toISOString();
      const recovery = buildStaleSocialPublishRecoveryMetadata(metadata, item.target_platforms ?? [], recoveredAt);
      const manualReconciliationPlatforms = getManualReconciliationPlatforms(recovery.metadata);
      const attempts = Number(metadata.attempts ?? 0) + 1;
      const maxAttempts = socialMaxAttempts(metadata);
      const manualReconciliationRequired = manualReconciliationPlatforms.length > 0;
      const terminal = manualReconciliationRequired || attempts >= maxAttempts;
      const nextStatus: SocialQueueStatus = manualReconciliationRequired
        ? recovery.hasPriorSuccess ? "partial" : "failed"
        : terminal ? "failed" : "partial";
      const errorMessage = manualReconciliationRequired
        ? "Manual reconciliation required for uncertain provider outcome(s): " + manualReconciliationPlatforms.join(", ")
        : "تمت استعادة عملية نشر عالقة تلقائيًا وسيُعاد تشغيل المنصات غير المكتملة.";
      const updated = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        `/rest/v1/social_publish_queue?${buildStaleSocialPublishRecoveryFilter(item.id, staleBefore, item.updated_at)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({
            status: nextStatus,
            scheduled_at: terminal ? null : new Date(Date.now() + socialRetryDelayMinutes(attempts, item.id) * 60_000).toISOString(),
            error_message: errorMessage,
            metadata: { ...recovery.metadata, attempts, maxAttempts },
            updated_at: recoveredAt,
          }),
        },
      );
      if (Array.isArray(updated) && updated[0]) recovered += 1;
    }
    if (recovered > 0) console.warn("[social-publishing] Recovered stale processing rows:", recovered);
  } catch (error) {
    console.error("[social-publishing] Failed to recover stale items:", error);
    throw new Error("Failed to recover stale social publish items; refusing to continue with an incomplete queue state.");
  }
}

export async function claimPendingSocialPublishItems(
  limit = 10,
  enabledPlatforms: readonly SocialPlatform[] = getEnabledSocialPlatforms(process.env),
): Promise<SocialPublishQueueItem[]> {
  await recoverStaleSocialPublishItems();
  const normalItems = await getPendingSocialPublishItems(limit, enabledPlatforms);
  // Failed Facebook-auth items are intentionally not auto-retried. An expired
  // page token will otherwise create an unbounded retry loop and repeated provider
  // requests. Admin can manually requeue them after credentials are repaired.
  const items = normalItems;
  const claimed: SocialPublishQueueItem[] = [];

  for (const item of items) {
    try {
      const claimNow = new Date();
      const claimAt = claimNow.toISOString();
      const claimUpdatedAt = buildNextRowVersionUpdatedAt(item.updated_at, claimNow);
      const claimStatus = item.status === "partial" ? "partial" : item.status === "failed" ? "failed" : "queued";
      // Atomic claim compares the exact updated_at value returned with this candidate.
      // This prevents a concurrent edit from publishing stale title/body/media metadata;
      // PostgREST receives the server-returned timestamp rather than a reconstructed value.
      const result = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        `/rest/v1/social_publish_queue?${buildDueSocialQueueClaimFilter(item.id, claimStatus, claimAt, item.updated_at)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            status: "processing",
            error_message: null,
            updated_at: claimUpdatedAt,
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
  const metadata = {
    title: item.title,
    description: item.body ?? "",
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

  const rows = await supabaseServerAdminRequest<Array<{ content: unknown; provider: string | null }>>(
    "/rest/v1/video_generation_requests?id=eq." +
      encodeURIComponent(item.content_id) +
      "&select=content,provider&limit=1",
  );
  if (!Array.isArray(rows) || !rows[0]) {
    throw new Error("YouTube video audience metadata is unavailable; publishing was held.");
  }

  return resolveYouTubeVideoDisclosure({
    content: rows[0].content,
    provider: rows[0].provider,
    queueMetadata: item.metadata,
    contentType: item.content_type,
  });
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
      description: [item.body ?? "", publicUrl(item)].filter(Boolean).join("\n\n"),
      tags: [
        "zikr",
        "islamic",
        item.content_type,
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
    const sourceApproval = await checkWrittenPostSourceApproval(item);
    if (sourceApproval === "blocked" || sourceApproval === "unavailable") {
      const kidsWrittenPost = isKidsWrittenQueueItem(item);
      return {
        platform,
        ok: false,
        approvalBlocked: true,
        error: sourceApproval === "blocked"
          ? kidsWrittenPost
            ? "Kids source is no longer approved for public publishing."
            : "Written article is no longer published."
          : kidsWrittenPost
            ? "Kids source approval could not be revalidated."
            : "Written article publication could not be revalidated.",
      };
    }
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
    const message = error instanceof Error ? error.message : String(error);
    return {
      platform,
      ok: false,
      error: message,
      ...(isAmbiguousProviderOutcome(message) ? { requiresReconciliation: true } : {}),
    };
  }
}

/**
 * Remove temporary video artifacts only after every requested social target
 * has confirmed publication. Provider post IDs and the text/audit records stay.
 * Supabase originals are kept only until Cloudinary and Supabase cleanup succeed.
 */
async function syncKidsSocialPublicationToCatalog(
  item: SocialPublishQueueItem,
  queueMetadata: Record<string, unknown>,
): Promise<void> {
  if (!isVideoContentType(item.content_type) || !item.content_id) return;
  if (queueMetadata.audience !== "kids" || queueMetadata.kidsContentQaStatus !== "passed") return;

  const rawResults = queueMetadata.platformResults;
  const results = normalizeSocialPlatformResults(rawResults);
  const successfulPlatforms = item.target_platforms.filter((platform) => {
    const result = results[platform];
    if (!result || typeof result !== "object" || Array.isArray(result)) return false;
    const row = result as { ok?: unknown; remoteId?: unknown };
    return row.ok === true && typeof row.remoteId === "string" && row.remoteId.trim().length > 0;
  });
  if (successfulPlatforms.length === 0) return;

  try {
    const rows = await supabaseServerAdminRequest<Array<{
      id: string;
      metadata: Record<string, unknown> | null;
      updated_at: string | null;
    }>>(
      "/rest/v1/videos?metadata->>videoGenerationRequestId=eq." +
        encodeURIComponent(item.content_id) +
        "&metadata->>audience=eq.kids&select=id,metadata,updated_at&limit=2",
    );
    if (!Array.isArray(rows) || rows.length !== 1) {
      if (Array.isArray(rows) && rows.length > 1) {
        console.error("[social-publishing] Kids catalog reconciliation stopped: request maps to multiple video rows:", item.content_id);
      }
      return;
    }

    const row = rows[0];
    if (typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at))) {
      console.warn("[social-publishing] Kids catalog row has no valid updated_at; refusing an unversioned metadata update:", item.content_id);
      return;
    }
    const existing = row.metadata ?? {};
    if (
      existing.generator !== "zikr_internal_video_factory" ||
      existing.audience !== "kids" ||
      existing.kidsVideoQaStatus !== "passed"
    ) return;

    const allTargetsSucceeded = item.target_platforms.every((platform) => successfulPlatforms.includes(platform));
    const updatedAt = buildNextRowVersionUpdatedAt(row.updated_at);
    const nextMetadata = {
      ...existing,
      socialPublication: {
        status: allTargetsSucceeded ? "published" : "partial",
        platforms: successfulPlatforms,
        publishedAt: updatedAt,
      },
    };
    const query = "/rest/v1/videos?id=eq." + encodeURIComponent(row.id) +
      "&updated_at=eq." + encodeURIComponent(row.updated_at);
    const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(query, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ metadata: nextMetadata, updated_at: updatedAt }),
    });
    if (!updated?.length) {
      console.warn("[social-publishing] Kids catalog social status was not updated after a concurrent change:", item.content_id);
    }
  } catch (error) {
    console.error("[social-publishing] Kids social status sync failed:", item.content_id, error);
  }
}

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
      published: boolean | null;
      metadata: Record<string, unknown> | null;
      updated_at: string | null;
    }>>(
      "/rest/v1/videos?metadata->>videoGenerationRequestId=eq." +
        encodeURIComponent(item.content_id) +
        "&select=id,youtube_id,published,metadata,updated_at&limit=2",
    );
    if (!Array.isArray(rows) || rows.length !== 1) {
      if (Array.isArray(rows) && rows.length > 1) {
        console.error("[social-publishing] YouTube catalog reconciliation stopped: generation request maps to multiple video rows:", item.content_id);
      } else {
        console.warn("[social-publishing] YouTube upload succeeded but no matching public catalog record was found:", item.content_id);
      }
      return;
    }
    const row = rows[0];
    if (typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at))) {
      console.warn("[social-publishing] YouTube catalog row has no valid updated_at; refusing an unversioned catalog update:", item.content_id);
      return;
    }
    if (row.youtube_id && row.youtube_id !== youtubeId) {
      console.error("[social-publishing] YouTube catalog reconciliation stopped: existing YouTube ID differs from the confirmed platform result:", item.content_id);
      return;
    }
    const metadata = row.metadata ?? {};
    const updatedAt = buildNextRowVersionUpdatedAt(row.updated_at);
    const restorePurgedVideo = shouldRestorePurgedPublishedVideo(row);
    const previousMediaRecovery = metadata.mediaRecovery && typeof metadata.mediaRecovery === "object" && !Array.isArray(metadata.mediaRecovery)
      ? metadata.mediaRecovery as Record<string, unknown>
      : {};
    const nextMetadata = {
      ...metadata,
      youtubePublishedVideoId: youtubeId,
      youtubePublishedUrl: "https://www.youtube.com/watch?v=" + youtubeId,
      youtubePublishedAt: updatedAt,
      mediaFallbackAvailable: true,
      ...(restorePurgedVideo ? {
        mediaState: "youtube_fallback",
        mediaRecovery: {
          ...previousMediaRecovery,
          source: "confirmed_youtube_publish_remote_id",
          restoredAt: updatedAt,
          previousCloudinaryMasterRetired: true,
        },
      } : {}),
    };
    const query = "/rest/v1/videos?id=eq." + encodeURIComponent(row.id) +
      "&updated_at=eq." + encodeURIComponent(row.updated_at);
    const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(query, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        youtube_id: youtubeId,
        metadata: nextMetadata,
        ...(restorePurgedVideo ? {
          published: true,
          thumbnail_url: "https://i.ytimg.com/vi/" + youtubeId + "/hqdefault.jpg",
        } : {}),
        updated_at: updatedAt,
      }),
    });
    if (!updated?.length) {
      console.warn("[social-publishing] YouTube catalog pointer update was skipped after a concurrent catalog change:", item.content_id);
    } else if (restorePurgedVideo) {
      console.info("[social-publishing] Restored previously published video catalog from confirmed YouTube fallback:", item.content_id);
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
  // Re-read and compare the completed generation row so a concurrent render/admin
  // update cannot have its content metadata replaced by this retention marker.
  const requestRows = await supabaseServerAdminRequest<Array<{
    status: string;
    video_url: string | null;
    content: Record<string, unknown> | null;
    updated_at: string | null;
  }>>(
    "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(item.content_id) +
      "&select=status,video_url,content,updated_at&limit=2",
  );
  if (!Array.isArray(requestRows) || requestRows.length !== 1) return false;
  const request = requestRows[0];
  if (
    request.status !== "completed" ||
    request.video_url !== item.video_url ||
    typeof request.updated_at !== "string" ||
    !Number.isFinite(Date.parse(request.updated_at)) ||
    (request.content !== null && (typeof request.content !== "object" || Array.isArray(request.content)))
  ) {
    return false;
  }

  const existingContent = request.content ?? {};
  const existingEligibleAt = existingContent.stagingCleanupDeferred === true &&
    typeof existingContent.stagingCleanupEligibleAt === "string" &&
    Number.isFinite(Date.parse(existingContent.stagingCleanupEligibleAt))
    ? existingContent.stagingCleanupEligibleAt
    : null;
  // Start the grace period when every requested social target has confirmed
  // publication, not when an earlier partial attempt first succeeded. Retries
  // preserve the first confirmed deadline instead of extending it indefinitely.
  const fullyPublishedAt = new Date().toISOString();
  const stagingCleanupEligibleAt = existingEligibleAt ??
    getPublishedVideoStagingCleanupEligibleAt(fullyPublishedAt);
  const requestUpdatedAt = buildNextRowVersionUpdatedAt(request.updated_at);
  const updatedRequest = await supabaseServerAdminRequest<Array<{ id: string }>>(
    "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(item.content_id) +
      "&status=eq.completed&video_url=eq." + encodeURIComponent(item.video_url) +
      "&updated_at=eq." + encodeURIComponent(request.updated_at),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        content: { ...existingContent, stagingCleanupDeferred: true, stagingCleanupEligibleAt },
        updated_at: requestUpdatedAt,
      }),
    },
  );
  if (!Array.isArray(updatedRequest) || !updatedRequest[0]) return false;

  // Merge into the latest published queue metadata with an exact row-version
  // CAS; do not overwrite platform deletion or insights written concurrently.
  return patchSocialQueueMetadataWithCas({
    id: item.id,
    expectedStatus: "published",
    expectedVideoUrl: item.video_url,
    patch: {
      stagingCleanupDeferred: true,
      stagingCleanupEligibleAt,
      videoCleanupPending: false,
      videoCleanupErrors: [],
    },
  });
}
/**
 * Disabled after audit: the former reset path could delete the Cloudinary
 * playback master and Supabase staging copy without a complete cross-table
 * reference inventory or a queue-row lease. Staging cleanup must go through
 * the audited retention workflow; this helper intentionally performs no I/O.
 */
export async function resetQueuedSocialVideoMedia(
  _limit = 100,
): Promise<{ attempted: number; cleaned: number; pending: number }> {
  throw new Error(
    "Queued social media reset is disabled; use the audited storage-retention workflow after a complete reference and playback check.",
  );
}

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
      "/rest/v1/social_publish_queue?status=eq.published&video_url=not.is.null&" +
        PUBLISHED_VIDEO_CLEANUP_POSTGREST_FILTER + "&created_at=gte." +
        encodeURIComponent(cutoff.toISOString()) +
        "&order=updated_at.asc&limit=" + Math.max(1, Math.min(100, Math.floor(limit))),
    );
    for (const item of rows ?? []) {
      if (!isVideoContentType(item.content_type)) continue;
      if (!shouldRetryPublishedVideoCleanup(item.metadata)) continue;
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
  let claimUpdatedAt = "";
  if (options.alreadyClaimed) {
    if (item.status !== "processing" || !Number.isFinite(Date.parse(item.updated_at))) {
      return "deferred";
    }
    claimUpdatedAt = item.updated_at;
  } else {
    if (
      !["queued", "partial", "failed"].includes(item.status) ||
      !Number.isFinite(Date.parse(item.updated_at))
    ) {
      return "deferred";
    }
    const claimNow = new Date();
    const claimAt = claimNow.toISOString();
    claimUpdatedAt = buildNextRowVersionUpdatedAt(item.updated_at, claimNow);
    const claimed = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
      `/rest/v1/social_publish_queue?${buildDueSocialQueueClaimFilter(item.id, item.status, claimAt, item.updated_at)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ status: "processing", updated_at: claimUpdatedAt }),
      },
    );
    if (!Array.isArray(claimed) || !claimed[0] || !Number.isFinite(Date.parse(claimed[0].updated_at))) {
      return "deferred";
    }
    claimUpdatedAt = claimed[0].updated_at;
  }
  const claimLease = { status: "processing" as const, updatedAt: claimUpdatedAt };
  if (!(await hasVideoApprovalForQueueItem(item))) {
    const updated = await markQueueItem(item.id, "queued", {
      error_message: "Video held for automated qa check before public publishing.",
      metadata: { ...(item.metadata ?? {}), approvalBlocked: true },
    }, claimLease);
    return updated ? "approval_blocked" : "deferred";
  }

  const sourceApproval = await checkWrittenPostSourceApproval(item);
  const kidsWrittenPost = isKidsWrittenQueueItem(item);
  if (sourceApproval === "blocked") {
    const updated = await markQueueItem(item.id, "failed", {
      scheduled_at: null,
      error_message: kidsWrittenPost
        ? "Kids source is no longer published, active, and age-appropriate; publishing was held for review."
        : "Written article is no longer published; social publishing was held for review.",
      metadata: {
        ...(item.metadata ?? {}),
        ...(kidsWrittenPost
          ? { kidsSourceApprovalBlocked: true, kidsSourceApprovalPending: false }
          : { writtenArticlePublicationBlocked: true, writtenArticlePublicationPending: false }),
      },
    }, claimLease);
    return updated ? "approval_blocked" : "deferred";
  }
  if (sourceApproval === "unavailable") {
    const nextRetryAt = new Date(Date.now() + 15 * 60_000).toISOString();
    const updated = await markQueueItem(item.id, "queued", {
      scheduled_at: nextRetryAt,
      error_message: kidsWrittenPost
        ? "Kids source approval could not be verified; publishing remains on hold."
        : "Written article is not yet public or its publication state could not be verified; social publishing remains on hold.",
      metadata: {
        ...(item.metadata ?? {}),
        ...(kidsWrittenPost
          ? { kidsSourceApprovalPending: true }
          : { writtenArticlePublicationPending: true }),
        nextRetryAt,
      },
    }, claimLease);
    return updated ? "approval_blocked" : "deferred";
  }

  const platforms = item.target_platforms.filter(
    (platform): platform is SocialPlatform => platform === "facebook" || platform === "facebook_reels" || platform === "youtube",
  );
  if (platforms.length === 0) {
    const updated = await markQueueItem(item.id, "failed", { error_message: "No supported target platforms selected" }, claimLease);
    return updated ? "failed" : "deferred";
  }

  const enabledPlatforms = options.enabledPlatforms ?? getEnabledSocialPlatforms(process.env);
  const previous = normalizeSocialPlatformResults(item.metadata?.platformResults);
  const previousMetadata = clearRevalidatedSocialApprovalDeferrals(item.metadata, platforms);
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
      const updated = await markQueueItem(item.id, "published", { error_message: null, scheduled_at: null }, claimLease);
      if (!updated) return "deferred";
      await syncKidsSocialPublicationToCatalog(item, previousMetadata);
      if (isVideoContentType(item.content_type)) await disposePublishedVideo({ ...item, metadata: previousMetadata });
      return "published";
    }
    const manualReconciliationPlatforms = getManualReconciliationPlatforms(previousMetadata);
    if (unavailablePlatforms.length > 0) {
      const nextRetryAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const messages = [
        manualReconciliationPlatforms.length
          ? "Manual reconciliation required for uncertain provider outcome(s): " + manualReconciliationPlatforms.join(", ")
          : "",
        "Waiting for configured publishing channels: " + unavailablePlatforms.join(", "),
      ].filter(Boolean);
      await markQueueItem(item.id, "queued", {
        scheduled_at: nextRetryAt,
        error_message: messages.join("; "),
        metadata: { ...previousMetadata, unavailablePlatforms, nextRetryAt },
      }, claimLease);
      return "deferred";
    }
    if (manualReconciliationPlatforms.length > 0) {
      const hasPriorSuccess = platforms.some(platform => {
        const result = previous[platform] as PlatformResult | undefined;
        return result?.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0;
      });
      const updated = await markQueueItem(item.id, hasPriorSuccess ? "partial" : "failed", {
        scheduled_at: null,
        error_message: "Manual reconciliation required before retry: provider outcome is unknown for " + manualReconciliationPlatforms.join(", ") + ". Check the destination channel for an existing post first.",
        metadata: { ...previousMetadata, unavailablePlatforms: [] },
      }, claimLease);
      return updated ? "failed" : "deferred";
    }
    const blockedFacebook = platforms.some(platform => {
      const result = previous[platform] as PlatformResult | undefined;
      return result?.ok === false && platform.startsWith("facebook") && isAuthBlocked(platform, result.error);
    });
    const updated = await markQueueItem(item.id, platforms.some(platform => previous[platform] && (previous[platform] as PlatformResult).ok === true) ? "partial" : "failed", {
      error_message: "No eligible target remains; repair the platform connection or review the channel-specific failure.",
      scheduled_at: null,
      metadata: { ...previousMetadata, unavailablePlatforms: [] },
    }, claimLease);
    return updated ? (blockedFacebook ? "auth_blocked" : "failed") : "deferred";
  }

  const inFlightStartedAt = new Date().toISOString();
  const inFlightUpdatedAt = buildNextRowVersionUpdatedAt(claimLease.updatedAt);
  const inFlightMetadata = buildSocialPublishInFlightMetadata(
    previousMetadata,
    runnablePlatforms,
    inFlightStartedAt,
  );
  const inFlightClaim = await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
    `/rest/v1/social_publish_queue?${buildSocialPublishLeaseFilter(item.id, claimLease.status, claimLease.updatedAt)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ metadata: inFlightMetadata, updated_at: inFlightUpdatedAt }),
    },
  );
  if (!Array.isArray(inFlightClaim) || !inFlightClaim[0] || !Number.isFinite(Date.parse(inFlightClaim[0].updated_at))) {
    return "deferred";
  }
  const inFlightLease = {
    status: "processing" as const,
    updatedAt: inFlightClaim[0].updated_at,
  };

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
    isAuthBlocked(failure.platform, failure.error),
  );
  const hasNonAuthFailure = operationalFailures.some(failure => !isAuthBlocked(failure.platform, failure.error));
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
    return currentPlatformAttempts < maxAttempts &&
      !failure.requiresReconciliation &&
      !isAuthBlocked(failure.platform, failure.error) &&
      !isPermanentSocialFailure(failure.error);
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

  const authBlockedPlatforms = mergeAuthBlockedPlatforms(
    previousMetadata,
    platforms,
    runnablePlatforms,
    operationalFailures,
  );
  const permanentFailurePlatforms = operationalFailures
    .filter(failure => isPermanentSocialFailure(failure.error))
    .map(failure => failure.platform);
  const attemptCompletedAt = new Date().toISOString();
  const completedMetadata = clearSocialPublishInFlightMetadata(
    previousMetadata,
    runnablePlatforms,
    inFlightStartedAt,
    attemptCompletedAt,
  );
  const publishMetadata = {
    ...completedMetadata,
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

  const errorMessages = operationalFailures.map(failure =>
    `${failure.platform}: ${failure.error ?? "unknown error"}` +
      (failure.requiresReconciliation ? " (remote outcome unknown; manual reconciliation required before retry)" : ""),
  );
  if (unavailablePlatforms.length) errorMessages.push("Waiting for channel configuration: " + unavailablePlatforms.join(", "));
  if (approvalDeferredPlatforms.length) errorMessages.push("Approval revalidation held publishing for: " + approvalDeferredPlatforms.join(", "));
  const finalized = await markQueueItem(item.id, persistedStatus, {
    scheduled_at: nextRetryAt,
    published_at: successes.length > 0 ? new Date().toISOString() : null,
    error_message: errorMessages.join("; ") || null,
    metadata: publishMetadata,
  }, inFlightLease);
  if (!finalized) {
    console.warn("[social-publishing] Provider result arrived after the worker lease was recovered; preserving the newer queue state:", item.id);
    return "deferred";
  }

  // Persist the confirmed YouTube video ID to the public catalog even when
  // another requested target is deferred; this provides a resilient playback fallback.
  await syncYouTubeVideoReferenceToCatalog(item, mergedResults.youtube);
  await syncKidsSocialPublicationToCatalog(item, publishMetadata);

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