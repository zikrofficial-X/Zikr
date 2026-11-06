import "server-only";

import { createHash } from "node:crypto";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getYouTubeRefreshToken } from "@/features/social/services/youtube-oauth-credentials";
import { averageRenderDuration } from "@/features/admin/services/traffic-revenue-metrics";

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


export type Ga4AnalyticsSnapshot = {
  status: "connected" | "authorization_required" | "unavailable" | "not_configured";
  startDate: string | null;
  endDate: string | null;
  activeUsers: number | null;
  sessions: number | null;
  pageViews: number | null;
  engagementRate: number | null;
  events: number | null;
  keyEvents: number | null;
  channels: Array<{ channel: string; sessions: number; activeUsers: number }> | null;
  landingPages: Array<{ page: string; sessions: number; activeUsers: number }> | null;
  capturedAt: string | null;
};

type Ga4Value = { value?: string };
type Ga4RunReport = {
  dimensionHeaders?: Array<{ name?: string }>;
  metricHeaders?: Array<{ name?: string }>;
  rows?: Array<{ dimensionValues?: Ga4Value[]; metricValues?: Ga4Value[] }>;
};

function ga4Metric(report: Ga4RunReport, row: NonNullable<Ga4RunReport["rows"]>[number] | undefined, name: string): number | null {
  if (!row) return null;
  const index = (report.metricHeaders ?? []).findIndex((header) => header.name === name);
  if (index < 0) return null;
  const value = Number(row.metricValues?.[index]?.value);
  return Number.isFinite(value) ? value : null;
}

function ga4Dimension(report: Ga4RunReport, row: NonNullable<Ga4RunReport["rows"]>[number], name: string): string | null {
  const index = (report.dimensionHeaders ?? []).findIndex((header) => header.name === name);
  const value = index < 0 ? null : row.dimensionValues?.[index]?.value;
  return typeof value === "string" && value.length > 0 ? value : null;
}

const ga4ChannelLabels: Record<string, string> = {
  Direct: "مباشر",
  "Organic Search": "بحث طبيعي",
  "Organic Social": "شبكات اجتماعية",
  "Paid Search": "بحث مدفوع",
  "Paid Social": "شبكات اجتماعية مدفوعة",
  Referral: "إحالات وروابط",
  Email: "البريد الإلكتروني",
  "Organic Video": "فيديو طبيعي",
  Display: "إعلانات عرض",
  Unassigned: "غير مصنف",
};

async function fetchGa4AnalyticsSnapshot(): Promise<Ga4AnalyticsSnapshot> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GA4_REFRESH_TOKEN?.trim();
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const unavailable = (status: Ga4AnalyticsSnapshot["status"]): Ga4AnalyticsSnapshot => ({
    status, startDate: null, endDate: null, activeUsers: null, sessions: null,
    pageViews: null, engagementRate: null, events: null, keyEvents: null,
    channels: null, landingPages: null, capturedAt: null,
  });
  if (!clientId || !clientSecret || !refreshToken || !propertyId || !/^\d+$/.test(propertyId)) {
    return unavailable("not_configured");
  }

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

    const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const dateRanges = [{ startDate: "28daysAgo", endDate: "yesterday" }];
    const headers = {
      Authorization: "Bearer " + tokenPayload.access_token,
      "Content-Type": "application/json",
    };
    const postReport = async (body: Record<string, unknown>) => fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ dateRanges, ...body }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    const [summaryResponse, channelResponse, landingResponse] = await Promise.all([
      postReport({
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "eventCount" },
          { name: "keyEvents" },
        ],
      }),
      postReport({
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "10",
      }),
      postReport({
        dimensions: [{ name: "landingPagePlusQueryString" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "10",
      }),
    ]);
    if (!summaryResponse.ok) {
      return unavailable(summaryResponse.status === 401 || summaryResponse.status === 403 ? "authorization_required" : "unavailable");
    }

    const summary = (await summaryResponse.json()) as Ga4RunReport;
    const summaryRow = summary.rows?.[0];
    let channels: Ga4AnalyticsSnapshot["channels"] = null;
    if (channelResponse.ok) {
      const report = (await channelResponse.json()) as Ga4RunReport;
      channels = (report.rows ?? []).flatMap((entry) => {
        const source = ga4Dimension(report, entry, "sessionDefaultChannelGroup");
        return source ? [{
          channel: ga4ChannelLabels[source] ?? source,
          sessions: ga4Metric(report, entry, "sessions") ?? 0,
          activeUsers: ga4Metric(report, entry, "activeUsers") ?? 0,
        }] : [];
      });
    }
    let landingPages: Ga4AnalyticsSnapshot["landingPages"] = null;
    if (landingResponse.ok) {
      const report = (await landingResponse.json()) as Ga4RunReport;
      landingPages = (report.rows ?? []).flatMap((entry) => {
        const page = ga4Dimension(report, entry, "landingPagePlusQueryString");
        return page ? [{
          page,
          sessions: ga4Metric(report, entry, "sessions") ?? 0,
          activeUsers: ga4Metric(report, entry, "activeUsers") ?? 0,
        }] : [];
      });
    }

    return {
      status: "connected",
      startDate: "28daysAgo",
      endDate: "yesterday",
      activeUsers: ga4Metric(summary, summaryRow, "activeUsers") ?? 0,
      sessions: ga4Metric(summary, summaryRow, "sessions") ?? 0,
      pageViews: ga4Metric(summary, summaryRow, "screenPageViews") ?? 0,
      engagementRate: ga4Metric(summary, summaryRow, "engagementRate"),
      events: ga4Metric(summary, summaryRow, "eventCount") ?? 0,
      keyEvents: ga4Metric(summary, summaryRow, "keyEvents") ?? 0,
      channels,
      landingPages,
      capturedAt: new Date().toISOString(),
    };
  } catch {
    // Access tokens, refresh tokens and raw API responses are never logged or returned.
    return unavailable("unavailable");
  }
}

