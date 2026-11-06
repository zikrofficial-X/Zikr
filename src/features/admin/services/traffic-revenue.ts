import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

type CountResult = { count: number | null; error: { message: string } | null };

export type YoutubeAnalyticsSnapshot = {
  status: "connected" | "authorization_required" | "unavailable" | "not_configured";
  startDate: string | null;
  endDate: string | null;
  views: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDurationSeconds: number | null;
  averageViewPercentage: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  trafficSources: Array<{ source: string; views: number; watchMinutes: number }> | null;
  capturedAt: string | null;
};

export type SocialPlatformDeliveryStats = {
  platform: string;
  attempts: number;
  successful: number;
  failed: number;
  remoteIds: number;
};

export type TrafficRevenueSnapshot = {
  generatedAt: string;
  period: {
    timezone: "UTC";
    start24h: string;
    start7d: string;
    end: string;
  };
  metrics: {
    socialQueued: number | null;
    socialProcessing: number | null;
    socialPartial: number | null;
    socialPublished: number | null;
    socialFailed: number | null;
    socialCreated24h: number | null;
    socialCreated7d: number | null;
    socialPublished24h: number | null;
    socialPublished7d: number | null;
    videoCompleted: number | null;
    videoFailed: number | null;
    videoRetryPending: number | null;
    videoRequested24h: number | null;
    videoRequested7d: number | null;
    videoCompleted24h: number | null;
    videoCompleted7d: number | null;
    averageRenderDurationMs7d: number | null;
    publishedArticles: number | null;
    publishedVideos: number | null;
  };
  socialPlatformStats: SocialPlatformDeliveryStats[] | null;
  socialPlatformStatsComplete: boolean;
  integrations: {
    ga4MeasurementConfigured: boolean;
    ga4ReportingConnected: false;
    monetagVerificationMetaPresent: true;
    monetagSmartLinkConfigured: true;
    monetagReportingConnected: false;
    youtubeAnalyticsConfigured: boolean;
    youtubeAnalyticsConnected: boolean;
  };
  youtubeAnalytics: YoutubeAnalyticsSnapshot;
  socialProfiles: Array<{
    platform: string;
    name: string | null;
    handle: string | null;
    status: string | null;
    syncedAt: string | null;
  }> | null;
  unavailable: string[];
};

function readCount(result: CountResult): number | null {
  return result.error ? null : (result.count ?? 0);
}

type AnalyticsReport = {
  columnHeaders?: Array<{ name?: string }>;
  rows?: Array<Array<string | number | null>>;
};

function reportNumber(report: AnalyticsReport, row: Array<string | number | null> | undefined, column: string): number | null {
  if (!row) return null;
  const index = (report.columnHeaders ?? []).findIndex((header) => header.name === column);
  if (index < 0) return null;
  const value = Number(row[index]);
  return Number.isFinite(value) ? value : null;
}

function utcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function trafficSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    ADVERTISING: "إعلانات YouTube",
    ANNOTATION: "البطاقات التوضيحية",
    CAMPAIGN_CARD: "بطاقات الحملات",
    END_SCREEN: "شاشات النهاية",
    EXT_URL: "روابط خارجية",
    NO_LINK_EMBEDDED: "مشغلات مضمنة بلا رابط",
    NO_LINK_OTHER: "مصادر أخرى بلا رابط",
    NOTIFICATION: "الإشعارات",
    PLAYLIST: "قوائم التشغيل",
    PROMOTED: "محتوى مروّج",
    RELATED_VIDEO: "فيديوهات مقترحة",
    SHORTS: "YouTube Shorts",
    SOUND_PAGE: "صفحات الصوت",
    SUBSCRIBER: "المشتركون",
    YT_CHANNEL: "قناة YouTube",
    YT_OTHER_PAGE: "صفحات YouTube أخرى",
    YT_SEARCH: "بحث YouTube",
  };
  return labels[source] ?? source.replaceAll("_", " ").toLowerCase();
}

