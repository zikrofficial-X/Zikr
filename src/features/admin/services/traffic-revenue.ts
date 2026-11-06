import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

type CountResult = { count: number | null; error: { message: string } | null };

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
  };
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

/**
 * Reads exact, server-side operational counts only.
 * It intentionally does not treat admin page views as public traffic and does
 * not fabricate GA4, Monetag impression, or revenue figures.
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

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    integrations: {
      ga4MeasurementConfigured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      ga4ReportingConnected: false,
      monetagVerificationMetaPresent: true,
      monetagSmartLinkConfigured: true,
      monetagReportingConnected: false,
    },
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
