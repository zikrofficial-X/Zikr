import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";

type QueueItem = { id: string; content_table: string; content_id: string; scheduled_at: string };
const CONTENT_TABLES = new Set(["articles", "stories", "competitions", "memorization_plans", "pinned_messages", "videos"]);

async function validateInternalVideoForPublication(videoId: string): Promise<void> {
  const rows = await supabaseServerAdminRequest<Array<{
    id: string;
    published: boolean | null;
    metadata: Record<string, unknown> | null;
  }>>(
    "/rest/v1/videos?id=eq." + encodeURIComponent(videoId) + "&select=id,published,metadata&limit=1",
  );
  const row = rows?.[0];
  const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const mediaUrl = typeof metadata.generatedVideoUrl === "string" ? metadata.generatedVideoUrl : "";
  let approvedCloudinaryMedia = false;
  try {
    const parsed = new URL(mediaUrl);
    approvedCloudinaryMedia =
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      metadata.generator === "zikr_internal_video_factory" &&
      metadata.mediaState !== "purged" &&
      metadata.mediaState !== "unlinked";
  } catch {
    approvedCloudinaryMedia = false;
  }
  if (!row || !approvedCloudinaryMedia) {
    throw new Error("Generated video is not a verified, available ZIKR-owned media asset.");
  }
}

export async function processScheduledContent(limit = 20) {
  const now = new Date().toISOString();
  const rows = await supabaseServerAdminRequest<QueueItem[]>(
    `/rest/v1/content_publish_queue?status=eq.queued&scheduled_at=lte.${encodeURIComponent(now)}&select=id,content_table,content_id,scheduled_at&order=scheduled_at.asc&limit=${limit}`,
    { method: "GET" },
  );
  let published = 0;
  for (const item of rows ?? []) {
    if (!CONTENT_TABLES.has(item.content_table)) {
      await supabaseServerAdminRequest(`/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.queued`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "failed", error_message: "Unsupported internal content table.", updated_at: now }),
      });
      continue;
    }
    const claimed = await supabaseServerAdminRequest<QueueItem[]>(
      `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.queued`,
      { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ status: "processing", updated_at: now }) },
    );
    if (!claimed?.length) continue;
    try {
      if (item.content_table === "videos") {
        await validateInternalVideoForPublication(item.content_id);
      }
      const updatedContent = await supabaseServerAdminRequest<Array<{ id: string }>>(
        `/rest/v1/${item.content_table}?id=eq.${encodeURIComponent(item.content_id)}&select=id`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ published: true, updated_at: now }),
        },
      );
      if (!updatedContent?.some(row => row.id === item.content_id)) {
        throw new Error("Scheduled content record was not found; the queue item was not marked published.");
      }
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