async function fetchYoutubeAnalyticsSnapshot(): Promise<YoutubeAnalyticsSnapshot> {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN?.trim();
  const unavailable = (status: YoutubeAnalyticsSnapshot["status"]): YoutubeAnalyticsSnapshot => ({
    status, startDate: null, endDate: null, views: null, estimatedMinutesWatched: null,
    averageViewDurationSeconds: null, averageViewPercentage: null, subscribersGained: null,
    subscribersLost: null, likes: null, comments: null, shares: null, trafficSources: null, capturedAt: null,
  });
  if (!clientId || !clientSecret || !refreshToken) return unavailable("not_configured");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) {
      return unavailable(tokenResponse.status === 400 || tokenResponse.status === 401 ? "authorization_required" : "unavailable");
    }
    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenPayload.access_token) return unavailable("authorization_required");

    const end = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000);
    const startDate = utcDate(start);
    const endDate = utcDate(end);
    const base = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
    const common = { ids: "channel==MINE", startDate, endDate };
    const summaryUrl = new URL(base);
    Object.entries({
      ...common,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares",
    }).forEach(([key, value]) => summaryUrl.searchParams.set(key, value));
    const trafficUrl = new URL(base);
    Object.entries({
      ...common,
      dimensions: "insightTrafficSourceType",
      metrics: "views,estimatedMinutesWatched",
      sort: "-views",
      maxResults: "10",
    }).forEach(([key, value]) => trafficUrl.searchParams.set(key, value));

    const headers = { Authorization: "Bearer " + tokenPayload.access_token };
    const [summaryResponse, trafficResponse] = await Promise.all([
      fetch(summaryUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(12_000) }),
      fetch(trafficUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(12_000) }),
    ]);
    if (!summaryResponse.ok) {
      return unavailable(summaryResponse.status === 401 || summaryResponse.status === 403 ? "authorization_required" : "unavailable");
    }
    const summary = (await summaryResponse.json()) as AnalyticsReport;
    const row = summary.rows?.[0];
    let trafficSources: YoutubeAnalyticsSnapshot["trafficSources"] = null;
    if (trafficResponse.ok) {
      const traffic = (await trafficResponse.json()) as AnalyticsReport;
      trafficSources = (traffic.rows ?? []).flatMap((trafficRow) => {
        const sourceIndex = (traffic.columnHeaders ?? []).findIndex((header) => header.name === "insightTrafficSourceType");
        const sourceValue = sourceIndex < 0 ? null : trafficRow[sourceIndex];
        if (typeof sourceValue !== "string") return [];
        return [{
          source: trafficSourceLabel(sourceValue),
          views: reportNumber(traffic, trafficRow, "views") ?? 0,
          watchMinutes: reportNumber(traffic, trafficRow, "estimatedMinutesWatched") ?? 0,
        }];
      });
    }

    return {
      status: "connected",
      startDate,
      endDate,
      views: reportNumber(summary, row, "views") ?? 0,
      estimatedMinutesWatched: reportNumber(summary, row, "estimatedMinutesWatched") ?? 0,
      averageViewDurationSeconds: reportNumber(summary, row, "averageViewDuration"),
      averageViewPercentage: reportNumber(summary, row, "averageViewPercentage"),
      subscribersGained: reportNumber(summary, row, "subscribersGained") ?? 0,
      subscribersLost: reportNumber(summary, row, "subscribersLost") ?? 0,
      likes: reportNumber(summary, row, "likes") ?? 0,
      comments: reportNumber(summary, row, "comments") ?? 0,
      shares: reportNumber(summary, row, "shares") ?? 0,
      trafficSources,
      capturedAt: new Date().toISOString(),
    };
  } catch {
    // OAuth and API payloads are deliberately not logged or returned.
    return unavailable("unavailable");
  }
}

const getCachedYoutubeAnalyticsSnapshot = unstable_cache(
  fetchYoutubeAnalyticsSnapshot,
  ["zikr-youtube-analytics-readonly-v1"],
  { revalidate: 3600 },
);

function summarizePlatformResults(rows: Array<{ metadata: unknown }>): SocialPlatformDeliveryStats[] {
  const summary = new Map<string, SocialPlatformDeliveryStats>();
  for (const row of rows) {
    if (!row.metadata || typeof row.metadata !== "object" || Array.isArray(row.metadata)) continue;
    const metadata = row.metadata as Record<string, unknown>;
    const results = metadata.platformResults;
    if (!results || typeof results !== "object" || Array.isArray(results)) continue;
    for (const [key, raw] of Object.entries(results as Record<string, unknown>)) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const result = raw as Record<string, unknown>;
      const platform = typeof result.platform === "string" ? result.platform : key;
      const item = summary.get(platform) ?? { platform, attempts: 0, successful: 0, failed: 0, remoteIds: 0 };
      item.attempts += 1;
      if (result.ok === true) item.successful += 1;
      if (result.ok === false || (typeof result.error === "string" && result.error.trim())) item.failed += 1;
      if (typeof result.remoteId === "string" && result.remoteId.trim()) item.remoteIds += 1;
      summary.set(platform, item);
    }
  }
  return [...summary.values()].sort((a, b) => a.platform.localeCompare(b.platform));
}

