import "server-only";

import { cancelActiveContentSchedules } from "./content-schedule-cancellation";

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
  updated_at: string;
};

export async function getScheduledContent(): Promise<ScheduledContentItem[]> {
  try {
    return await supabaseServerAdminRequest<ScheduledContentItem[]>(
      "/rest/v1/content_publish_queue?status=in.(queued,processing)&select=id,content_table,content_id,scheduled_at,status,updated_at&order=scheduled_at.asc&limit=100",
      { method: "GET" },
    );
  } catch (error) {
    console.error("[admin/content] failed to load scheduled content:", error);
    throw error;
  }
}

export async function getManagedContent(): Promise<ManagedContentItem[]> {
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
        supabase
          .from("pinned_messages")
          .select("id, title, published, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const queryErrors = [
      storiesRes.error,
      articlesRes.error,
      competitionsRes.error,
      plansRes.error,
      pinnedRes.error,
    ].filter(Boolean);
    if (queryErrors.length > 0) {
      const details = queryErrors.map((error) => error?.message ?? "Unknown query error");
      throw new Error(`تعذر تحميل بعض مصادر المحتوى: ${details.join(" | ")}`);
    }

    const items: ManagedContentItem[] = [
      ...(storiesRes.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        published: item.published ?? false,
        views: 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: "قصة",
        table: "stories" as const,
      })),
      ...(articlesRes.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        published: item.published ?? false,
        views: item.views ?? 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: "مقالة",
        table: "articles" as const,
      })),
      ...(competitionsRes.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        published: item.published ?? false,
        views: 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: "مسابقة",
        table: "competitions" as const,
      })),
      ...(plansRes.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        published: item.published ?? false,
        views: 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: "خطة حفظ",
        table: "memorization_plans" as const,
      })),
      ...(pinnedRes.data ?? []).map((item) => ({
        id: item.id,
        title: item.title ?? "رسالة مثبتة",
        published: item.published ?? false,
        views: 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: "رسالة مثبتة",
        table: "pinned_messages" as const,
      })),
    ];

    return items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch (error) {
    console.error("[admin/content] failed to load managed content:", error);
    throw error;
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
  const encodedId = encodeURIComponent(id);
  const select = table === "stories"
    ? "id,updated_at,is_approved,user_id"
    : table === "articles"
      ? "id,updated_at,metadata"
      : "id,updated_at";
  const current = await supabaseServerAdminRequest<Array<{
    id: string;
    updated_at: string;
    is_approved?: boolean | null;
    user_id?: string | null;
    metadata?: unknown;
  }>>(
    `/rest/v1/${table}?select=${select}&id=eq.${encodedId}&limit=1`,
    { method: "GET" },
  );
  const target = current?.[0];
  if (!target) throw new Error("العنصر غير موجود.");
  if (optimisticUpdatedAt && String(target.updated_at) !== optimisticUpdatedAt) {
    throw new Error("تم تعديل هذا العنصر بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة.");
  }
  if (published && table === "stories" && (target.is_approved !== true || target.user_id !== null)) {
    throw new Error("لا يمكن نشر قصة غير معتمدة أو مرتبطة بحساب مستخدم؛ اعتمد قصة عامة أولاً.");
  }

  // An explicit unpublish must revoke queued and in-flight schedules. Advance
  // each queue row's exact lease version so a same-millisecond worker cannot
  // retain a valid claim after cancellation.
  if (!published) {
    try {
      await cancelActiveContentSchedules(
        supabaseServerAdminRequest,
        table,
        id,
        "Cancelled because the content was explicitly unpublished.",
      );
    } catch (error) {
      console.error("[admin/content] failed to cancel scheduled publication:", error);
      throw new Error("تعذر إلغاء موعد النشر المجدول؛ لم يتم تغيير حالة المحتوى. أعد المحاولة.");
    }
  }

  const updatedAt = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    published,
    updated_at: updatedAt,
  };
  if (table === "articles") {
    const articleMetadata = target.metadata && typeof target.metadata === "object" && !Array.isArray(target.metadata)
      ? { ...(target.metadata as Record<string, unknown>) }
      : {};
    if (published) {
      delete articleMetadata.automationPublicationHold;
      delete articleMetadata.automationPublicationHoldAt;
    } else {
      articleMetadata.automationPublicationHold = true;
      articleMetadata.automationPublicationHoldAt = updatedAt;
    }
    updatePayload.metadata = articleMetadata;
  }

  const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/${table}?id=eq.${encodedId}&updated_at=eq.${encodeURIComponent(String(target.updated_at))}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    },
  );
  if (!updated?.length) {
    throw new Error(
      "تم تعديل هذا العنصر أو حذفه بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة.",
    );
  }
}

export async function deleteManagedContent(
  table: string,
  id: string,
  optimisticUpdatedAt?: string | null,
): Promise<void> {
  assertManagedContentTarget(table, id);
  const current = await supabaseServerAdminRequest<
    Array<Record<string, unknown>>
  >(
    `/rest/v1/${table}?select=id,published,updated_at&id=eq.${encodeURIComponent(
      id,
    )}&limit=1`,
    { method: "GET" },
  );

  if (!current[0]) throw new Error("العنصر غير موجود.");
  if (Boolean(current[0].published)) {
    throw new Error(
      "لا يمكن حذف عنصر منشور. قم بإخفائه أولاً ثم أعد المحاولة.",
    );
  }
  if (
    optimisticUpdatedAt &&
    String(current[0].updated_at) !== optimisticUpdatedAt
  ) {
    throw new Error(
      "تم تعديل هذا العنصر بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة.",
    );
  }

  // A draft may still have a queued or in-flight publication. Cancel it
  // with an exact, monotonic queue-version compare-and-set before deletion.
  try {
    await cancelActiveContentSchedules(
      supabaseServerAdminRequest,
      table,
      id,
      "Cancelled because the scheduled content was deleted by an administrator.",
    );
  } catch (error) {
    console.error("[admin/content] failed to cancel schedule before deletion:", error);
    throw new Error("تعذر إلغاء موعد النشر المجدول؛ لم يتم حذف المحتوى. أعد المحاولة.");
  }

  const deleted = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&updated_at=eq.${encodeURIComponent(String(current[0].updated_at))}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    },
  );
  if (!deleted.length) {
    throw new Error(
      "تم تعديل هذا العنصر أو حذفه بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة.",
    );
  }
}
