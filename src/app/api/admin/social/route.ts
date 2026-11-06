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

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
      ids?: unknown;
      platforms?: unknown;
    };
    const action = typeof body.action === "string" ? body.action : "";
    if (["retry", "retry_all_failed", "run_worker", "publish_now", "delete_published"].includes(action)) {
      const executionAuth = await requireAdminApi("social.publish");
      if (!executionAuth.ok) {
        return NextResponse.json(
          { error: executionAuth.error },
          { status: executionAuth.status },
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
    const allowedPlatforms = new Set(["facebook", "facebook_reels", "youtube"]);
    const requestedPlatforms = Array.isArray(body.platforms)
      ? [...new Set(body.platforms.filter((value): value is string => typeof value === "string" && allowedPlatforms.has(value)))]
      : [];
    if (action === "test_facebook") {
      const health = await getFacebookPageConnectionHealth();
      return NextResponse.json({ ok: true, health }, { headers: { "Cache-Control": "no-store" } });
    }    if (action === "test_youtube") {
      const health = await getYouTubePublishingConnectionHealth();
      await recordAdminAuditEvent({
        action: "social.youtube.connection_test",
        permission: "social.manage",
        resourceType: "youtube_channel",
        metadata: { status: health.status, channelId: health.channelId, readSource: health.readSource },
      });
      return NextResponse.json({ ok: true, health }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "adopt_server_facebook_token") {
      // No token is accepted from the browser. The server-only Vercel value is validated,
      // stored only after verification, and then old auth-blocked queue entries are released.
      const adopted = await adoptServerConfiguredFacebookPageToken();
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
        } catch {
          // The scheduled publisher remains the fallback if manual dispatch is unavailable.
        }
      }

      const health = await getFacebookPageConnectionHealth();
      await recordAdminAuditEvent({
        action: "social.facebook.token_adopt",
        permission: "social.manage",
        resourceType: "social_publish_queue",
        metadata: { released, queueUpdateFailed, workerDispatched, pageName: adopted.pageName },
      });
      return NextResponse.json({
        ok: true,
        adopted: true,
        pageName: adopted.pageName,
        released,
        queueUpdateFailed,
        workerDispatched,
        health,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "run_worker") {
      const worker = await triggerSocialWorker();
      await recordAdminAuditEvent({
        action: "social.worker.run",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { workerDispatched: true },
      });
      return NextResponse.json({ ok: true, worker });
    }
    if (
      !["retry", "retry_all_failed", "delete", "delete_failed", "publish_now", "delete_published"].includes(action)
    )
      return NextResponse.json({ error: "إجراء غير صالح." }, { status: 400 });
    if ((action === "retry" || action === "delete" || action === "publish_now" || action === "delete_published") && ids.length === 0)
      return NextResponse.json(
        { error: "حدد عملية فاشلة أولًا." },
        { status: 400 }
      );

    const retryItems = async (filter: string, includeQueued = false) => {
      const items = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?${filter}&select=id,target_platforms,metadata,status`
      );
      let affected = 0;
      for (const item of items ?? []) {
        if (!retryableStatuses.has(item.status) && !(includeQueued && item.status === "queued")) continue;
        const eligiblePlatforms = retryPlatforms(item);
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
            await supabaseServerAdminRequest(
              `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
                body: JSON.stringify({
                  status: "published",
                  error_message: null,
                  published_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }),
              }
            );
            affected += 1;
          }
          // Leave partial/failed records unchanged if any target is still blocked.
          continue;
        }
        await supabaseServerAdminRequest(
          `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              status: "queued",
              // Preserve the original target set. Successful channels remain in the
              // ledger and the worker retries only the failed platform(s).
              error_message: null,
              updated_at: new Date().toISOString(),
              scheduled_at: new Date().toISOString(),
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
                platformResults: Object.fromEntries(
                  Object.entries(item.metadata?.platformResults && typeof item.metadata.platformResults === "object" && !Array.isArray(item.metadata.platformResults)
                    ? item.metadata.platformResults as Record<string, unknown>
                    : {}).filter(([platform]) => !platforms.includes(platform)),
                ),
                authBlocked: false,
                authBlockedPlatforms: (Array.isArray(item.metadata?.authBlockedPlatforms)
                  ? item.metadata.authBlockedPlatforms
                  : []).filter(platform => !platforms.includes(String(platform))),
                permanentFailure: false,
                permanentFailurePlatforms: (Array.isArray(item.metadata?.permanentFailurePlatforms)
                  ? item.metadata.permanentFailurePlatforms
                  : []).filter(platform => !platforms.includes(String(platform))),
                unavailablePlatforms: [],
                approvalDeferredPlatforms: [],
                nextRetryAt: null,
              },
            }),
          }
        );
        affected += 1;
      }
      return affected;
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
          .filter(item => isVideoContentType(item.content_type) && item.videoApproval?.approved !== true)
          .map(item => ({ id: item.id, title: item.title, reason: item.videoApproval?.reason ?? "الفيديو يحتاج اعتماد مراجعة الجودة." })),
        ...ids.filter(id => !diagnosedItems.some(item => item.id === id)).map(id => ({
          id, title: null, reason: "العنصر غير موجود في الطابور أو لم يعد في حالة تسمح بالنشر الفوري.",
        })),
      ];
      const affected = approvedIds.length
        ? await retryItems("id=in.(" + approvedIds.map(encodeURIComponent).join(",") + ")&status=in.(queued,partial,failed)", true)
        : 0;
      const worker = affected > 0 ? await triggerSocialWorker() : null;
      await recordAdminAuditEvent({
        action: "social.queue.publish_now",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: ids.length, affected, approvalBlocked: blocked.length, workerDispatched: affected > 0 },
      });
      return NextResponse.json({ ok: true, affected, blocked, worker });
    }

    if (action === "retry_all_failed") {
      const affected = await retryItems("status=in.(failed,partial)");
      const worker = affected > 0 ? await triggerSocialWorker() : null;
      await recordAdminAuditEvent({
        action: "social.queue.retry_all_failed",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { affected, workerDispatched: affected > 0 },
      });
      return NextResponse.json({ ok: true, affected, worker });
    }

    const filter = ids.map(encodeURIComponent).join(",");
    if (action === "retry") {
      const affected = await retryItems(
        `id=in.(${filter})&status=in.(failed,partial)`
      );
      const worker = affected > 0 ? await triggerSocialWorker() : null;
      await recordAdminAuditEvent({
        action: "social.queue.retry",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: ids.length, affected, workerDispatched: affected > 0 },
      });
      return NextResponse.json({ ok: true, affected, worker });
    }

    if (action === "delete") {
      const affected = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?id=in.(${filter})&status=in.(failed,partial)&select=id`,
        { method: "DELETE", headers: { Prefer: "return=representation" } }
      );
      await recordAdminAuditEvent({
        action: "social.queue.delete",
        permission: "social.manage",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: ids.length, affected: affected?.length ?? 0 },
      });
      return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
    }

    if (action === "delete_published") {
      const selectedFilter = ids.map(encodeURIComponent).join(",");
      const selectedItems = await supabaseServerAdminRequest<QueueItem[]>(
        "/rest/v1/social_publish_queue?id=in.(" + selectedFilter + ")&status=eq.published&select=id,content_type,content_id,title,video_url,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata",
      );
      let deleted = 0;
      let failed = 0;
      let missingRemoteId = 0;\n      let localMemoryDeleted = 0;\n      let localMemoryFailed = 0;
      const deletionLedgerByItem = new Map<string, Record<string, unknown>>();\n      const results: Array<{ id: string; title: string; platform: string; status: "deleted" | "failed" | "missing_remote_id" | "already_deleted"; error?: string }> = [];

      for (const item of selectedItems ?? []) {
        if (!isVideoContentType(item.content_type)) {
          results.push({ id: item.id, title: item.title, platform: "all", status: "failed", error: "الحذف من هذا القسم متاح لفيديوهات الطابور المنشورة فقط." });
          failed += 1;
          continue;
        }
        const existingDeletions = asRecord(item.metadata?.platformDeletions) ?? {};\n        deletionLedgerByItem.set(item.id, existingDeletions);
        const deletionTargets = requestedPlatforms.length > 0
          ? item.target_platforms.filter(platform => requestedPlatforms.includes(platform))
          : item.target_platforms;
        for (const platform of deletionTargets) {
          if (platform !== "youtube" && platform !== "facebook" && platform !== "facebook_reels") continue;
          const previousDeletion = asRecord(existingDeletions[platform]);
          if (previousDeletion?.status === "deleted") {
            results.push({ id: item.id, title: item.title, platform, status: "already_deleted" });
            continue;
          }
          const delivery = deliveryForPlatform(item.metadata, platform);
          const remoteId = typeof delivery?.remoteId === "string" ? delivery.remoteId.trim() : "";
          if (delivery?.ok !== true || !remoteId) {
            results.push({ id: item.id, title: item.title, platform, status: "missing_remote_id", error: "معرّف المنشور الناجح غير محفوظ؛ لم يتم تخمينه أو إرسال طلب حذف." });
            missingRemoteId += 1;
            existingDeletions[platform] = { status: "missing_remote_id", attemptedAt: new Date().toISOString() };
            await supabaseServerAdminRequest(
              "/rest/v1/social_publish_queue?id=eq." + encodeURIComponent(item.id),
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
                body: JSON.stringify({ metadata: { ...(item.metadata ?? {}), platformDeletions: existingDeletions }, updated_at: new Date().toISOString() }),
              },
            );
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
          await supabaseServerAdminRequest(
            "/rest/v1/social_publish_queue?id=eq." + encodeURIComponent(item.id),
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ metadata: { ...(item.metadata ?? {}), platformDeletions: existingDeletions }, updated_at: new Date().toISOString() }),
            },
          );
        }
      }

      if (deleteLocalMemory) {
        // Remove only verified ZIKR-generated Cloudinary media after remote
        // deletion was confirmed. Keep audit/social queue ledgers intact.
        for (const item of selectedItems ?? []) {
          const deletionLedger = deletionLedgerByItem.get(item.id) ?? asRecord(item.metadata?.platformDeletions) ?? {};
          const remoteDeletionConfirmed = Object.values(deletionLedger).some(
            value => asRecord(value)?.status === "deleted",
          );
          if (!remoteDeletionConfirmed) continue;
          const contentId = item.content_id?.trim();
          if (!contentId) {
            localMemoryFailed += 1;
            continue;
          }
          try {
            const generationRows = await supabaseServerAdminRequest<Array<{ video_url: string | null }>>(
              "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(contentId) + "&select=video_url&limit=1",
            );
            const videoUrl = generationRows?.[0]?.video_url;
            if (!videoUrl) throw new Error("Generated source URL is unavailable.");
            const parsed = new URL(videoUrl);
            if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") {
              throw new Error("Generated media URL is not an approved Cloudinary URL.");
            }
            const env = getServerEnv();
            const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
            const segments = parsed.pathname.split("/").filter(Boolean);
            const upload = segments.indexOf("upload");
            const cloud = cloudName ? segments.indexOf(cloudName) : -1;
            if (!cloudName || cloud < 0 || upload <= cloud) throw new Error("Cloudinary ownership could not be verified.");
            const assetParts = segments.slice(upload + 1).filter(part => !/^v\d+$/.test(part));
            const filename = assetParts.pop() ?? "";
            const publicId = [...assetParts, filename.replace(/\.mp4$/i, "")].join("/");
            if (!/^auto-[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(publicId)) {
              throw new Error("Asset is not tagged with the ZIKR generated-video prefix.");
            }
            const crypto = await import("node:crypto");
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const params = { public_id: publicId, timestamp };
            const signingText = Object.entries(params).sort(([a],[b]) => a.localeCompare(b))
              .map(([key,value]) => key + "=" + value).join("&") + (env.CLOUDINARY_API_SECRET ?? "");
            const signature = crypto.createHash("sha1").update(signingText).digest("hex");
            const response = await fetch(
              "https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloudName) + "/video/destroy",
              {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ ...params, api_key: env.CLOUDINARY_API_KEY ?? "", signature }),
                cache: "no-store",
                signal: AbortSignal.timeout(20_000),
              },
            );
            const payload = await response.json().catch(() => ({})) as { result?: string };
            if (!response.ok || !["ok", "not found"].includes(payload.result ?? "")) {
              throw new Error("Cloudinary deletion was not confirmed.");
            }
            await supabaseServerAdminRequest(
              "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(contentId),
              { method: "DELETE", headers: { Prefer: "return=minimal" } },
            );
            localMemoryDeleted += 1;
          } catch (error) {
            localMemoryFailed += 1;
            console.error("[api/admin/social] local generated-media deletion failed:", error instanceof Error ? error.message : "unknown error");
          }
        }
      }

      await recordAdminAuditEvent({
        action: "social.queue.delete_published_remote",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: ids.length, deleted, failed, missingRemoteId, localMemoryRequested: deleteLocalMemory, localMemoryDeleted, localMemoryFailed },
      });
      return NextResponse.json({ ok: true, deleted, failed, missingRemoteId, localMemoryDeleted, localMemoryFailed, results });
    }

    const affected = await supabaseServerAdminRequest<QueueItem[]>(
      "/rest/v1/social_publish_queue?status=in.(failed,partial)&select=id",
      { method: "DELETE", headers: { Prefer: "return=representation" } }
    );
    await recordAdminAuditEvent({
      action: "social.queue.delete_failed",
      permission: "social.manage",
      resourceType: "social_publish_queue",
      metadata: { affected: affected?.length ?? 0 },
    });
    return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
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
