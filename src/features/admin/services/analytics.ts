import "server-only";

import { createClient, supabaseServerAdminCount, supabaseServerAdminRequest } from "@/lib/supabase/server";

export interface TopArticle {
  id: string;
  title: string;
  views: number;
  slug: string;
}

export type AdminAnalytics = {
  stats: Record<string, number | null>;
  topArticles: TopArticle[];
  userCount: number | null;
  activeUsers: number | null;
  dashboardVisits: number | null;
  activityByDay: Array<{ label: string; count: number }>;
  routeViews: Array<{ route: string; views: number }>;
  unavailable: string[];
};

const CONTENT_TABLES = [
  "articles", "stories", "duas", "prophets", "companions", "scholars", "videos", "quran_surahs",
] as const;

async function safeCount(table: string) {
  try { return await supabaseServerAdminCount(table); } catch { return null; }
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [counts, topArticles, userCount, viewsRes, auditRes] = await Promise.all([
    Promise.all(CONTENT_TABLES.map((table) => safeCount(table))),
    getTopArticles(),
    safeCount("profiles"),
    supabaseServerAdminRequest<Array<{ route: string; viewed_at: string }>>(
      "/rest/v1/admin_page_views?select=route,viewed_at&order=viewed_at.desc&limit=500",
    ).then((rows) => ({ ok: true, rows })).catch(() => ({ ok: false, rows: [] as Array<{ route: string; viewed_at: string }> })),
    supabaseServerAdminRequest<Array<{ actor_user_id: string | null; created_at: string; action: string }>>(
      "/rest/v1/admin_audit_events?select=actor_user_id,created_at,action&order=created_at.desc&limit=500",
    ).then((rows) => ({ ok: true, rows })).catch(() => ({ ok: false, rows: [] as Array<{ actor_user_id: string | null; created_at: string; action: string }> })),
  ]);

  const unavailable: string[] = [];
  if (userCount === null) unavailable.push("المستخدمون");
  if (!viewsRes.ok) unavailable.push("زيارات لوحة التحكم");
  if (!auditRes.ok) unavailable.push("نشاط الإدارة");

  const now = Date.now();
  const activeUsers = auditRes.ok
    ? new Set(auditRes.rows.filter((row) => now - new Date(row.created_at).getTime() < 7 * 86_400_000 && row.actor_user_id).map((row) => row.actor_user_id)).size
    : null;
  const dashboardVisits = viewsRes.ok ? viewsRes.rows.length : null;
  const routeMap = new Map<string, number>();
  for (const row of viewsRes.rows) routeMap.set(row.route, (routeMap.get(row.route) ?? 0) + 1);

  const dayMap = new Map<string, number>();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now - offset * 86_400_000);
    dayMap.set(date.toISOString().slice(0, 10), 0);
  }
  for (const row of viewsRes.rows) {
    const day = new Date(row.viewed_at).toISOString().slice(0, 10);
    if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  return {
    stats: Object.fromEntries(CONTENT_TABLES.map((table, index) => [table, counts[index]])),
    topArticles,
    userCount,
    activeUsers,
    dashboardVisits,
    activityByDay: [...dayMap.entries()].map(([key, count]) => ({ label: new Date(`${key}T12:00:00Z`).toLocaleDateString("ar-EG-u-nu-latn", { weekday: "short" }), count })),
    routeViews: [...routeMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([route, views]) => ({ route, views })),
    unavailable,
  };
}

async function getTopArticles(): Promise<TopArticle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("articles").select("id, title, views, slug").eq("published", true).order("views", { ascending: false }).limit(10);
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, title: row.title, views: row.views ?? 0, slug: row.slug }));
  } catch (error) {
    console.error("[admin/analytics] failed to load top articles:", error);
    return [];
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
