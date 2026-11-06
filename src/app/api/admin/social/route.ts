import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";
import {
  adoptServerConfiguredFacebookPageToken,
  getFacebookPageConnectionHealth,
  unblockFacebookAuthBlockedQueue,
} from "@/features/social/services/facebook-credentials";
import { getYouTubePublishingConnectionHealth } from "@/features/social/services/youtube-publishing-health";
import { getFacebookPageAudienceSnapshot } from "@/features/social/services/facebook-reels-insights";
import { getTrafficRevenueSnapshot } from "@/features/admin/services/traffic-revenue";
import { inspectVideoQueueItemApproval, isVideoContentType, type VideoPublishRequestSnapshot } from "@/features/videos/services/video-publish-approval";
import { deleteSocialPlatformPost, type SocialDeletionPlatform } from "@/features/social/services/social-deletion";

export const dynamic = "force-dynamic";

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
  metadata: Record<string, unknown> | null | undefined
): Set<string> {
  const values = metadata?.platformResults;
  const result = new Set<string>();
  if (!values || typeof values !== "object" || Array.isArray(values))
    return result;

  for (const [platform, value] of Object.entries(values)) {
    if (!value || typeof value !== "object") continue;
    const row = value as { ok?: unknown; error?: unknown };
    if (row.ok === false && typeof row.error === "string") {
      const error = row.error.toLowerCase();
      if (
        platform.startsWith("facebook") &&
        (error.includes("access token") ||
          error.includes("session has expired") ||
          error.includes("oauth"))
      ) {
        result.add(platform);
      }
    }
  }
  return result;
}

function retryPlatforms(item: QueueItem): string[] {
  const succeeded = successfulPlatforms(item.metadata);
  const blocked = authBlockedPlatforms(item.metadata);
  return item.target_platforms.filter(
    platform => !succeeded.has(platform) && !blocked.has(platform)
  );
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

async function triggerSocialWorker() {
  return dispatchGitHubWorkflow("publish-social.yml", {
    operation: "publish_queue",
  });
}

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const fetchedItems = await supabaseServerAdminRequest<QueueItem[]>(
      "/rest/v1/social_publish_queue?select=id,content_type,content_id,title,video_url,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata&order=created_at.desc&limit=1000"
    );
    const queueRows = fetchedItems ?? [];
    // Insights live in a private table so queue cleanup cannot erase analytics history.
    const insightRows = await supabaseServerAdminRequest<SocialPostInsightRow[]>(
      "/rest/v1/social_post_insights?select=queue_id,platform,video_id,metrics,captured_at,source,scope,period,status&order=captured_at.desc&limit=5000",
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
    const facebookAuthBlocked = rows.filter(
      item =>
        retryableStatuses.has(item.status) &&
        authBlockedPlatforms(item.metadata).size > 0
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
          scheduleMinutes: 15,
          note: socialPublishingEnabled
            ? "النشر يعمل تلقائيًا كل 15 دقيقة؛ تشغيل العامل يدويًا خيار للتشغيل الفوري فقط."
            : "النشر العام متوقف بأمان؛ تشغيل العامل لا ينشر أي عنصر حتى إعادة تفعيل النشر صراحةً.",
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api/admin/social] GET:", error);
    return NextResponse.json(
      { error: "تعذر تحميل مركز النشر." },
      { status: 500 }
    );
  }
}

export async function POST() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json(
    {
      error: "تم إيقاف النشر والتعديل والحذف عبر منصات التواصل في ZIKR. سجلات المنصات القديمة محفوظة للقراءة والتدقيق.",
      code: "SOCIAL_PUBLISHING_RETIRED",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
