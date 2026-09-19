import "server-only";

import {
  assertSupabaseConnection,
  supabaseServerAdminCount,
  supabaseServerAdminRequest,
} from "@/lib/supabase/server";
import type { AdminPermission } from "@/features/admin/services/permissions";

export type AdminMetric = {
  key: string;
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export type AdminAuditRow = {
  id: string;
  action: string;
  permission: AdminPermission | null;
  resource_type: string | null;
  resource_id: string | null;
  outcome: "success" | "denied" | "failed";
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_user_id: string | null;
};

export type AdminHealth = {
  database: "healthy" | "degraded";
  tables: Array<{ table: string; count: number; state: "healthy" | "empty" | "unavailable" }>;
  queues: {
    socialQueued: number;
    socialFailed: number;
    videoPending: number;
    videoProcessing: number;
    videoFailed: number;
  };
  generatedAt: string;
};

const COUNT_TABLES: Array<{ table: string; label: string }> = [
  { table: "profiles", label: "المستخدمون" },
  { table: "articles", label: "المقالات" },
  { table: "stories", label: "القصص" },
  { table: "content_library", label: "مكتبة المحتوى" },
  { table: "videos", label: "الفيديوهات" },
  { table: "hadiths", label: "الأحاديث" },
  { table: "duas", label: "الأدعية" },
  { table: "prophets", label: "الأنبياء" },
  { table: "companions", label: "الصحابة" },
  { table: "scholars", label: "العلماء" },
  { table: "kids_content", label: "محتوى الأطفال" },
  { table: "media_assets", label: "الوسائط" },
];

async function safeCount(table: string) {
  try {
    return await supabaseServerAdminCount(table);
  } catch {
    return 0;
  }
}

export async function getAdminSnapshot() {
  const counts = await Promise.all(
    COUNT_TABLES.map(async ({ table, label }) => ({
      table,
      label,
      count: await safeCount(table),
    })),
  );

  const [audit, socialQueue, videoQueue, contentDrafts] = await Promise.all([
    supabaseServerAdminRequest<AdminAuditRow[]>(
      "/rest/v1/admin_audit_events?select=id,action,permission,resource_type,resource_id,outcome,request_id,metadata,created_at,actor_user_id&order=created_at.desc&limit=12",
      { method: "GET" },
    ).catch(() => []),
    supabaseServerAdminRequest<Array<{ status: string }>>(
      "/rest/v1/social_publish_queue?select=status&order=created_at.desc&limit=500",
      { method: "GET" },
    ).catch(() => []),
    supabaseServerAdminRequest<Array<{ status: string }>>(
      "/rest/v1/video_generation_requests?select=status&order=created_at.desc&limit=500",
      { method: "GET" },
    ).catch(() => []),
    supabaseServerAdminRequest<Array<{ review_status: string; published: boolean }>>(
      "/rest/v1/content_library?select=review_status,published&order=updated_at.desc&limit=500",
      { method: "GET" },
    ).catch(() => []),
  ]);

  const socialStatus = (status: string) => socialQueue.filter((item) => item.status === status).length;
  const videoStatus = (status: string) => videoQueue.filter((item) => item.status === status).length;
  const drafts = contentDrafts.filter((item) => !item.published || item.review_status !== "approved").length;

  return {
    counts,
    metrics: [
      { key: "drafts", label: "مسودات/مراجعة", value: drafts, tone: drafts > 0 ? "warning" : "success" },
      { key: "social", label: "طابور النشر", value: socialStatus("queued") + socialStatus("processing"), tone: socialStatus("failed") > 0 ? "danger" : "neutral" },
      { key: "video", label: "توليد الفيديو", value: videoStatus("pending") + videoStatus("processing"), tone: videoStatus("failed") > 0 ? "danger" : "neutral" },
      { key: "auditFailures", label: "عمليات إدارية فاشلة", value: audit.filter((row) => row.outcome === "failed").length, tone: audit.some((row) => row.outcome === "failed") ? "danger" : "success" },
    ] satisfies AdminMetric[],
    queues: {
      socialQueued: socialStatus("queued"),
      socialProcessing: socialStatus("processing"),
      socialFailed: socialStatus("failed"),
      videoPending: videoStatus("pending"),
      videoProcessing: videoStatus("processing"),
      videoFailed: videoStatus("failed"),
    },
    audit,
    generatedAt: new Date().toISOString(),
  };
}

export async function getAdminHealth(): Promise<AdminHealth> {
  const databaseHealthy = await assertSupabaseConnection();
  const tables = await Promise.all(
    ["admin_audit_events", "admin_settings", "profiles", "content_library", "media_assets", "social_publish_queue", "video_generation_requests"].map(async (table) => {
      try {
        const count = await supabaseServerAdminCount(table);
        return {
          table,
          count,
          state: count === 0 ? "empty" : "healthy",
        } as const;
      } catch {
        return { table, count: 0, state: "unavailable" } as const;
      }
    }),
  );

  const [social, video] = await Promise.all([
    supabaseServerAdminRequest<Array<{ status: string }>>(
      "/rest/v1/social_publish_queue?select=status&limit=500",
      { method: "GET" },
    ).catch(() => []),
    supabaseServerAdminRequest<Array<{ status: string }>>(
      "/rest/v1/video_generation_requests?select=status&limit=500",
      { method: "GET" },
    ).catch(() => []),
  ]);

  return {
    database: databaseHealthy ? "healthy" : "degraded",
    tables,
    queues: {
      socialQueued: social.filter((row) => row.status === "queued").length,
      socialFailed: social.filter((row) => row.status === "failed").length,
      videoPending: video.filter((row) => row.status === "pending").length,
      videoProcessing: video.filter((row) => row.status === "processing").length,
      videoFailed: video.filter((row) => row.status === "failed").length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function getAdminSettings(): Promise<Record<string, unknown>> {
  const rows = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
    "/rest/v1/admin_settings?select=key,value&order=key.asc",
    { method: "GET" },
  ).catch(() => []);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function searchAdminContent(query: string) {
  const term = query.trim();
  if (!term) return [];
  const pattern = encodeURIComponent(`%${term}%`);
  const requests = [
    ["مقال", "/rest/v1/articles?select=id,title,slug,published,updated_at&or=(title.ilike." + pattern + ",content.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["قصة", "/rest/v1/stories?select=id,title,slug,published,updated_at&or=(title.ilike." + pattern + ",content.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["فيديو", "/rest/v1/videos?select=id,title,slug,published,updated_at&or=(title.ilike." + pattern + ",description.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["مكتبة", "/rest/v1/content_library?select=id,title_ar,title_en,slug,published,updated_at&or=(title_ar.ilike." + pattern + ",title_en.ilike." + pattern + ",body_ar.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
  ] as const;

  const results = await Promise.all(
    requests.map(async ([type, path]) => {
      try {
        const rows = await supabaseServerAdminRequest<Array<Record<string, unknown>>>(path, { method: "GET" });
        return rows.map((row) => ({
          type,
          id: String(row.id ?? ""),
          title: String(row.title ?? row.title_ar ?? row.title_en ?? "بدون عنوان"),
          slug: typeof row.slug === "string" ? row.slug : null,
          published: Boolean(row.published),
          updated_at: String(row.updated_at ?? ""),
        }));
      } catch {
        return [];
      }
    }),
  );

  return results.flat().sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}
