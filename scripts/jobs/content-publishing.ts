import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";
import { inspectVideoQueueItemApproval } from "../../src/features/videos/services/video-publish-approval";

type QueueItem = { id: string; content_table: string; content_id: string; scheduled_at: string };
const CONTENT_TABLES = new Set(["articles", "stories", "competitions", "memorization_plans", "pinned_messages", "videos"]);


async function isVideoPurgeInProgress(): Promise<boolean> {
  try {
    const rows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
      "/rest/v1/admin_settings?key=eq.video_purge_in_progress&select=value&limit=1",
    );
    return rows?.[0]?.value === true;
  } catch (error) {
    console.error("[content-publishing] Could not verify the video purge lock; holding video publication.", error);
    return true;
  }
}

async function deferVideoPublication(itemId: string): Promise<void> {
  await supabaseServerAdminRequest(
    "/rest/v1/content_publish_queue?id=eq." + encodeURIComponent(itemId) + "&status=eq.processing",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "queued",
        scheduled_at: new Date(Date.now() + 5 * 60_000).toISOString(),
        error_message: "Video purge is in progress; publication was safely deferred.",
        updated_at: new Date().toISOString(),
      }),
    },
  );
}

async function rollbackScheduledContentPublication(item: QueueItem, publishedUpdatedAt: string | null): Promise<void> {
  if (!publishedUpdatedAt) return;
  // Roll back only the exact worker write. A later admin republish has a new
  // updated_at value and must never be undone by this stale queue worker.
  await supabaseServerAdminRequest(
    `/rest/v1/${item.content_table}?id=eq.${encodeURIComponent(item.content_id)}&published=eq.true&updated_at=eq.${encodeURIComponent(publishedUpdatedAt)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ published: false, updated_at: new Date().toISOString() }),
    },
  );
}

async function validateScheduledStoryForPublication(storyId: string): Promise<void> {
  const rows = await supabaseServerAdminRequest<Array<{
    id: string;
    is_approved: boolean | null;
    user_id: string | null;
  }>>(
    "/rest/v1/stories?id=eq." + encodeURIComponent(storyId) + "&select=id,is_approved,user_id&limit=1",
  );
  const story = rows?.[0];
  if (!story || story.is_approved !== true || story.user_id !== null) {
    throw new Error("Scheduled story is no longer an approved public story; publication was blocked.");
  }
}

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
  const requestId = typeof metadata.videoGenerationRequestId === "string" ? metadata.videoGenerationRequestId : "";
  const audience = metadata.audience;
  const automatedQa = metadata.automatedVideoQa && typeof metadata.automatedVideoQa === "object" && !Array.isArray(metadata.automatedVideoQa)
    ? metadata.automatedVideoQa as Record<string, unknown>
    : {};
  let approvedCloudinaryMedia = false;
  try {
    const parsed = new URL(mediaUrl);
    approvedCloudinaryMedia =
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.includes("/video/upload/") &&
      metadata.generator === "zikr_internal_video_factory" &&
      metadata.mediaState !== "purged" &&
      metadata.mediaState !== "unlinked";
  } catch {
    approvedCloudinaryMedia = false;
  }

  const requests = requestId
    ? await supabaseServerAdminRequest<Array<{
        id: string;
        status: string;
        category: string;
        video_url: string | null;
        source_hash: string | null;
        content_hash: string | null;
        template_version: string | null;
        content: unknown;
      }>>(
        "/rest/v1/video_generation_requests?id=eq." + encodeURIComponent(requestId) +
          "&select=id,status,category,video_url,source_hash,content_hash,template_version,content&limit=1",
      )
    : [];
  const approval = inspectVideoQueueItemApproval({
    contentType: "video",
    contentId: requestId,
    queuedVideoUrl: mediaUrl,
    request: requests?.[0] ?? null,
  });
  const audienceEligible = audience === "general" || audience === "kids";
  const kidsQaPassed = audience !== "kids" ||
    (metadata.kidsVideoQaStatus === "passed" && automatedQa.status === "passed");

  if (!row || !approvedCloudinaryMedia || !audienceEligible || !approval.approved || !kidsQaPassed) {
    throw new Error("Generated video is not a verified, QA-approved, available ZIKR-owned media asset.");
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
    if (item.content_table === "videos" && await isVideoPurgeInProgress()) continue;
    if (!CONTENT_TABLES.has(item.content_table)) {
      await supabaseServerAdminRequest(`/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.queued`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "failed", error_message: "Unsupported internal content table.", updated_at: now }),
      });
      continue;
    }
    const claimed = await supabaseServerAdminRequest<QueueItem[]>(
      `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.queued&scheduled_at=lte.${encodeURIComponent(now)}`,
      { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ status: "processing", updated_at: now }) },
    );
    if (!claimed?.length) continue;
    if (item.content_table === "videos" && await isVideoPurgeInProgress()) {
      await deferVideoPublication(item.id);
      continue;
    }
    let contentPublished = false;
    let contentPublishedUpdatedAt: string | null = null;
    try {
      if (item.content_table === "videos") {
        await validateInternalVideoForPublication(item.content_id);
      }
      if (item.content_table === "stories") {
        await validateScheduledStoryForPublication(item.content_id);
      }

      // Recheck the claim immediately before touching content. An admin may
      // cancel a processing schedule while validation is running.
      const stillProcessing = await supabaseServerAdminRequest<Array<{ id: string }>>(
        `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.processing&select=id&limit=1`,
      );
      if (!stillProcessing?.length) continue;
      if (item.content_table === "videos" && await isVideoPurgeInProgress()) {
        await deferVideoPublication(item.id);
        continue;
      }

      contentPublishedUpdatedAt = new Date().toISOString();
      const updatedContent = await supabaseServerAdminRequest<Array<{ id: string }>>(
        `/rest/v1/${item.content_table}?id=eq.${encodeURIComponent(item.content_id)}&select=id`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ published: true, updated_at: contentPublishedUpdatedAt }),
        },
      );
      if (!updatedContent?.some(row => row.id === item.content_id)) {
        throw new Error("Scheduled content record was not found; the queue item was not marked published.");
      }
      contentPublished = true;

      const completed = await supabaseServerAdminRequest<Array<{ id: string }>>(
        `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.processing&select=id`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ status: "published", published_at: now, updated_at: now }),
        },
      );
      if (!completed?.some(row => row.id === item.id)) {
        const currentQueue = await supabaseServerAdminRequest<Array<{ status: string }>>(
          `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&select=status&limit=1`,
        ).catch(() => []);
        if (currentQueue?.[0]?.status === "cancelled") {
          await rollbackScheduledContentPublication(item, contentPublishedUpdatedAt);
          contentPublished = false;
          continue;
        }
        throw new Error("Scheduled content lost its processing claim before publication was committed.");
      }

      contentPublished = false;
      published += 1;
    } catch (error) {
      if (contentPublished) {
        const currentQueue = await supabaseServerAdminRequest<Array<{ status: string }>>(
          `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&select=status&limit=1`,
        ).catch(() => []);
        if (currentQueue?.[0]?.status !== "published") {
          await rollbackScheduledContentPublication(item, contentPublishedUpdatedAt).catch(() => {});
        }
      }
      await supabaseServerAdminRequest(
        `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.processing`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "failed",
            error_message: error instanceof Error ? error.message.slice(0, 500) : "unknown",
            updated_at: new Date().toISOString(),
          }),
        },
      ).catch(() => {});
    }
  }
  return { claimed: rows.length, published };
}
