import "server-only";

import {
  createClient,
  supabaseServerAdminRequest,
} from "@/lib/supabase/server";

export type ManagedContentItem = {
  id: string;
  title: string;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  type: string;
  table: "stories" | "articles" | "competitions" | "memorization_plans" | "pinned_messages";
};

export type ScheduledContentItem = {
  id: string;
  content_table: ManagedContentItem["table"];
  content_id: string;
  scheduled_at: string;
  status: "queued" | "processing" | "published" | "cancelled" | "failed";
};

export type AdminReadResult<T> = {
  items: T[];
  available: boolean;
  failedSources: string[];
};

export async function getScheduledContent(): Promise<AdminReadResult<ScheduledContentItem>> {
  try {
    const items = await supabaseServerAdminRequest<ScheduledContentItem[]>(
      "/rest/v1/content_publish_queue?status=eq.queued&select=id,content_table,content_id,scheduled_at,status&order=scheduled_at.asc&limit=20",
      { method: "GET" },
    );
    return { items: items ?? [], available: true, failedSources: [] };
  } catch (error) {
    console.error("[admin/content] failed to load scheduled content:", error);
    return { items: [], available: false, failedSources: ["content_publish_queue"] };
  }
}

export async function getManagedContent(): Promise<AdminReadResult<ManagedContentItem>> {
  try {
    const supabase = await createClient();
    const [storiesRes, articlesRes, competitionsRes, plansRes, pinnedRes] =
      await Promise.all([
        supabase
          .from("stories")
          .select("id, title, published, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("articles")
          .select("id, title, published, views, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("competitions")
          .select("id, title, published, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("memorization_plans")
          .select("id, title, published, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(20),
        // Production schema uses "published" on pinned_messages (not "is_active").
        supabase
          .from("pinned_messages")
          .select("id, title, published, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const sources = [
      ["stories", storiesRes],
      ["articles", articlesRes],
      ["competitions", competitionsRes],
      ["memorization_plans", plansRes],
      ["pinned_messages", pinnedRes],
    ] as const;
    const failedSources = sources.filter(([, result]) => result.error).map(([name]) => name);

    const items: ManagedContentItem[] = [
      ...(storiesRes.data ?? []).map((item) => ({
        id: item.id, title: item.title, published: item.published ?? false, views: 0,
        created_at: item.created_at, updated_at: item.updated_at, type: "قصة", table: "stories" as const,
      })),
      ...(articlesRes.data ?? []).map((item) => ({
        id: item.id, title: item.title, published: item.published ?? false, views: item.views ?? 0,
        created_at: item.created_at, updated_at: item.updated_at, type: "مقالة", table: "articles" as const,
      })),
      ...(competitionsRes.data ?? []).map((item) => ({
        id: item.id, title: item.title, published: item.published ?? false, views: 0,
        created_at: item.created_at, updated_at: item.updated_at, type: "مسابقة", table: "competitions" as const,
      })),
      ...(plansRes.data ?? []).map((item) => ({
        id: item.id, title: item.title, published: item.published ?? false, views: 0,
        created_at: item.created_at, updated_at: item.updated_at, type: "خطة حفظ", table: "memorization_plans" as const,
      })),
      ...(pinnedRes.data ?? []).map((item) => ({
        id: item.id, title: item.title ?? "رسالة مثبتة", published: item.published ?? false, views: 0,
        created_at: item.created_at, updated_at: item.updated_at, type: "رسالة مثبتة", table: "pinned_messages" as const,
      })),
    ];

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    for (const [source, result] of sources) {
      if (result.error) console.error(`[admin/content] ${source} query failed:`, result.error);
    }
    return { items, available: failedSources.length === 0, failedSources };
  } catch (error) {
    console.error("[admin/content] failed to load managed content:", error);
    return { items: [], available: false, failedSources: ["content_catalogue"] };
  }
}

export type AdminContentApiItem = {
  id: string;
  title: string;
  type: "story" | "article";
  status: "published" | "draft";
  views: number;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminContentApi(): Promise<AdminContentApiItem[]> {
  const [stories, articles] = await Promise.all([
    supabaseServerAdminRequest<
      Array<{
        id: string;
        title: string;
        published: boolean | null;
        views: number | null;
        created_at: string;
        updated_at: string;
      }>
    >(
      "/rest/v1/stories?select=id,title,published,views,created_at,updated_at&limit=300",
      { method: "GET" },
    ),
    supabaseServerAdminRequest<
      Array<{
        id: string;
        title: string;
        published: boolean | null;
        views: number | null;
        created_at: string;
        updated_at: string;
      }>
    >(
      "/rest/v1/articles?select=id,title,published,views,created_at,updated_at&limit=300",
      { method: "GET" },
    ),
  ]);

  return [
    ...stories.map((row) => ({
      id: row.id,
      title: row.title,
      type: "story" as const,
      status: row.published ? ("published" as const) : ("draft" as const),
      views: row.views ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    ...articles.map((row) => ({
      id: row.id,
      title: row.title,
      type: "article" as const,
      status: row.published ? ("published" as const) : ("draft" as const),
      views: row.views ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  ];
}


export type ManagedContentTable =
  | "stories"
  | "articles"
  | "competitions"
  | "memorization_plans"
  | "pinned_messages";

const MANAGED_CONTENT_TABLES = new Set<ManagedContentTable>([
  "stories",
  "articles",
  "competitions",
  "memorization_plans",
  "pinned_messages",
]);

function assertManagedContentTarget(
  table: string,
  id: string,
): asserts table is ManagedContentTable {
  if (!MANAGED_CONTENT_TABLES.has(table as ManagedContentTable) || !id.trim()) {
    throw new Error("عنصر محتوى غير صالح.");
  }
}

export async function toggleManagedContent(
  table: string,
  id: string,
  published: boolean,
  optimisticUpdatedAt?: string | null,
): Promise<void> {
  assertManagedContentTarget(table, id);
  const column = "published";
  const filters = new URLSearchParams({ id: `eq.${id}` });
  if (optimisticUpdatedAt) filters.set("updated_at", `eq.${optimisticUpdatedAt}`);

  const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/${table}?${filters.toString()}&select=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ [column]: published, updated_at: new Date().toISOString() }),
    },
  );
  if (!Array.isArray(updated) || updated.length === 0) {
    throw new Error("تم تعديل هذا العنصر بواسطة مستخدم آخر أو لم يعد موجودًا. حدّث الصفحة ثم أعد المحاولة.");
  }
}

export async function deleteManagedContent(
  table: string,
  id: string,
  optimisticUpdatedAt?: string | null,
): Promise<void> {
  assertManagedContentTarget(table, id);
  const filters = new URLSearchParams({ id: `eq.${id}` });
  filters.set("or", "(published.is.null,published.eq.false)");
  if (optimisticUpdatedAt) filters.set("updated_at", `eq.${optimisticUpdatedAt}`);

  const deleted = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/${table}?${filters.toString()}&select=id`,
    { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  if (Array.isArray(deleted) && deleted.length > 0) return;

  const current = await supabaseServerAdminRequest<Array<{ id: string; published: boolean; updated_at: string }>>(
    `/rest/v1/${table}?select=id,published,updated_at&id=eq.${encodeURIComponent(id)}&limit=1`,
    { method: "GET" },
  );
  if (!current[0]) throw new Error("العنصر غير موجود.");
  if (current[0].published) throw new Error("لا يمكن حذف عنصر منشور. قم بإخفائه أولاً ثم أعد المحاولة.");
  if (optimisticUpdatedAt && current[0].updated_at !== optimisticUpdatedAt) {
    throw new Error("تم تعديل هذا العنصر بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة.");
  }
  throw new Error("تعذر حذف العنصر؛ لم يتغير أي سجل في قاعدة البيانات.");
}
