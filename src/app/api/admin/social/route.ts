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

export const dynamic = "force-dynamic";

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
  metadata?: Record<string, unknown> | null;
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
    const items = await supabaseServerAdminRequest<QueueItem[]>(
      "/rest/v1/social_publish_queue?select=id,content_type,content_id,title,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata&order=created_at.desc&limit=1000"
    );
    const rows = items ?? [];
    const counts = rows.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    const env = getServerEnv();
    // Keep the Admin health badge aligned with the GitHub workflow gate.
    const socialPublishingEnabled = true;
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
        platformStats,
        socialAnalytics,
        oldestQueuedAt,
        health: {
          youtubeConfigured: Boolean(
            (env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN) ||
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
    if (["retry", "retry_all_failed", "run_worker"].includes(action)) {
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
      !["retry", "retry_all_failed", "delete", "delete_failed"].includes(action)
    )
      return NextResponse.json({ error: "إجراء غير صالح." }, { status: 400 });
    if ((action === "retry" || action === "delete") && ids.length === 0)
      return NextResponse.json(
        { error: "حدد عملية فاشلة أولًا." },
        { status: 400 }
      );

    const retryItems = async (filter: string) => {
      const items = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?${filter}&select=id,target_platforms,metadata,status`
      );
      let affected = 0;
      for (const item of items ?? []) {
        if (!retryableStatuses.has(item.status)) continue;
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
