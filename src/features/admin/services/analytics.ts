import "server-only";

import { unstable_cache } from "next/cache";
import { supabaseServerAdminCount, supabaseServerAdminRequest } from "@/lib/supabase/server";

export interface TopArticle {
  id: string;
  title: string;
  views: number;
  slug: string;
}

export type AdminAnalytics = {
  stats: Record<string, number | null>;
  topArticles: TopArticle[];
  topArticlesAvailable: boolean;
  userCount: number | null;
  activeUsers: number | null;
  dashboardVisits: number | null;
  activityByDay: Array<{ label: string; count: number }>;
  routeViews: Array<{ route: string; views: number }>;
  unavailable: string[];
};

const CONTENT_TABLES = [
  "articles",
  "stories",
  "duas",
  "prophets",
  "companions",
  "scholars",
  "videos",
  "quran_surahs",
] as const;

const CONTENT_LABELS: Record<(typeof CONTENT_TABLES)[number], string> = {
  articles: "المقالات",
  stories: "القصص",
  duas: "الأدعية",
  prophets: "الأنبياء",
  companions: "الصحابة",
  scholars: "العلماء",
  videos: "الفيديوهات",
  quran_surahs: "السور القرآنية",
};

const DAY_MS = 86_400_000;

async function safeCount(table: string): Promise<number | null> {
  try {
    return await supabaseServerAdminCount(table);
  } catch {
    return null;
  }
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return getCachedAdminAnalytics();
}

// Authorization remains outside this cache in the page. Only aggregate counts,
// operational activity summaries, and editorial rankings are cached for 30s.
const getCachedAdminAnalytics = unstable_cache(
  loadAdminAnalytics,
  ["admin-analytics-v2"],
  { revalidate: 30, tags: ["admin-analytics"] },
);

async function loadAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date();
  const todayUtcStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const periodStartMs = todayUtcStart - 6 * DAY_MS;
  const periodStart = new Date(periodStartMs).toISOString();

  const [counts, topArticlesResult, userCount, viewsRes, auditRes] = await Promise.all([
    Promise.all(CONTENT_TABLES.map((table) => safeCount(table))),
    getTopArticles(),
    safeCount("profiles"),
    supabaseServerAdminRequest<Array<{ route: string; viewed_at: string }>>(
      "/rest/v1/admin_page_views?select=route,viewed_at&viewed_at=gte." +
        encodeURIComponent(periodStart) +
        "&order=viewed_at.desc&limit=500",
    )
      .then((rows) => ({ ok: true, rows }))
      .catch(() => ({ ok: false, rows: [] as Array<{ route: string; viewed_at: string }> })),
    supabaseServerAdminRequest<Array<{ actor_user_id: string | null; created_at: string; action: string }>>(
      "/rest/v1/admin_audit_events?select=actor_user_id,created_at,action&created_at=gte." +
        encodeURIComponent(periodStart) +
        "&order=created_at.desc&limit=500",
    )
      .then((rows) => ({ ok: true, rows }))
      .catch(() => ({
        ok: false,
        rows: [] as Array<{ actor_user_id: string | null; created_at: string; action: string }>,
      })),
  ]);

  const unavailable: string[] = [];
  if (userCount === null) unavailable.push("المستخدمون");
  if (!viewsRes.ok) unavailable.push("زيارات لوحة التحكم");
  if (!auditRes.ok) unavailable.push("نشاط الإدارة");
  if (!topArticlesResult.available) unavailable.push("أداء المقالات");

  const unavailableContent = CONTENT_TABLES.filter((table, index) => counts[index] === null).map(
    (table) => CONTENT_LABELS[table],
  );
  if (unavailableContent.length) {
    unavailable.push("إحصاءات المحتوى: " + unavailableContent.join("، "));
  }

  const recentViews = viewsRes.ok
    ? viewsRes.rows.filter((row) => {
        const timestamp = Date.parse(row.viewed_at);
        return Number.isFinite(timestamp) && timestamp >= periodStartMs && timestamp <= now.getTime();
      })
    : [];
  const recentAuditEvents = auditRes.ok
    ? auditRes.rows.filter((row) => {
        const timestamp = Date.parse(row.created_at);
        return Number.isFinite(timestamp) && timestamp >= periodStartMs && timestamp <= now.getTime();
      })
    : [];

  const activeUsers = auditRes.ok
    ? new Set(recentAuditEvents.filter((row) => row.actor_user_id).map((row) => row.actor_user_id)).size
    : null;

  const routeMap = new Map<string, number>();
  for (const row of recentViews) {
    routeMap.set(row.route, (routeMap.get(row.route) ?? 0) + 1);
  }

  const dayMap = new Map<string, number>();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(todayUtcStart - offset * DAY_MS);
    dayMap.set(date.toISOString().slice(0, 10), 0);
  }
  for (const row of recentViews) {
    const day = new Date(row.viewed_at).toISOString().slice(0, 10);
    if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  return {
    stats: Object.fromEntries(
      CONTENT_TABLES.map((table, index) => [table, counts[index]]),
    ) as Record<string, number | null>,
    topArticles: topArticlesResult.rows,
    topArticlesAvailable: topArticlesResult.available,
    userCount,
    activeUsers,
    dashboardVisits: viewsRes.ok ? recentViews.length : null,
    activityByDay: [...dayMap.entries()].map(([key, count]) => ({
      label: new Date(key + "T12:00:00Z").toLocaleDateString("ar-EG-u-nu-latn", { weekday: "short" }),
      count,
    })),
    routeViews: [...routeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([route, views]) => ({ route, views })),
    unavailable,
  };
}

async function getTopArticles(): Promise<{ rows: TopArticle[]; available: boolean }> {
  try {
    const data = await supabaseServerAdminRequest<
      Array<{ id: string; title: string; views: number | null; slug: string }>
    >("/rest/v1/articles?select=id,title,views,slug&published=eq.true&order=views.desc.nullslast&limit=10");
    return {
      rows: data.map((row) => ({ id: row.id, title: row.title, views: row.views ?? 0, slug: row.slug })),
      available: true,
    };
  } catch (error) {
    console.error("[admin/analytics] failed to load top articles:", error);
    return { rows: [], available: false };
  }
}

export async function recordAdminPageView(route: string, actorUserId: string | null) {
  if (!route.startsWith("/admin")) return;
  await supabaseServerAdminRequest("/rest/v1/admin_page_views", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ route: route.slice(0, 180), actor_user_id: actorUserId }),
  }).catch((error) => console.warn("[admin/analytics] page view not recorded", error));
}
