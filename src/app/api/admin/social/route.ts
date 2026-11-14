import { NextRequest, NextResponse } from "next/server";
import { readBoundedJsonBody } from "@/lib/request/bounded-json-body";
import { requireAdminApi } from "@/features/admin/services/admin";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";
import { dispatchSocialWorkerSafely } from "@/features/social/services/social-worker-dispatch";
import {
  adoptServerConfiguredFacebookPageToken,
  getFacebookPageConnectionHealth,
  unblockFacebookAuthBlockedQueue,
} from "@/features/social/services/facebook-credentials";
import { getYouTubePublishingConnectionHealth } from "@/features/social/services/youtube-publishing-health";
import { getYouTubeUploadRefreshToken } from "@/features/social/services/youtube-oauth-credentials";
import { unblockYouTubeAuthBlockedQueue } from "@/features/social/services/youtube-queue-recovery";
import { getFacebookPageAudienceSnapshot } from "@/features/social/services/facebook-reels-insights";
import { getTrafficRevenueSnapshot } from "@/features/admin/services/traffic-revenue";
import { inspectVideoQueueItemApproval, isVideoContentType, type VideoPublishRequestSnapshot } from "@/features/videos/services/video-publish-approval";
import { deleteSocialPlatformPost, type SocialDeletionPlatform } from "@/features/social/services/social-deletion";
import { claimSocialQueuePlatformDeletion, patchSocialQueueMetadataWithCas } from "@/features/social/services/social-queue-metadata";
import { isSocialPlatformDeletionCurrent } from "@/features/social/services/social-deletion-visibility";
import { LOCAL_SOCIAL_QUEUE_DELETE_BATCH_LIMIT, getEnabledSocialPlatforms, getLocalSocialQueueDeletionBlockers, getManualReconciliationPlatforms, getRetryableSocialPlatforms, isAuthBlocked, normalizeSocialPlatformResults, parseRequestedSocialPlatforms, type SocialPlatform } from "@/features/social/services/platform-availability";

export const dynamic = "force-dynamic";


type SocialAuditEvent = Parameters<typeof recordAdminAuditEvent>[0];

async function recordSocialAuditEvent(event: SocialAuditEvent): Promise<boolean> {
  try {
    await recordAdminAuditEvent(event);
    return true;
  } catch (error) {
    // The queue/provider operation may already be committed. Never return a
    // generic 500 that invites the administrator to repeat a publish/delete.
    console.error("[api/admin/social] audit event failed after action:", error);
    return false;
  }
}

type SocialPostInsightRow = {
  queue_id: string;
  platform: "youtube" | "facebook" | "facebook_reels";
  video_id: string | null;
  metrics: Record<string, unknown> | null;
  captured_at: string;
  source: string;
  scope: string;
  period: string | null;
  status: string | null;
};

type QueueItem = {
  id: string;
  content_type: string;
  content_id: string | null;
  title: string;
  target_platforms: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at?: string | null;
  video_url: string | null;
  metadata?: Record<string, unknown> | null;
  videoApproval?: { approved: boolean; reason: string | null; missingChecks: string[]; approvalStatus: string | null };
};

const retryableStatuses = new Set(["failed", "partial"]);

function successfulPlatforms(
  metadata: Record<string, unknown> | null | undefined
): Set<string> {
  const values = metadata?.platformResults;
  const result = new Set<string>();

  if (values && typeof values === "object" && !Array.isArray(values)) {
    for (const [platform, value] of Object.entries(values)) {
      if (!value || typeof value !== "object") continue;
      const row = value as {
        platform?: unknown;
        ok?: unknown;
        remoteId?: unknown;
      };
      if (
        row.ok === true &&
        typeof row.remoteId === "string" &&
        row.remoteId.length > 0 &&
        (row.platform === undefined || row.platform === platform)
      ) {
        result.add(platform);
      }
    }
    return result;
  }

  if (Array.isArray(values)) {
    for (const value of values) {
      if (!value || typeof value !== "object") continue;
      const row = value as {
        platform?: unknown;
        ok?: unknown;
        remoteId?: unknown;
      };
      if (
        row.ok === true &&
        typeof row.platform === "string" &&
        typeof row.remoteId === "string" &&
        row.remoteId.length > 0
      ) {
        result.add(row.platform);
      }
    }
  }

  return result;
}

function authBlockedPlatforms(
  metadata: Record<string, unknown> | null | undefined,
  targets: readonly string[] = [],
): Set<string> {
  const result = new Set<string>();
  const supported = new Set(["facebook", "facebook_reels", "youtube"]);
  const declared = Array.isArray(metadata?.authBlockedPlatforms)
    ? metadata.authBlockedPlatforms.filter(
        (platform): platform is string =>
          typeof platform === "string" && supported.has(platform),
      )
    : [];
  for (const platform of declared) result.add(platform);

  const values = normalizeSocialPlatformResults(metadata?.platformResults);
  for (const [platform, value] of Object.entries(values)) {
    if (!supported.has(platform) || !value || typeof value !== "object") continue;
    const row = value as { ok?: unknown; error?: unknown };
    if (row.ok === false && isAuthBlocked(platform as SocialPlatform, row.error)) {
      result.add(platform);
    }
  }

  // The legacy global auth flag was emitted by the Facebook adapter only.
  // Never infer a YouTube block from that old global marker.
  if (metadata?.authBlocked === true && declared.length === 0 && result.size === 0) {
    for (const platform of targets) {
      if (platform.startsWith("facebook")) result.add(platform);
    }
  }
  return result;
}

function retryPlatforms(item: QueueItem, allowAmbiguous = false): SocialPlatform[] {
  return getRetryableSocialPlatforms(item.target_platforms, item.metadata, allowAmbiguous);
}

