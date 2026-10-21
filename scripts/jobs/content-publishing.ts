import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";

type QueueItem = { id: string; content_table: string; content_id: string; scheduled_at: string };
const CONTENT_TABLES = new Set(["articles", "stories", "competitions", "memorization_plans", "pinned_messages"]);

export async function processScheduledContent(limit = 20) {
  const now = new Date().toISOString();
  const rows = await supabaseServerAdminRequest<QueueItem[]>(
    `/rest/v1/content_publish_queue?status=eq.queued&scheduled_at=lte.${encodeURIComponent(now)}&select=id,content_table,content_id,scheduled_at&order=scheduled_at.asc&limit=${limit}`,
    { method: "GET" },
  );
  let published = 0;
  for (const item of rows) {
    if (!CONTENT_TABLES.has(item.content_table)) continue;
    const claimed = await supabaseServerAdminRequest<QueueItem[]>(
      `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.queued`,
      { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ status: "processing", updated_at: now }) },
    );
    if (!claimed.length) continue;
    try {
      const column = item.content_table === "pinned_messages" ? "is_active" : "published";
      await supabaseServerAdminRequest(`/rest/v1/${item.content_table}?id=eq.${encodeURIComponent(item.content_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ [column]: true, updated_at: now }),
      });
      await supabaseServerAdminRequest(`/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "published", published_at: now, updated_at: now }),
      });
      published += 1;
    } catch (error) {
      await supabaseServerAdminRequest(`/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "unknown", updated_at: now }),
      }).catch(() => {});
    }
  }
  return { claimed: rows.length, published };
}