const getCachedGa4AnalyticsSnapshot = unstable_cache(
  fetchGa4AnalyticsSnapshot,
  ["zikr-ga4-analytics-readonly-v1"],
  { revalidate: 3600 },
);

export type TrafficRevenueSnapshot = {
  generatedAt: string;
  period: { timezone: "UTC"; start24h: string; start7d: string; end: string };
  metrics: {
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
  integrations: {
    ga4MeasurementConfigured: boolean;
    ga4ReportingConnected: boolean;
    monetagVerificationMetaPresent: true;
    monetagSmartLinkConfigured: true;
    monetagReportingConnected: false;
    youtubeAnalyticsConfigured: boolean;
    youtubeAnalyticsConnected: boolean;
  };
  youtubeAnalytics: YoutubeAnalyticsSnapshot;
  ga4Analytics: Ga4AnalyticsSnapshot;
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
  const refreshToken = await getYouTubeRefreshToken();
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
  (_credentialFingerprint: string) => fetchYoutubeAnalyticsSnapshot(),
  ["zikr-youtube-analytics-readonly-v2"],
  { revalidate: 3600 },
);

/**
 * Reads exact server-side operational counts and verified YouTube Analytics
 * reports. Public YouTube Data API statistics are not substituted for owner analytics.
 */
export async function getTrafficRevenueSnapshot(): Promise<TrafficRevenueSnapshot> {
  const supabase = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // A newly authorized read-only refresh token gets a separate cache entry.
  // Hash it so the cache key never contains the raw credential.
  const youtubeRefreshToken = await getYouTubeRefreshToken();
  const youtubeCredentialFingerprint = youtubeRefreshToken
    ? createHash("sha256").update(youtubeRefreshToken).digest("hex")
    : "not-configured";

  const [
    videoCompleted,
    videoFailed,
    videoRetryPending,
    videoRequested24h,
    videoRequested7d,
    videoCompleted24h,
    videoCompleted7d,
    renderDurations,
    publishedArticles,
    publishedVideos,
    youtubeAnalytics,
    ga4Analytics,
  ] = await Promise.all([
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "failed"]).not("next_retry_at", "is", null),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).gte("created_at", start24h),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).gte("created_at", start7d),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "completed").gte("updated_at", start24h),
    supabase.from("video_generation_requests").select("id", { count: "exact", head: true }).eq("status", "completed").gte("updated_at", start7d),
    supabase.from("video_generation_requests").select("render_duration_ms", { count: "exact" }).eq("status", "completed").not("render_duration_ms", "is", null).gte("updated_at", start7d).limit(1000),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("videos").select("id", { count: "exact", head: true }).eq("published", true),
    getCachedYoutubeAnalyticsSnapshot(youtubeCredentialFingerprint),
    getCachedGa4AnalyticsSnapshot(),
  ]);

  const metrics = {
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

  const unavailable: string[] = [];
  if ([metrics.videoCompleted, metrics.videoFailed, metrics.videoRetryPending].some((value) => value === null)) unavailable.push("حالة عمليات إنتاج الفيديو");
  if ([metrics.videoRequested24h, metrics.videoRequested7d, metrics.videoCompleted24h, metrics.videoCompleted7d].some((value) => value === null)) unavailable.push("اتجاهات إنتاج الفيديو");
  if (metrics.averageRenderDurationMs7d === null) unavailable.push("متوسط مدة الرندر");
  if (metrics.publishedArticles === null || metrics.publishedVideos === null) unavailable.push("المحتوى المنشور");
  if (youtubeAnalytics.status !== "connected") unavailable.push("YouTube Analytics");
  if (ga4Analytics.status !== "connected") unavailable.push("GA4");

  const hasYoutubeAnalyticsCredentials = Boolean(
    process.env.YOUTUBE_CLIENT_ID?.trim() &&
    process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
    youtubeRefreshToken,
  );

  return {
    generatedAt: nowIso,
    period: { timezone: "UTC", start24h, start7d, end: nowIso },
    metrics,
    integrations: {
      ga4MeasurementConfigured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      ga4ReportingConnected: ga4Analytics.status === "connected",
      monetagVerificationMetaPresent: true,
      monetagSmartLinkConfigured: true,
      monetagReportingConnected: false,
      youtubeAnalyticsConfigured: hasYoutubeAnalyticsCredentials,
      youtubeAnalyticsConnected: youtubeAnalytics.status === "connected",
    },
    youtubeAnalytics,
    ga4Analytics,
    unavailable,
  };
}