function averageRenderDuration(rows: Array<{ render_duration_ms: number | null }>, total: number | null): number | null {
  if (total === null || total !== rows.length || rows.length === 0) return null;
  const durations = rows.map((row) => row.render_duration_ms).filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  if (durations.length !== rows.length) return null;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

/**
 * Reads exact operational counts and verified platform-owner analytics.
 * Public traffic and monetization amounts are not inferred from queue activity.
 */
export async function getTrafficRevenueSnapshot(): Promise<TrafficRevenueSnapshot> {
  const supabase = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    socialQueued, socialProcessing, socialPartial, socialPublished, socialFailed,
    socialCreated24h, socialCreated7d, socialPublished24h, socialPublished7d,
    videoCompleted, videoFailed, videoRetryPending, videoRequested24h, videoRequested7d,
    videoCompleted24h, videoCompleted7d, renderDurations, platformRows,
    publishedArticles, publishedVideos, profiles, youtubeAnalytics,
  ] = await Promise.all([
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "processing"),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "partial"),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).gte("created_at", start24h),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).gte("created_at", start7d),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).gte("published_at", start24h),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).gte("published_at", start7d),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "failed"]).not("next_retry_at", "is", null),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).gte("created_at", start24h),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).gte("created_at", start7d),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "completed").gte("updated_at", start24h),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "completed").gte("updated_at", start7d),
    supabase.from("video_generation_requests").select("render_duration_ms", { count: "exact" }).eq("status", "completed").not("render_duration_ms", "is", null).gte("updated_at", start7d).limit(1000),
    supabase.from("social_publish_queue").select("metadata", { count: "exact" }).limit(1000),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("videos").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("social_platform_profiles").select("platform,name,handle,status,synced_at").order("platform", { ascending: true }),
    getCachedYoutubeAnalyticsSnapshot(),
  ]);

  const metrics = {
    socialQueued: readCount(socialQueued),
    socialProcessing: readCount(socialProcessing),
    socialPartial: readCount(socialPartial),
    socialPublished: readCount(socialPublished),
    socialFailed: readCount(socialFailed),
    socialCreated24h: readCount(socialCreated24h),
    socialCreated7d: readCount(socialCreated7d),
    socialPublished24h: readCount(socialPublished24h),
    socialPublished7d: readCount(socialPublished7d),
    videoCompleted: readCount(videoCompleted),
    videoFailed: readCount(videoFailed),
    videoRetryPending: readCount(videoRetryPending),
    videoRequested24h: readCount(videoRequested24h),
    videoRequested7d: readCount(videoRequested7d),
    videoCompleted24h: readCount(videoCompleted24h),
    videoCompleted7d: readCount(videoCompleted7d),
    averageRenderDurationMs7d: averageRenderDuration(renderDurations.data ?? [], renderDurations.count),
    publishedArticles: readCount(publishedArticles),
    publishedVideos: readCount(publishedVideos),
  };

  const platformCount = platformRows.count;
  const platformRowsComplete =
    !platformRows.error &&
    platformCount !== null &&
    platformCount <= (platformRows.data ?? []).length;
  const socialPlatformStats = platformRowsComplete
    ? summarizePlatformResults(platformRows.data ?? [])
    : null;

  const unavailable: string[] = [];
  if ([metrics.socialQueued, metrics.socialProcessing, metrics.socialPartial, metrics.socialPublished, metrics.socialFailed].some((value) => value === null)) {
    unavailable.push("طابور النشر الاجتماعي");
  }
  if ([metrics.socialCreated24h, metrics.socialCreated7d, metrics.socialPublished24h, metrics.socialPublished7d].some((value) => value === null)) {
    unavailable.push("اتجاهات النشر الاجتماعي");
  }
  if (!platformRowsComplete) unavailable.push("نتائج النشر لكل منصة");
  if ([metrics.videoCompleted, metrics.videoFailed, metrics.videoRetryPending].some((value) => value === null)) {
    unavailable.push("حالة عمليات إنتاج الفيديو");
  }
  if ([metrics.videoRequested24h, metrics.videoRequested7d, metrics.videoCompleted24h, metrics.videoCompleted7d].some((value) => value === null)) {
    unavailable.push("اتجاهات إنتاج الفيديو");
  }
  if (metrics.averageRenderDurationMs7d === null) unavailable.push("متوسط مدة الرندر");
  if (metrics.publishedArticles === null || metrics.publishedVideos === null) unavailable.push("المحتوى المنشور");
  if (profiles.error) unavailable.push("حالة حسابات المنصات");
  if (youtubeAnalytics.status !== "connected") unavailable.push("YouTube Analytics");

  const hasYoutubeAnalyticsCredentials = Boolean(
    process.env.YOUTUBE_CLIENT_ID?.trim() &&
    process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
    process.env.YOUTUBE_REFRESH_TOKEN?.trim(),
  );

  return {
    generatedAt: nowIso,
    period: { timezone: "UTC", start24h, start7d, end: nowIso },
    metrics,
    socialPlatformStats,
    socialPlatformStatsComplete: platformRowsComplete,
    integrations: {
      ga4MeasurementConfigured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      ga4ReportingConnected: false,
      monetagVerificationMetaPresent: true,
      monetagSmartLinkConfigured: true,
      monetagReportingConnected: false,
      youtubeAnalyticsConfigured: hasYoutubeAnalyticsCredentials,
      youtubeAnalyticsConnected: youtubeAnalytics.status === "connected",
    },
    youtubeAnalytics,
    socialProfiles: profiles.error
      ? null
      : (profiles.data ?? []).map((profile) => ({
          platform: profile.platform,
          name: profile.name,
          handle: profile.handle,
          status: profile.status,
          syncedAt: profile.synced_at,
        })),
    unavailable,
  };
}
