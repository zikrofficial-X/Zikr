import "server-only";

import { createClient } from "@/lib/supabase/server";

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
          .select("id, title, is_active, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

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
        published: item.is_active ?? false,
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
    return [];
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
  const supabase = await createClient();
  const [storiesRes, articlesRes] = await Promise.all([
    supabase
      .from("stories")
      .select("id, title, published, views, created_at, updated_at"),
    supabase
      .from("articles")
      .select("id, title, published, views, created_at, updated_at"),
  ]);

  if (storiesRes.error) throw storiesRes.error;
  if (articlesRes.error) throw articlesRes.error;

  return [
    ...(storiesRes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      type: "story" as const,
      status: row.published ? ("published" as const) : ("draft" as const),
      views: row.views ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    ...(articlesRes.data ?? []).map((row) => ({
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
