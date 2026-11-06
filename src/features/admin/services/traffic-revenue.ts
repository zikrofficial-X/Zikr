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

export type TrafficRevenueSnapshot = {
  generatedAt: string;
  metrics: {
    socialQueued: number | null;
    socialPublished: number | null;
    socialFailed: number | null;
    videoCompleted: number | null;
    videoFailed: number | null;
    publishedArticles: number | null;
    publishedVideos: number | null;
  };
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
    const common = {
      ids: "channel==MINE",
      startDate,
      endDate,
    };
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
    // Token, access-token, and raw API responses are intentionally never logged or returned.
    return unavailable("unavailable");
  }
}

const getCachedYoutubeAnalyticsSnapshot = unstable_cache(
  fetchYoutubeAnalyticsSnapshot,
  ["zikr-youtube-analytics-readonly-v1"],
  { revalidate: 3600 },
);

/**
 * Reads exact server-side operational counts and verified YouTube Analytics
 * reports. Public YouTube Data API statistics are not substituted for owner analytics.
 */
export async function getTrafficRevenueSnapshot(): Promise<TrafficRevenueSnapshot> {
  const supabase = createAdminClient();

  const [
    socialQueued,
    socialPublished,
    socialFailed,
    videoCompleted,
    videoFailed,
    publishedArticles,
    publishedVideos,
    profiles,
    youtubeAnalytics,
  ] = await Promise.all([
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("social_publish_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("videos").select("id", { count: "exact", head: true }).eq("published", true),
    supabase
      .from("social_platform_profiles")
      .select("platform,name,handle,status,synced_at")
      .order("platform", { ascending: true }),
    getCachedYoutubeAnalyticsSnapshot(),
  ]);

  const metrics = {
    socialQueued: readCount(socialQueued),
    socialPublished: readCount(socialPublished),
    socialFailed: readCount(socialFailed),
    videoCompleted: readCount(videoCompleted),
    videoFailed: readCount(videoFailed),
    publishedArticles: readCount(publishedArticles),
    publishedVideos: readCount(publishedVideos),
  };

  const unavailable: string[] = [];
  if (metrics.socialQueued === null || metrics.socialPublished === null || metrics.socialFailed === null) {
    unavailable.push("طابور النشر الاجتماعي");
  }
  if (metrics.videoCompleted === null || metrics.videoFailed === null) {
    unavailable.push("عمليات إنتاج الفيديو");
  }
  if (metrics.publishedArticles === null || metrics.publishedVideos === null) {
    unavailable.push("المحتوى المنشور");
  }
  if (profiles.error) unavailable.push("حالة حسابات المنصات");
  if (youtubeAnalytics.status !== "connected") unavailable.push("YouTube Analytics");

  const hasYoutubeAnalyticsCredentials = Boolean(
    process.env.YOUTUBE_CLIENT_ID?.trim() &&
    process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
    process.env.YOUTUBE_REFRESH_TOKEN?.trim(),
  );

  return {
    generatedAt: new Date().toISOString(),
    metrics,
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
