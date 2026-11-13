import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";
import { resolveSocialPublishCutoff } from "./facebook-queue-recovery-policy";
import { buildYouTubeQueueRecoveryFilter, buildYouTubeQueueRecoveryPatch } from "./youtube-queue-recovery-policy";

type YouTubeAuthBlockedQueueRow = {
  id: string;
  target_platforms: string[] | null;
  metadata: Record<string, unknown> | null;
  status: string;
  updated_at: string | null;
  created_at: string | null;
};

/**
 * Release only recent, explicitly reauthorized YouTube auth failures. This
 * function updates queue metadata only; the caller must separately confirm,
 * step up with MFA, and dispatch the normal publisher.
 */
export async function unblockYouTubeAuthBlockedQueue(): Promise<number> {
  const pageSize = 250;
  const publishAfter = resolveSocialPublishCutoff(process.env.SOCIAL_PUBLISH_AFTER);
  let cursor: string | null = null;
  let released = 0;
  let scanned = 0;
  const maxRows = 5_000;
  const inventory: YouTubeAuthBlockedQueueRow[] = [];

  while (true) {
    const cursorFilter: string = cursor === null ? "" : "&id=gt." + encodeURIComponent(cursor);
    const rows: YouTubeAuthBlockedQueueRow[] = await supabaseServerAdminRequest<YouTubeAuthBlockedQueueRow[]>(
      "/rest/v1/social_publish_queue?status=in.(failed,partial)&created_at=gte." +
        encodeURIComponent(publishAfter) +
        "&select=id,target_platforms,metadata,status,updated_at,created_at&order=id.asc&limit=" +
        pageSize + cursorFilter,
    );
    if (!Array.isArray(rows)) throw new Error("YouTube queue recovery inventory was not an array.");
    if (rows.length === 0) break;
    inventory.push(...rows);
    scanned += rows.length;
    if (scanned > maxRows) {
      throw new Error("YouTube queue recovery inventory exceeded its safe scan limit; no rows were changed.");
    }
    cursor = rows[rows.length - 1]?.id ?? cursor;
    if (rows.length < pageSize) break;
  }

  for (const item of inventory) {
    const filter = buildYouTubeQueueRecoveryFilter(item, publishAfter);
    if (!filter) continue;
    const now = new Date();
    const nowIso = now.toISOString();
    const updatedAt = buildNextRowVersionUpdatedAt(item.updated_at ?? "", now);
    const patch = buildYouTubeQueueRecoveryPatch(item.metadata, item.target_platforms ?? [], nowIso, updatedAt);
    if (!patch) continue;
    const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/social_publish_queue?" + filter,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(patch),
      },
    );
    if (Array.isArray(updated) && updated[0]?.id) released += 1;
  }

  return released;
}
