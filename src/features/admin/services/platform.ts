import "server-only";

import {
  assertSupabaseConnection,
  supabaseServerAdminCount,
  supabaseServerAdminRequest,
} from "@/lib/supabase/server";
import type { AdminPermission } from "@/features/admin/services/permissions";
import { readAdminRows } from "@/features/admin/services/safe-read";
import { getServerEnv } from "@/lib/env";

export type AdminMetric = {
  key: string;
  label: string;
  /** null means the source could not be read; never render it as zero. */
  value: number | null;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export type AdminCountRow = {
  table: string;
  label: string;
  count: number | null;
  state: "available" | "unavailable";
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

export type AdminGitHubStatus = {
  context: string;
  state: string;
  description: string | null;
  targetUrl: string | null;
  updatedAt: string | null;
};

export type AdminWorkflowRun = {
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  url: string;
};

export type AdminGitHubHealth = {
  statusesAvailable: boolean;
  workflowsAvailable: boolean;
  overall: string | null;
  commitSha: string | null;
  statuses: AdminGitHubStatus[];
  workflows: AdminWorkflowRun[];
};

export type AdminHealth = {
  database: "healthy" | "degraded";
  tables: Array<{ table: string; count: number | null; state: "healthy" | "empty" | "unavailable" }>;
  queues: {
    videoPending: number;
    videoProcessing: number;
    videoRetryWait: number;
    videoFailed: number;
  };
  /** false means the queue could not be read and its counts are not real zeros. */
  queuesAvailable: { video: boolean };
  github: AdminGitHubHealth;
  generatedAt: string;
};

const COUNT_TABLES: Array<{ table: string; label: string }> = [
  { table: "articles", label: "المقالات" },
  { table: "stories", label: "القصص" },
  { table: "content_library", label: "مكتبة المحتوى" },
  { table: "hadiths", label: "الأحاديث" },
  { table: "duas", label: "الأدعية" },
  { table: "prophets", label: "الأنبياء" },
  { table: "companions", label: "الصحابة" },
  { table: "scholars", label: "العلماء" },
  { table: "quran_surahs", label: "السور القرآنية" },
  { table: "quran_reciters", label: "القراء" },
  { table: "quran_audio", label: "ملفات التلاوة" },
  { table: "tawasheeh", label: "التواشيح" },
  { table: "site_audio_assets", label: "مكتبة صوت الموقع" },
  { table: "kids_content", label: "محتوى الأطفال" },
  { table: "kids_games", label: "الألعاب" },
  { table: "kids_game_levels", label: "مستويات الألعاب" },
  { table: "videos", label: "الفيديوهات" },
  { table: "media_assets", label: "أصول الوسائط" },
  { table: "profiles", label: "المستخدمون" },
  { table: "video_generation_requests", label: "طلبات الفيديو" },
  { table: "admin_audit_events", label: "سجلات التدقيق" },
];

async function safeCount(table: string): Promise<number | null> {
  try {
    return await supabaseServerAdminCount(table);
  } catch {
    return null;
  }
}

export async function getAdminSnapshot() {
  const counts: AdminCountRow[] = await Promise.all(
    COUNT_TABLES.map(async ({ table, label }) => {
      const count = await safeCount(table);
      return { table, label, count, state: count === null ? "unavailable" : "available" };
    }),
  );

  const [auditRes, videoCounts, draftsRes] = await Promise.all([
    readAdminRows<AdminAuditRow>(
      "/rest/v1/admin_audit_events?select=id,action,permission,resource_type,resource_id,outcome,request_id,metadata,created_at,actor_user_id&order=created_at.desc&limit=12",
    ),
    getExactStatusCounts("video_generation_requests", ["pending", "processing", "retry_wait", "failed"]),
    readAdminRows<{ review_status: string; published: boolean }>(
      "/rest/v1/content_library?select=review_status,published&order=updated_at.desc&limit=500",
    ),
  ]);

  const audit = auditRes.rows;
  const contentDrafts = draftsRes.rows;
  const unavailable = [
    !auditRes.ok && "سجل التدقيق",
    !videoCounts.available && "طابور توليد الفيديو",
    !draftsRes.ok && "مكتبة المحتوى",
  ].filter(Boolean) as string[];

  const videoStatus = (status: string) => videoCounts.available ? videoCounts.counts[status] : null;
  const sum = (a: number | null, b: number | null) => (a === null || b === null ? null : a + b);
  const drafts = draftsRes.ok ? contentDrafts.filter((item) => !item.published || item.review_status !== "approved").length : null;
  const videoFailed = videoStatus("failed");
  const auditFailures = auditRes.ok ? audit.filter((row) => row.outcome === "failed").length : null;

  return {
    counts,
    unavailable,
    metrics: [
      { key: "drafts", label: "مسودات/مراجعة", value: drafts, tone: drafts === null ? "neutral" : drafts > 0 ? "warning" : "success" },
      { key: "video", label: "توليد الفيديو", value: sum(videoStatus("pending"), videoStatus("processing")), tone: videoFailed ? "danger" : "neutral" },
      { key: "auditFailures", label: "عمليات إدارية فاشلة", value: auditFailures, tone: auditFailures === null ? "neutral" : auditFailures > 0 ? "danger" : "success" },
    ] satisfies AdminMetric[],
    queues: {
      videoPending: videoStatus("pending"),
      videoProcessing: videoStatus("processing"),
      videoFailed,
    },
    audit,
    generatedAt: new Date().toISOString(),
  };
}

const OVERVIEW_TABLES = [
  ["videos", "الفيديوهات"],
  ["articles", "المقالات"],
  ["stories", "القصص"],
  ["duas", "الأدعية"],
  ["competitions", "المسابقات"],
  ["kids_content", "محتوى الأطفال"],
  ["profiles", "المستخدمون"],
  ["prophets", "الأنبياء"],
  ["companions", "الصحابة"],
  ["scholars", "العلماء"],
  ["conquests", "الفتوحات"],
  ["battles", "الغزوات"],
  ["tawasheeh", "التواشيح"],
  ["quran_reciters", "القراء"],
  ["quran_surahs", "السور"],
  ["hadiths", "الأحاديث"],
] as const;

export async function getAdminOverview() {
  const counts = await Promise.all(
    OVERVIEW_TABLES.map(async ([table, label]) => [
      table,
      { label, count: await safeCount(table) },
    ] as const),
  );

  const [videoCounts, sectionsRes] = await Promise.all([
    getExactStatusCounts("video_generation_requests", ["pending", "processing", "retry_wait", "failed"]),
    readAdminRows<{ value?: unknown }>("/rest/v1/site_settings?key=eq.section_visibility&select=value&limit=1"),
  ]);
  const sections = sectionsRes.rows;
  const unavailable = [
    !videoCounts.available && "video_generation_requests",
    !sectionsRes.ok && "site_settings",
  ].filter(Boolean) as string[];

  const visibility =
    sections[0]?.value && typeof sections[0].value === "object"
      ? (sections[0].value as { visibility?: Record<string, boolean> }).visibility ?? {}
      : {};

  return {
    counts: Object.fromEntries(counts),
    unavailable,
    videoGeneration: videoCounts.counts,
    sections: {
      total: Object.keys(visibility).length,
      enabled: Object.values(visibility).filter(Boolean).length,
      disabled: Object.values(visibility).filter((value) => !value).length,
    },
    generatedAt: new Date().toISOString(),
  };
}

const GITHUB_WORKFLOW_PATHS = new Set([
  ".github/workflows/supabase-production-health.yml",
  ".github/workflows/generate-ai-video.yml",
  ".github/workflows/publish-social.yml",
  ".github/workflows/storage-retention.yml",
  ".github/workflows/dispatch-android-release-recovery.yml",
]);

async function getAdminGitHubHealth(): Promise<AdminGitHubHealth> {
  const token = getServerEnv().GITHUB_DISPATCH_TOKEN;
  if (!token) {
    return {
      statusesAvailable: false,
      workflowsAvailable: false,
      overall: null,
      commitSha: null,
      statuses: [],
      workflows: [],
    };
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const [statusResult, runsResult] = await Promise.allSettled([
    fetch("https://api.github.com/repos/zikrofficial-X/Zikr/commits/main/status", {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
    fetch("https://api.github.com/repos/zikrofficial-X/Zikr/actions/runs?branch=main&per_page=30", {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  let statusesAvailable = false;
  let workflowsAvailable = false;
  let overall: string | null = null;
  let commitSha: string | null = null;
  let statuses: AdminGitHubStatus[] = [];
  let workflows: AdminWorkflowRun[] = [];

  if (statusResult.status === "fulfilled" && statusResult.value.ok) {
    try {
      const payload = await statusResult.value.json() as {
        state?: string;
        sha?: string;
        statuses?: Array<{ context?: string; state?: string; description?: string | null; target_url?: string | null; updated_at?: string | null }>;
      };
      statusesAvailable = true;
      overall = payload.state ?? null;
      commitSha = payload.sha ?? null;
      statuses = (payload.statuses ?? []).map((item) => ({
        context: item.context ?? "unknown",
        state: item.state ?? "unknown",
        description: item.description ?? null,
        targetUrl: item.target_url ?? null,
        updatedAt: item.updated_at ?? null,
      }));
    } catch {
      statusesAvailable = false;
    }
  }

  if (runsResult.status === "fulfilled" && runsResult.value.ok) {
    try {
      const payload = await runsResult.value.json() as {
        workflow_runs?: Array<{ path?: string; name?: string; status?: string; conclusion?: string | null; created_at?: string; html_url?: string }>;
      };
      workflowsAvailable = true;
      workflows = (payload.workflow_runs ?? [])
        .filter((run) => GITHUB_WORKFLOW_PATHS.has(run.path ?? ""))
        .map((run) => ({
          name: run.name ?? run.path ?? "Workflow",
          status: run.status ?? "unknown",
          conclusion: run.conclusion ?? null,
          createdAt: run.created_at ?? "",
          url: run.html_url ?? "",
        }));
    } catch {
      workflowsAvailable = false;
    }
  }

  return { statusesAvailable, workflowsAvailable, overall, commitSha, statuses, workflows };
}

async function getExactStatusCounts(
  table: string,
  statuses: readonly string[],
): Promise<{ counts: Record<string, number>; available: boolean }> {
  const results = await Promise.all(
    statuses.map(async (status) => {
      try {
        return [status, await supabaseServerAdminCount(table, { column: "status", value: status })] as const;
      } catch {
        return [status, null] as const;
      }
    }),
  );
  return {
    counts: Object.fromEntries(results.map(([status, count]) => [status, count ?? 0])),
    available: results.every(([, count]) => count !== null),
  };
}

export async function getAdminHealth(): Promise<AdminHealth> {
  const [databaseHealthy, tables, video, github] = await Promise.all([
    assertSupabaseConnection(),
    Promise.all(
      ["admin_audit_events", "admin_settings", "profiles", "content_library", "media_assets", "video_generation_requests"].map(async (table) => {
        try {
          const count = await supabaseServerAdminCount(table);
          return { table, count, state: count === 0 ? "empty" : "healthy" } as const;
        } catch {
          return { table, count: null, state: "unavailable" } as const;
        }
      }),
    ),
    getExactStatusCounts("video_generation_requests", ["pending", "processing", "retry_wait", "failed"]),
    getAdminGitHubHealth(),
  ]);

  return {
    database: databaseHealthy ? "healthy" : "degraded",
    tables,
    queues: {
      videoPending: video.counts.pending,
      videoProcessing: video.counts.processing,
      videoRetryWait: video.counts.retry_wait,
      videoFailed: video.counts.failed,
    },
    queuesAvailable: { video: video.available },
    github,
    generatedAt: new Date().toISOString(),
  };
}

export async function getAdminSettings(): Promise<Record<string, unknown>> {
  // Settings drive editable forms and security toggles, so an unreadable table must surface as an
  // error instead of silently rendering default values that an admin could then save over real ones.
  const rows = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
    "/rest/v1/admin_settings?select=key,value&order=key.asc",
    { method: "GET" },
  );
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export type AdminSearchResult = {
  type: string;
  id: string;
  title: string;
  slug: string | null;
  published: boolean;
  updated_at: string;
};

export async function searchAdminContent(query: string): Promise<{
  items: AdminSearchResult[];
  unavailableSources: string[];
}> {
  const term = query.trim();
  if (!term) return { items: [], unavailableSources: [] };
  const pattern = encodeURIComponent(`%${term}%`);
  const requests = [
    ["مقال", "/rest/v1/articles?select=id,title,slug,published,updated_at&or=(title.ilike." + pattern + ",content.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["قصة", "/rest/v1/stories?select=id,title,slug,published,updated_at&or=(title.ilike." + pattern + ",content.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["فيديو", "/rest/v1/videos?select=id,title,slug,published,updated_at&or=(title.ilike." + pattern + ",description.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["حديث", "/rest/v1/hadiths?select=id,text_ar,grade_ar,updated_at&or=(text_ar.ilike." + pattern + ",grade_ar.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["دعاء", "/rest/v1/duas?select=id,title_ar,text_ar,published,updated_at&or=(title_ar.ilike." + pattern + ",text_ar.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
    ["مكتبة", "/rest/v1/content_library?select=id,title_ar,title_en,slug,published,updated_at&or=(title_ar.ilike." + pattern + ",title_en.ilike." + pattern + ",body_ar.ilike." + pattern + ")&order=updated_at.desc&limit=10"],
  ] as const;

  const results = await Promise.all(
    requests.map(async ([type, path]) => {
      try {
        const rows = await supabaseServerAdminRequest<Array<Record<string, unknown>>>(path, { method: "GET" });
        return {
          type,
          ok: true,
          rows: rows.map((row) => ({
            type,
            id: String(row.id ?? ""),
            title: String(row.title ?? row.title_ar ?? row.title_en ?? row.text_ar ?? "بدون عنوان"),
            slug: typeof row.slug === "string" ? row.slug : null,
            published: Boolean(row.published),
            updated_at: String(row.updated_at ?? ""),
          })),
        };
      } catch (error) {
        console.error("[admin/search] failed to search source:", type, error);
        return { type, ok: false, rows: [] as AdminSearchResult[] };
      }
    }),
  );

  return {
    items: results.flatMap((result) => result.rows).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    ),
    unavailableSources: results.filter((result) => !result.ok).map((result) => result.type),
  };
}