function isSocialDeletionPlatform(platform: string): platform is SocialDeletionPlatform {
  return platform === "youtube" || platform === "facebook" || platform === "facebook_reels";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function attachVideoApprovalDiagnostics(items: QueueItem[]): Promise<QueueItem[]> {
  const videos = items.filter(item => isVideoContentType(item.content_type));
  const contentIds = [...new Set(videos.map(item => item.content_id).filter((id): id is string => Boolean(id)))];
  const requests = contentIds.length
    ? await supabaseServerAdminRequest<Array<VideoPublishRequestSnapshot & { id: string }>>(
        "/rest/v1/video_generation_requests?id=in.(" +
          contentIds.map(id => encodeURIComponent(id)).join(",") +
          ")&select=id,status,category,video_url,source_hash,content_hash,template_version,content",
      )
    : [];
  const byId = new Map((requests ?? []).map(request => [request.id, request]));
  return items.map(item => {
    if (!isVideoContentType(item.content_type)) return item;
    const diagnostics = inspectVideoQueueItemApproval({
      contentType: item.content_type,
      contentId: item.content_id,
      queuedVideoUrl: item.video_url,
      request: item.content_id ? byId.get(item.content_id) ?? null : null,
    });
    return { ...item, videoApproval: diagnostics };
  });
}

function deliveryForPlatform(metadata: Record<string, unknown> | null | undefined, platform: string): Record<string, unknown> | null {
  const results = metadata?.platformResults;
  if (Array.isArray(results)) {
    const item = results.find(value => {
      const row = asRecord(value);
      return row?.platform === platform;
    });
    return asRecord(item);
  }
  return asRecord(asRecord(results)?.[platform]);
}

async function deleteSafeLocalSocialQueueRows(items: QueueItem[]) {
  const result = {
    deleted: 0,
    preserved: 0,
    stale: 0,
    uncertain: 0,
    blocked: [] as Array<{ id: string; title: string; reason: string }>,
  };

  for (const item of items) {
    const blockers = getLocalSocialQueueDeletionBlockers(item);
    if (blockers.length > 0) {
      result.preserved += 1;
      result.blocked.push({
        id: item.id,
        title: item.title,
        reason: blockers.includes("status_not_fully_failed")
          ? "حالة النشر جزئية أو لم تعد فشلًا خالصًا؛ تم الاحتفاظ بسجل النشر."
          : "توجد نتيجة منصة ناجحة أو غير مؤكدة أو بيانات منصة ناقصة؛ تم الاحتفاظ بسجل النشر.",
      });
      continue;
    }

    const expectedUpdatedAt = item.updated_at?.trim();
    if (!expectedUpdatedAt) {
      result.preserved += 1;
      result.blocked.push({
        id: item.id,
        title: item.title,
        reason: "إصدار سجل الطابور غير متاح؛ تم الاحتفاظ به بدل الحذف.",
      });
      continue;
    }

    try {
      const deleted = await supabaseServerAdminRequest<Array<{ id: string }>>(
        "/rest/v1/social_publish_queue?id=eq." + encodeURIComponent(item.id) +
          "&status=eq.failed&updated_at=eq." + encodeURIComponent(expectedUpdatedAt) +
          "&select=id",
        {
          method: "DELETE",
          headers: { Prefer: "return=representation" },
        },
      );
      if (Array.isArray(deleted) && deleted.some((row) => row.id === item.id)) {
        result.deleted += 1;
      } else {
        result.stale += 1;
      }
    } catch (error) {
      // The remote result must remain recoverable if a local delete response is ambiguous.
      result.uncertain += 1;
      result.blocked.push({
        id: item.id,
        title: item.title,
        reason: "تعذر تأكيد نتيجة حذف السجل المحلي؛ لا تعاود الحذف قبل تحديث الطابور.",
      });
      console.error("[api/admin/social] local queue deletion result is uncertain:", error);
    }
  }

  return result;
}

async function triggerSocialWorker() {
  return dispatchGitHubWorkflow("publish-social.yml", {
    operation: "publish_queue",
  });
}

async function dispatchQueuedSocialWorker() {
  const outcome = await dispatchSocialWorkerSafely(triggerSocialWorker);
  if (!outcome.workerDispatched) {
    console.error(
      "[api/admin/social] queue state committed but immediate worker dispatch failed; scheduled workflow is configured as fallback; enabled state must be verified:",
      outcome.error,
    );
  }
  return { worker: outcome.worker, workerDispatched: outcome.workerDispatched };
}

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const publishAfter = new Date(process.env.SOCIAL_PUBLISH_AFTER ?? "2026-11-06T20:00:00Z");
    if (!Number.isFinite(publishAfter.getTime())) {
      return NextResponse.json({ error: "إعداد cutoff للنشر الاجتماعي غير صالح." }, { status: 503 });
    }
    const queueCutoff = encodeURIComponent(publishAfter.toISOString());
    const fetchedItems = await supabaseServerAdminRequest<QueueItem[]>(
      "/rest/v1/social_publish_queue?created_at=gte." + queueCutoff +
        "&select=id,content_type,content_id,title,video_url,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata&order=created_at.desc&limit=200"
    );
    const queueRows = fetchedItems ?? [];
    // Insights live in a private table so queue cleanup cannot erase analytics history.
    const insightsSince = encodeURIComponent(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    const insightRows = await supabaseServerAdminRequest<SocialPostInsightRow[]>(
      "/rest/v1/social_post_insights?captured_at=gte." + insightsSince +
        "&select=queue_id,platform,video_id,metrics,captured_at,source,scope,period,status&order=captured_at.desc&limit=500",
    ).catch((error) => {
      console.warn("[api/admin/social] post insights unavailable:", error instanceof Error ? error.message : "unknown error");
      return [];
    });
    const insightsByQueueId = new Map<string, Record<string, unknown>>();
    for (const insight of insightRows ?? []) {
      const platformKey = insight.platform === "facebook_reels" ? "facebookReels" : insight.platform;
      const value = insight.platform === "youtube"
        ? { ...(insight.metrics ?? {}), videoId: insight.video_id, capturedAt: insight.captured_at, source: insight.source, scope: insight.scope }
        : { videoId: insight.video_id, metrics: insight.metrics ?? {}, capturedAt: insight.captured_at, source: insight.source, scope: insight.scope, period: insight.period, status: insight.status };
      const current = insightsByQueueId.get(insight.queue_id) ?? {};
      current[platformKey] = value;
      insightsByQueueId.set(insight.queue_id, current);
    }
    const rows = await attachVideoApprovalDiagnostics(queueRows.map((item): QueueItem => {
      const stored = item.metadata?.platformInsights;
      const storedInsights = stored && typeof stored === "object" && !Array.isArray(stored)
        ? stored as Record<string, unknown>
        : {};
      return {
        ...item,
        metadata: {
          ...(item.metadata ?? {}),
          platformInsights: { ...storedInsights, ...(insightsByQueueId.get(item.id) ?? {}) },
        },
      };
    }));
    const approvalPending = rows.filter(item =>
      isVideoContentType(item.content_type) && item.videoApproval?.approved !== true &&
      (item.status === "queued" || item.status === "partial" || item.status === "failed")
    ).length;
    const queuedEligible = rows.filter(item =>
      (item.status === "queued" || item.status === "partial" || item.status === "failed") &&
      (!isVideoContentType(item.content_type) || item.videoApproval?.approved === true)
    ).length;
    const counts = rows.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    const env = getServerEnv();
    const autoPublishSettings = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
      "/rest/v1/admin_settings?key=eq.video_automation_auto_publish&select=key,value&limit=1",
    ).catch(() => []);
    const autoPublishValue = autoPublishSettings?.[0]?.value;
    const socialPublishingEnabled = autoPublishValue === true || autoPublishValue === "true";
    const [facebookHealth, facebookAudience, youtubeHealth, trafficSnapshot] = await Promise.all([
      getFacebookPageConnectionHealth(), getFacebookPageAudienceSnapshot(), getYouTubePublishingConnectionHealth(), getTrafficRevenueSnapshot(),
    ]);
    const youtubeUploadRefreshToken = await getYouTubeUploadRefreshToken().catch(() => null);
    const youtubeUploadReady = Boolean(youtubeUploadRefreshToken) &&
      youtubeHealth.status === "connected" &&
      getEnabledSocialPlatforms(env).includes("youtube");
    const facebookAuthBlocked = rows.filter(
      item =>
        retryableStatuses.has(item.status) &&
        [...authBlockedPlatforms(item.metadata, item.target_platforms)].some(platform => platform.startsWith("facebook"))
    ).length;
    const youtubeAuthBlocked = rows.filter(
      item =>
        retryableStatuses.has(item.status) &&
        authBlockedPlatforms(item.metadata, item.target_platforms).has("youtube")
    ).length;
    const platformStats = rows.reduce<
      Record<string, { queued: number; published: number; failed: number }>
    >((acc, item) => {
      for (const platform of item.target_platforms) {
        acc[platform] ??= { queued: 0, published: 0, failed: 0 };
        const ledger = item.metadata?.platformResults;
        const raw = ledger && typeof ledger === "object" && !Array.isArray(ledger)
          ? (ledger as Record<string, unknown>)[platform]
          : null;
        const result = raw && typeof raw === "object" && !Array.isArray(raw)
          ? raw as { ok?: unknown; remoteId?: unknown }
          : null;
        const isDelivered = result?.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0;
        const unavailable = Array.isArray(item.metadata?.unavailablePlatforms) && item.metadata?.unavailablePlatforms.includes(platform);
        const approvalDeferred = Array.isArray(item.metadata?.approvalDeferredPlatforms) && item.metadata?.approvalDeferredPlatforms.includes(platform);
        if (isDelivered || (!result && item.status === "published")) acc[platform].published += 1;
        else if (unavailable || approvalDeferred || !result) {
          if (item.status === "failed" && !unavailable && !approvalDeferred) acc[platform].failed += 1;
          else acc[platform].queued += 1;
        } else if (result.ok === false) acc[platform].failed += 1;
        else acc[platform].queued += 1;
      }
      return acc;
    }, {});
    const numberValue = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
    const add = (target: Record<string, number>, key: string, value: unknown) => { const count = numberValue(value); if (count !== null) target[key] = (target[key] ?? 0) + count; };
    const publishedPosts = rows.filter(item => item.published_at && (item.status === "published" || successfulPlatforms(item.metadata).size > 0));
    const platformAnalytics = { youtube: { posts: 0, views: 0, likes: 0, comments: 0, shares: 0 }, facebook: { posts: 0, views: 0, likes: 0, comments: 0, shares: 0 }, facebook_reels: { posts: 0, views: 0, likes: 0, comments: 0, shares: 0 } };
    const recentPosts = publishedPosts.flatMap(item => {
      const insights = item.metadata?.platformInsights && typeof item.metadata.platformInsights === "object" && !Array.isArray(item.metadata.platformInsights) ? item.metadata.platformInsights as Record<string, unknown> : {};
      const results = item.metadata?.platformResults && typeof item.metadata.platformResults === "object" && !Array.isArray(item.metadata.platformResults) ? item.metadata.platformResults as Record<string, unknown> : {};
      return item.target_platforms.flatMap(platform => {
        const delivery = results[platform] && typeof results[platform] === "object" ? results[platform] as Record<string, unknown> : {};
        const delivered = delivery.ok === true && typeof delivery.remoteId === "string" && delivery.remoteId.trim().length > 0;
        if (!delivered && !(item.status === "published" && Object.keys(results).length === 0)) return [];
        const raw = insights[platform === "facebook_reels" ? "facebookReels" : platform];
        const metric = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
        const nested = metric.metrics && typeof metric.metrics === "object" && !Array.isArray(metric.metrics) ? metric.metrics as Record<string, unknown> : metric;
        const actions = nested.post_video_social_actions && typeof nested.post_video_social_actions === "object" ? nested.post_video_social_actions as Record<string, unknown> : {};
        const reactions = nested.post_video_likes_by_reaction_type && typeof nested.post_video_likes_by_reaction_type === "object" ? nested.post_video_likes_by_reaction_type as Record<string, unknown> : {};
        const likes = numberValue(nested.likes) ?? Object.values(reactions).reduce<number>((sum,value) => sum + (numberValue(value) ?? 0),0);
        const views = numberValue(nested.views) ?? numberValue(nested.fb_reels_total_plays) ?? numberValue(nested.blue_reels_play_count);
        const comments = numberValue(nested.comments) ?? numberValue(actions.comments);
        const shares = numberValue(nested.shares) ?? numberValue(actions.shares);
        const bucket = platformAnalytics[platform as keyof typeof platformAnalytics];
        if (!bucket) return [];
        bucket.posts += 1; add(bucket,"views",views); add(bucket,"likes",likes); add(bucket,"comments",comments); add(bucket,"shares",shares);
        return [{ id:item.id,title:item.title,contentType:item.content_type,platform,publishedAt:item.published_at ?? item.created_at,remoteId:typeof delivery.remoteId==="string"?delivery.remoteId:null,url:typeof delivery.url==="string"?delivery.url:null,views,likes,comments,shares,metricsCapturedAt:typeof metric.capturedAt==="string"?metric.capturedAt:null,metricsStatus:typeof metric.status==="string"?metric.status:(Object.keys(metric).length?"available":"awaiting_sync") }];
      });
    }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,100);
    const youtubeAnalytics = trafficSnapshot.youtubeAnalytics;
    const socialAnalytics = { platform:platformAnalytics, audience: { youtube:{status:youtubeHealth.status,channelName:youtubeHealth.channelName,subscribers:youtubeHealth.subscribers,totalViews:youtubeHealth.totalViews,videoCount:youtubeHealth.videoCount,subscribersGained:youtubeAnalytics.subscribersGained,subscribersLost:youtubeAnalytics.subscribersLost,views28d:youtubeAnalytics.views,likes28d:youtubeAnalytics.likes,comments28d:youtubeAnalytics.comments,shares28d:youtubeAnalytics.shares,watchMinutes28d:youtubeAnalytics.estimatedMinutesWatched}, facebook:{status:facebookAudience.status,pageName:facebookAudience.pageName,followers:facebookAudience.followers,pageLikes:facebookAudience.likes} }, posts:recentPosts,capturedAt:new Date().toISOString() };
    const oldestQueuedAt =
      rows
        .filter(
          item => item.status === "queued" || item.status === "processing"
        )
        .map(item => item.scheduled_at ?? item.created_at)
        .sort()[0] ?? null;
    return NextResponse.json(
      {
        items: rows,
        counts,
        readiness: { approvalPending, queuedEligible },
        platformStats,
        socialAnalytics,
        oldestQueuedAt,
        health: {
          youtubeConfigured: Boolean(
            (env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && youtubeHealth.status !== "not_configured") ||
            (env.YOUTUBE_API_KEY && env.YOUTUBE_CHANNEL_ID)
          ),
          youtubeUploadReady,
          youtubeAuthBlocked,
          youtubeConnectionStatus: youtubeHealth.status,
          youtubeReadSource: youtubeHealth.readSource,
          youtubeConnectionMessage: youtubeHealth.message,
          youtubeChannelId: youtubeHealth.channelId,
          youtubeChannelName: youtubeHealth.channelName,
          youtubeSubscribers: youtubeHealth.subscribers,
          youtubeTotalViews: youtubeHealth.totalViews,
          youtubeVideoCount: youtubeHealth.videoCount,
          youtubeLastCheckedAt: youtubeHealth.checkedAt,
          ...facebookHealth,
          facebookAuthBlocked,
        },
        automation: {
          enabled: socialPublishingEnabled,
          provider: "GitHub Actions",
          trigger: "after_video_or_written_content_or_15m_schedule_or_manual",
          approvalRequired: true,
          note: socialPublishingEnabled
            ? "يعمل العامل بعد نجاح توليد الفيديو أو المحتوى المكتوب، وكذلك كل 15 دقيقة أو عند التشغيل اليدوي من الفرع الرئيسي. لا يُنشر أي فيديو قبل اجتياز موافقة الجودة."
            : "النشر متوقف؛ لا يتم تشغيل العامل ما لم تُفعّل صلاحيات القنوات وإعداد النشر.",
        },
      },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("[api/admin/social] GET:", error);
    return NextResponse.json(
      { error: "تعذر تحميل مركز النشر." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const parsedBody = await readBoundedJsonBody(request);
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
    }
    if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const body = parsedBody.value as {
      action?: unknown;
      ids?: unknown;
      platforms?: unknown;
      confirmedNoRemotePublication?: unknown;
      deleteLocalMemory?: unknown;
      confirmed?: unknown;
      platform?: unknown;
    };
    const action = typeof body.action === "string" ? body.action : "";
    if (action === "delete" || action === "delete_failed") {
      const stepUp = await requireAdminStepUpApi("social.manage", "/admin/social");
      if (!stepUp.ok) {
        return NextResponse.json(
          { error: stepUp.error, nextPath: "nextPath" in stepUp ? stepUp.nextPath : undefined },
          { status: stepUp.status, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
    const confirmedNoRemotePublication = body.confirmedNoRemotePublication === true;
    if (["retry", "retry_all_failed", "run_worker", "publish_now", "delete_published", "adopt_server_facebook_token", "release_auth_blocked_queue"].includes(action)) {
      const executionAuth = await requireAdminStepUpApi("social.publish", "/admin/social");
      if (!executionAuth.ok) {
        return NextResponse.json(
          { error: executionAuth.error, nextPath: "nextPath" in executionAuth ? executionAuth.nextPath : undefined },
          { status: executionAuth.status, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
    const ids = Array.isArray(body.ids)
      ? [
          ...new Set(
            body.ids.filter(
              (id): id is string => typeof id === "string" && id.length > 0
            )
          ),
        ]
      : [];
    const parsedPlatforms = parseRequestedSocialPlatforms(body.platforms);
    if (!parsedPlatforms.ok) {
      return NextResponse.json({ error: "قائمة المنصات غير صالحة؛ لم يتم تنفيذ أي إجراء." }, { status: 400 });
    }
    const requestedPlatforms = parsedPlatforms.platforms;
    if (action === "test_facebook") {
      const health = await getFacebookPageConnectionHealth();
      return NextResponse.json({ ok: true, health }, { headers: { "Cache-Control": "no-store" } });
    }    if (action === "test_youtube") {
      const health = await getYouTubePublishingConnectionHealth();
      const auditRecorded = await recordSocialAuditEvent({
        action: "social.youtube.connection_test",
        permission: "social.manage",
        resourceType: "youtube_channel",
        metadata: { status: health.status, channelId: health.channelId, readSource: health.readSource },
      });
      return NextResponse.json({ ok: true, health, auditRecorded }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "adopt_server_facebook_token") {
      // No token is accepted from the browser. Validate and store the server-only Vercel value;
      // queue recovery remains a separate explicit action with confirmation and MFA.
      const adopted = await adoptServerConfiguredFacebookPageToken();
      const health = await getFacebookPageConnectionHealth();
      const auditRecorded = await recordSocialAuditEvent({
        action: "social.facebook.token_adopt",
        permission: "social.publish",
        resourceType: "facebook_page",
        resourceId: adopted.pageId,
        metadata: {
          pageName: adopted.pageName,
          queueRecoveryRequiresExplicitPublishStepUp: true,
        },
      });
      return NextResponse.json({
        ok: true,
        adopted: true,
        pageName: adopted.pageName,
        health,
        auditRecorded,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "release_auth_blocked_queue") {
      if (body.confirmed !== true) {
        return NextResponse.json(
          { error: "explicit_confirmation_required" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const recoveryPlatform = body.platform === undefined ? "facebook" : body.platform;
      if (recoveryPlatform !== "facebook" && recoveryPlatform !== "youtube") {
        return NextResponse.json(
          { error: "invalid_recovery_platform" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }

      if (recoveryPlatform === "youtube") {
        const env = getServerEnv();
        if (!getEnabledSocialPlatforms(env).includes("youtube")) {
          return NextResponse.json(
            { error: "youtube_publishing_disabled" },
            { status: 409, headers: { "Cache-Control": "no-store" } },
          );
        }
        const [health, uploadRefreshToken] = await Promise.all([
          getYouTubePublishingConnectionHealth(),
          getYouTubeUploadRefreshToken().catch(() => null),
        ]);
        if (!uploadRefreshToken || health.status !== "connected") {
          return NextResponse.json(
            { error: "youtube_upload_connection_not_ready", health },
            { status: 409, headers: { "Cache-Control": "no-store" } },
          );
        }

        let released = 0;
        let queueUpdateFailed = false;
        try {
          released = await unblockYouTubeAuthBlockedQueue();
        } catch {
          queueUpdateFailed = true;
        }

        let workerDispatched = false;
        if (released > 0) {
          try {
            await triggerSocialWorker();
            workerDispatched = true;
          } catch (error) {
            console.error("[api/admin/social] released YouTube queue rows were saved but immediate worker dispatch failed:", error);
          }
        }

        const auditRecorded = await recordSocialAuditEvent({
          action: "social.youtube.auth_blocked_queue.release",
          permission: "social.publish",
          resourceType: "social_publish_queue",
          metadata: { released, queueUpdateFailed, workerDispatched, channelId: health.channelId },
        });
        if (queueUpdateFailed) {
          return NextResponse.json({
            ok: false,
            error: "queue_update_unconfirmed",
            released,
            queueUpdateFailed: true,
            workerDispatched,
            workerDispatchFailed: false,
            health,
            auditRecorded,
          }, { status: 503, headers: { "Cache-Control": "no-store" } });
        }
        return NextResponse.json({
          ok: true,
          released,
          queueUpdateFailed: false,
          workerDispatched,
          workerDispatchFailed: released > 0 && !workerDispatched,
          health,
          auditRecorded,
        }, { headers: { "Cache-Control": "no-store" } });
      }

      const health = await getFacebookPageConnectionHealth();
      if (health.facebookConnectionStatus !== "connected" || health.facebookEnabled !== true) {
        return NextResponse.json(
          { error: "facebook_connection_not_ready" },
          { status: 409, headers: { "Cache-Control": "no-store" } },
        );
      }

      let released = 0;
      let queueUpdateFailed = false;
      try {
        released = await unblockFacebookAuthBlockedQueue();
      } catch {
        queueUpdateFailed = true;
      }

      let workerDispatched = false;
      if (released > 0) {
        try {
          await triggerSocialWorker();
          workerDispatched = true;
        } catch (error) {
          console.error("[api/admin/social] released queue rows were saved but immediate worker dispatch failed:", error);
        }
      }

      const auditRecorded = await recordSocialAuditEvent({
        action: "social.facebook.auth_blocked_queue.release",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { released, queueUpdateFailed, workerDispatched, pageName: health.facebookPageName },
      });
      if (queueUpdateFailed) {
        return NextResponse.json({
          ok: false,
          error: "queue_update_unconfirmed",
          released,
          queueUpdateFailed: true,
          workerDispatched,
          workerDispatchFailed: false,
          health,
          auditRecorded,
        }, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
      return NextResponse.json({
        ok: true,
        released,
        queueUpdateFailed: false,
        workerDispatched,
        workerDispatchFailed: released > 0 && !workerDispatched,
        health,
        auditRecorded,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "run_worker") {
      const worker = await triggerSocialWorker();
      const auditRecorded = await recordSocialAuditEvent({
        action: "social.worker.run",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { workerDispatched: true },
      });
      return NextResponse.json({ ok: true, worker, auditRecorded });
    }
    if (
      !["retry", "retry_all_failed", "delete", "delete_failed", "publish_now", "delete_published", "release_auth_blocked_queue"].includes(action)
    )
      return NextResponse.json({ error: "إجراء غير صالح." }, { status: 400 });
    if (["delete", "delete_failed"].includes(action) && ids.length > LOCAL_SOCIAL_QUEUE_DELETE_BATCH_LIMIT) {
      return NextResponse.json({ error: "يمكن حذف 50 سجلًا آمنًا كحد أقصى في الدفعة الواحدة." }, { status: 400 });
    }
    if (ids.length > 200) {
      return NextResponse.json({ error: "يمكن تنفيذ الإجراء على 200 عنصر كحد أقصى في المرة الواحدة." }, { status: 400 });
    }
    if (["retry", "retry_all_failed", "delete", "delete_failed", "publish_now", "delete_published"].includes(action) && ids.length === 0)
      return NextResponse.json(
        { error: "حدد عملية فاشلة أولًا." },
        { status: 400 }
      );

    const retryItems = async (filter: string, includeQueued = false, allowAmbiguous = false) => {
      const items = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?${filter}&select=id,target_platforms,metadata,status,updated_at`
      );
      let affected = 0;
      let manualReconciliationSkipped = 0;
      let sourceMediaMissingSkipped = 0;
      let staleSkipped = 0;
      for (const item of items ?? []) {
        const expectedUpdatedAt = item.updated_at?.trim();
        if (!expectedUpdatedAt) {
          staleSkipped += 1;
          continue;
        }
        if (item.metadata?.sourceMediaMissing === true) {
          sourceMediaMissingSkipped += 1;
          continue;
        }
        if (!retryableStatuses.has(item.status) && !(includeQueued && item.status === "queued")) continue;
        const manualPlatforms = getManualReconciliationPlatforms(item.metadata);
        if (!allowAmbiguous && manualPlatforms.some(platform => requestedPlatforms.length === 0 || requestedPlatforms.includes(platform))) {
          manualReconciliationSkipped += 1;
        }
        const retryMetadata = {
          ...(item.metadata ?? {}),
          writtenArticlePublicationBlocked: false,
          writtenArticlePublicationPending: false,
          kidsSourceApprovalBlocked: false,
          kidsSourceApprovalPending: false,
        };
        const eligiblePlatforms = retryPlatforms(
          { ...item, metadata: retryMetadata },
          allowAmbiguous,
        );
        const platforms = requestedPlatforms.length > 0
          ? eligiblePlatforms.filter(platform => requestedPlatforms.includes(platform))
          : eligiblePlatforms;
        if (platforms.length === 0) {
          // A retry is complete only when every requested platform has a recorded
          // successful remote ID. A Facebook auth-block must not be hidden just
          // because another platform (for example YouTube) succeeded.
          const targets = item.target_platforms ?? [];
          const succeeded = successfulPlatforms(item.metadata);
          const allTargetsSucceeded =
            targets.length > 0 && targets.every(platform => succeeded.has(platform));
          if (allTargetsSucceeded) {
            const now = new Date();
            const nowIso = now.toISOString();
            const updatedAt = buildNextRowVersionUpdatedAt(expectedUpdatedAt, now);
            const updated = await supabaseServerAdminRequest<QueueItem[]>(
              `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.${encodeURIComponent(item.status)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify({
                  status: "published",
                  error_message: null,
                  published_at: nowIso,
                  updated_at: updatedAt,
                }),
              }
            );
            if (Array.isArray(updated) && updated[0]) affected += 1;
            else staleSkipped += 1;
          }
          // Leave partial/failed records unchanged if any target is still blocked.
          continue;
        }
        const platformSelection = new Set<string>(platforms);
        const previousManualReconciliationPlatforms = Array.isArray(item.metadata?.manualReconciliationPlatforms)
          ? item.metadata.manualReconciliationPlatforms.filter(
              (platform): platform is string => typeof platform === "string",
            )
          : [];
        const remainingManualReconciliationPlatforms = previousManualReconciliationPlatforms.filter(
          platform => !platformSelection.has(platform),
        );
        const previousResults = normalizeSocialPlatformResults(item.metadata?.platformResults);
        const nextPlatformResults = Object.fromEntries(
          Object.entries(previousResults).filter(([platform]) => !platformSelection.has(platform)),
        );
        const remainingAuthBlockedPlatforms = [...authBlockedPlatforms(item.metadata, item.target_platforms)]
          .filter(platform => !platformSelection.has(platform));
        const declaredPermanentFailures = Array.isArray(item.metadata?.permanentFailurePlatforms)
          ? item.metadata.permanentFailurePlatforms.filter((platform): platform is string => typeof platform === "string")
          : [];
        const remainingPermanentFailurePlatforms = declaredPermanentFailures.filter(
          platform => !platformSelection.has(platform),
        );
        const remainingUnavailablePlatforms = Array.isArray(item.metadata?.unavailablePlatforms)
          ? item.metadata.unavailablePlatforms.filter(
              (platform): platform is string => typeof platform === "string" && !platformSelection.has(platform),
            )
          : [];
        const preservedApprovalDeferredPlatforms = Array.isArray(item.metadata?.approvalDeferredPlatforms)
          ? item.metadata.approvalDeferredPlatforms.filter((platform): platform is string => typeof platform === "string")
          : [];
        const legacyPermanentFailureRemains =
          !Array.isArray(item.metadata?.permanentFailurePlatforms) &&
          item.metadata?.permanentFailure === true &&
          platforms.length < item.target_platforms.length;
        const now = new Date();
        const nowIso = now.toISOString();
        const updatedAt = buildNextRowVersionUpdatedAt(expectedUpdatedAt, now);
        const updated = await supabaseServerAdminRequest<QueueItem[]>(
          `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.${encodeURIComponent(item.status)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              status: "queued",
              // Preserve successful provider IDs; only the explicitly selected
              // unresolved targets are cleared after the administrator confirms
              // that no corresponding remote post exists.
              error_message: null,
              updated_at: updatedAt,
              scheduled_at: nowIso,
              metadata: {
                ...(item.metadata ?? {}),
                attempts: 0,
                maxAttempts: item.metadata?.maxAttempts ?? 5,
                platformAttempts: {
                  ...(item.metadata?.platformAttempts && typeof item.metadata.platformAttempts === "object" && !Array.isArray(item.metadata.platformAttempts)
                    ? item.metadata.platformAttempts as Record<string, number>
                    : {}),
                  ...Object.fromEntries(platforms.map(platform => [platform, 0])),
                },
                platformResults: nextPlatformResults,
                authBlocked: remainingAuthBlockedPlatforms.length > 0,
                authBlockedPlatforms: remainingAuthBlockedPlatforms,
                permanentFailure: remainingPermanentFailurePlatforms.length > 0 || legacyPermanentFailureRemains,
                permanentFailurePlatforms: remainingPermanentFailurePlatforms,
                unavailablePlatforms: remainingUnavailablePlatforms,
                manualReconciliationPlatforms: remainingManualReconciliationPlatforms,
                writtenArticlePublicationBlocked: false,
                writtenArticlePublicationPending: false,
                kidsSourceApprovalBlocked: false,
                kidsSourceApprovalPending: false,
                // A retry must never clear a scholarly/editorial approval gate.
                approvalDeferredPlatforms: preservedApprovalDeferredPlatforms,
                nextRetryAt: null,
              },
            }),
          }
        );
        if (Array.isArray(updated) && updated[0]) affected += 1;
        else staleSkipped += 1;
      }
      return { affected, manualReconciliationSkipped, sourceMediaMissingSkipped, staleSkipped };
    };

    if (action === "publish_now") {
      const selectedFilter = ids.map(encodeURIComponent).join(",");
      const selectedItems = await supabaseServerAdminRequest<QueueItem[]>(
        "/rest/v1/social_publish_queue?id=in.(" + selectedFilter + ")&status=in.(queued,partial,failed)&select=id,content_type,content_id,title,video_url,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata",
      );
      const diagnosedItems = await attachVideoApprovalDiagnostics(selectedItems ?? []);
      const approvedIds = diagnosedItems
        .filter(item => !isVideoContentType(item.content_type) || item.videoApproval?.approved === true)
        .map(item => item.id);
      const blocked = [
        ...diagnosedItems
          .filter(item => isVideoContentType(item.content_type) && (item.metadata?.sourceMediaMissing === true || item.videoApproval?.approved !== true))
          .map(item => ({
            id: item.id,
            title: item.title,
            reason: item.metadata?.sourceMediaMissing === true
              ? "ملف الفيديو المصدر مفقود؛ لا يمكن إعادة النشر حتى استعادته أو إعادة توليده."
              : item.videoApproval?.reason ?? "الفيديو يحتاج اعتماد مراجعة الجودة.",
          })),
        ...ids.filter(id => !diagnosedItems.some(item => item.id === id)).map(id => ({
          id, title: null, reason: "العنصر غير موجود في الطابور أو لم يعد في حالة تسمح بالنشر الفوري.",
        })),
      ];
      const retryResult = approvedIds.length
        ? await retryItems("id=in.(" + approvedIds.map(encodeURIComponent).join(",") + ")&status=in.(queued,partial,failed)", true, false)
        : { affected: 0, manualReconciliationSkipped: 0, sourceMediaMissingSkipped: 0, staleSkipped: 0 };
      const affected = retryResult.affected;
      const dispatch = affected > 0
        ? await dispatchQueuedSocialWorker()
        : { worker: null, workerDispatched: false };
      const { worker, workerDispatched } = dispatch;
      const auditRecorded = await recordSocialAuditEvent({
        action: "social.queue.publish_now",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: ids.length, affected, approvalBlocked: blocked.length, sourceMediaMissingSkipped: retryResult.sourceMediaMissingSkipped, staleSkipped: retryResult.staleSkipped, workerDispatched },
      });
      return NextResponse.json({ ok: true, affected, blocked, manualReconciliationSkipped: retryResult.manualReconciliationSkipped, sourceMediaMissingSkipped: retryResult.sourceMediaMissingSkipped, staleSkipped: retryResult.staleSkipped, worker, workerDispatched, workerDispatchFailed: affected > 0 && !workerDispatched, auditRecorded });
    }

    if (action === "retry_all_failed") {
      const retryResult = await retryItems("id=in.(" + ids.map(encodeURIComponent).join(",") + ")&status=in.(failed,partial)", false, false);
      const affected = retryResult.affected;
      const dispatch = affected > 0
        ? await dispatchQueuedSocialWorker()
        : { worker: null, workerDispatched: false };
      const { worker, workerDispatched } = dispatch;
      const auditRecorded = await recordSocialAuditEvent({
        action: "social.queue.retry_all_failed",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: ids.length, affected, manualReconciliationSkipped: retryResult.manualReconciliationSkipped, sourceMediaMissingSkipped: retryResult.sourceMediaMissingSkipped, staleSkipped: retryResult.staleSkipped, workerDispatched },
      });
      return NextResponse.json({ ok: true, affected, manualReconciliationSkipped: retryResult.manualReconciliationSkipped, sourceMediaMissingSkipped: retryResult.sourceMediaMissingSkipped, staleSkipped: retryResult.staleSkipped, worker, workerDispatched, workerDispatchFailed: affected > 0 && !workerDispatched, auditRecorded });
    }

    const filter = ids.map(encodeURIComponent).join(",");
    if (action === "retry") {
      const retryResult = await retryItems(
        `id=in.(${filter})&status=in.(failed,partial)`,
        false,
        confirmedNoRemotePublication,
      );
      const affected = retryResult.affected;
      const dispatch = affected > 0
        ? await dispatchQueuedSocialWorker()
        : { worker: null, workerDispatched: false };
      const { worker, workerDispatched } = dispatch;
      const auditRecorded = await recordSocialAuditEvent({
        action: "social.queue.retry",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: {
          requestedIds: ids.length,
          affected,
          manualReconciliationSkipped: retryResult.manualReconciliationSkipped,
          sourceMediaMissingSkipped: retryResult.sourceMediaMissingSkipped,
          staleSkipped: retryResult.staleSkipped,
          confirmedNoRemotePublication,
          workerDispatched,
        },
      });
      return NextResponse.json({ ok: true, affected, manualReconciliationSkipped: retryResult.manualReconciliationSkipped, sourceMediaMissingSkipped: retryResult.sourceMediaMissingSkipped, staleSkipped: retryResult.staleSkipped, worker, workerDispatched, workerDispatchFailed: affected > 0 && !workerDispatched, auditRecorded });
    }

    if (action === "delete" || action === "delete_failed") {
      if (!confirmedNoRemotePublication) {
        return NextResponse.json(
          { error: "أكد أولًا أنك تحققت من عدم وجود منشور فعلي قبل حذف سجل الطابور المحلي." },
          { status: 400 },
        );
      }
      const selectedItems = await supabaseServerAdminRequest<QueueItem[]>(
        "/rest/v1/social_publish_queue?id=in.(" + filter + ")&status=in.(failed,partial)&select=id,title,status,target_platforms,metadata,error_message,updated_at&limit=200",
      );
      const deletion = await deleteSafeLocalSocialQueueRows(selectedItems ?? []);
      const stale = deletion.stale + Math.max(0, ids.length - (selectedItems?.length ?? 0));
      const auditRecorded = await recordSocialAuditEvent({
        action: action === "delete_failed" ? "social.queue.delete_failed" : "social.queue.delete",
        permission: "social.manage",
        resourceType: "social_publish_queue",
        metadata: {
          requestedIds: ids.length,
          affected: deletion.deleted,
          preserved: deletion.preserved,
          stale,
          uncertain: deletion.uncertain,
        },
      });
      return NextResponse.json({
        ok: true,
        affected: deletion.deleted,
        preserved: deletion.preserved,
        stale,
        uncertain: deletion.uncertain,
        blocked: deletion.blocked,
        auditRecorded,
      });
    }

    if (action === "delete_published") {
      if (body.confirmed !== true) {
        return NextResponse.json(
          { error: "explicit_confirmation_required" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      if (body.deleteLocalMemory === true) {
        return NextResponse.json(
          { error: "Local media deletion is not supported by this action; use the separately reviewed storage-retention workflow." },
          { status: 400 },
        );
      }
      // Remote deletion is intentionally limited to Facebook targets. Require an
      // explicit platform list so an omitted/empty list cannot widen a destructive
      // request, and reject YouTube server-side even if a client bypasses the UI.
      if (requestedPlatforms.length === 0 || requestedPlatforms.includes("youtube")) {
        return NextResponse.json(
          {
            error: requestedPlatforms.includes("youtube")
              ? "youtube_remote_delete_not_supported"
              : "explicit_platform_selection_required",
          },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const selectedFilter = ids.map(encodeURIComponent).join(",");
      const selectedItems = await supabaseServerAdminRequest<QueueItem[]>(
        "/rest/v1/social_publish_queue?id=in.(" + selectedFilter + ")&status=eq.published&select=id,content_type,content_id,title,video_url,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata",
      );
      let deleted = 0;
      let failed = 0;
      let missingRemoteId = 0;
      let inProgress = 0;
      let staleSkipped = 0;
      const results: Array<{ id: string; title: string; platform: string; status: "deleted" | "failed" | "missing_remote_id" | "already_deleted" | "in_progress" | "stale"; error?: string }> = [];

      for (const item of selectedItems ?? []) {
        if (!isVideoContentType(item.content_type)) {
          results.push({ id: item.id, title: item.title, platform: "all", status: "failed", error: "الحذف من هذا القسم متاح لفيديوهات الطابور المنشورة فقط." });
          failed += 1;
          continue;
        }
        const existingDeletions = asRecord(item.metadata?.platformDeletions) ?? {};
        const deletionTargets = item.target_platforms.filter(
          (platform): platform is SocialDeletionPlatform =>
            isSocialDeletionPlatform(platform) &&
            (requestedPlatforms.length === 0 || requestedPlatforms.includes(platform)),
        );
        for (const platform of deletionTargets) {
          if (platform !== "youtube" && platform !== "facebook" && platform !== "facebook_reels") continue;
          const previousDeletion = asRecord(existingDeletions[platform]);
          const delivery = deliveryForPlatform(item.metadata, platform);
          const remoteId = typeof delivery?.remoteId === "string" ? delivery.remoteId.trim() : "";
          if (isSocialPlatformDeletionCurrent(previousDeletion, remoteId, item.published_at)) {
            results.push({ id: item.id, title: item.title, platform, status: "already_deleted" });
            continue;
          }
          if (delivery?.ok !== true || !remoteId) {
            results.push({ id: item.id, title: item.title, platform, status: "missing_remote_id", error: "معرّف المنشور الناجح غير محفوظ؛ لم يتم تخمينه أو إرسال طلب حذف." });
            missingRemoteId += 1;
            existingDeletions[platform] = { status: "missing_remote_id", attemptedAt: new Date().toISOString() };
            const persisted = await patchSocialQueueMetadataWithCas({
              id: item.id,
              expectedStatus: "published",
              expectedVideoUrl: item.video_url,
              expectedPlatformRemoteId: { platform, remoteId: null },
              patch: { platformDeletions: { [platform]: existingDeletions[platform] } },
            }).catch((error) => {
              console.error("[api/admin/social] Could not persist missing-remote-ID state:", item.id, platform, error);
              return false;
            });
            if (!persisted) {
              const lastResult = results[results.length - 1];
              if (lastResult?.id === item.id && lastResult.platform === platform) {
                lastResult.error = [lastResult.error, "The queue row changed concurrently; the missing-remote-ID audit state could not be saved."].filter(Boolean).join(" ");
              }
            }
            continue;
          }

          const claim = await claimSocialQueuePlatformDeletion({
            id: item.id,
            expectedStatus: "published",
            expectedVideoUrl: item.video_url,
            expectedRemoteId: remoteId,
            platform,
          });
          if (claim === "already_deleted") {
            results.push({ id: item.id, title: item.title, platform, status: "already_deleted" });
            continue;
          }
          if (claim === "in_progress") {
            inProgress += 1;
            results.push({
              id: item.id,
              title: item.title,
              platform,
              status: "in_progress",
              error: "A remote deletion is already reserved; no second provider request was sent. Reconcile the existing attempt before retrying.",
            });
            continue;
          }
          if (claim === "stale") {
            staleSkipped += 1;
            results.push({
              id: item.id,
              title: item.title,
              platform,
              status: "stale",
              error: "The queue row changed during deletion preflight; no provider request was sent.",
            });
            continue;
          }

          try {
            const deletion = await deleteSocialPlatformPost(platform as SocialDeletionPlatform, remoteId);
            existingDeletions[platform] = { status: "deleted", remoteId: deletion.remoteId, deletedAt: deletion.deletedAt };
            results.push({ id: item.id, title: item.title, platform, status: "deleted" });
            deleted += 1;
          } catch (error) {
            const message = error instanceof Error ? error.message : "تعذر حذف المنشور من المنصة.";
            existingDeletions[platform] = { status: "failed", remoteId, attemptedAt: new Date().toISOString(), error: message };
            results.push({ id: item.id, title: item.title, platform, status: "failed", error: message });
            failed += 1;
          }

          // Persist after each platform so a partial delete never causes a second
          // provider delete for a channel that already confirmed success.
          const persisted = await patchSocialQueueMetadataWithCas({
            id: item.id,
            expectedStatus: "published",
            expectedVideoUrl: item.video_url,
            expectedPlatformRemoteId: { platform, remoteId },
            patch: { platformDeletions: { [platform]: existingDeletions[platform] } },
          }).catch((error) => {
            console.error("[api/admin/social] Could not persist provider deletion result:", item.id, platform, error);
            return false;
          });
          if (!persisted) {
            const lastResult = results[results.length - 1];
            if (lastResult?.id === item.id && lastResult.platform === platform) {
              lastResult.error = [lastResult.error, "The provider result could not be saved because the queue row changed concurrently; manual reconciliation is required."].filter(Boolean).join(" ");
            }
          }
        }
      }

      const auditRecorded = await recordSocialAuditEvent({
        action: "social.queue.delete_published_remote",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: ids.length, deleted, failed, missingRemoteId, inProgress, staleSkipped },
      });
      return NextResponse.json({ ok: true, deleted, failed, missingRemoteId, inProgress, staleSkipped, results, auditRecorded });
    }

    return NextResponse.json({ error: "إجراء غير صالح." }, { status: 400 });
  } catch (error) {
    console.error("[api/admin/social] POST:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تنفيذ إجراء مركز النشر.",
      },
      { status: 500 }
    );
  }
}
