import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";

type ActiveScheduleStatus = "queued" | "processing";

type ActiveScheduleRow = {
  id: string;
  status: ActiveScheduleStatus;
  updated_at: string;
};

type ScheduleRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type ContentScheduleAdminRequest = <T>(
  path: string,
  init?: ScheduleRequestInit,
) => Promise<T>;

const MAX_CAS_ATTEMPTS = 3;

function isActiveStatus(value: unknown): value is ActiveScheduleStatus {
  return value === "queued" || value === "processing";
}

/**
 * Cancel every active schedule for one content row with a compare-and-set
 * against the queue row version. The worker uses the same updated_at value as
 * its lease token, so cancellation must always advance that token—even when
 * both writes happen inside the same millisecond.
 *
 * If a worker wins the first race and changes the lease, re-read the row and
 * retry against its new version. Any read/write uncertainty fails closed so
 * the caller will not unpublish or delete the source content underneath a
 * still-active publication claim.
 */
export async function cancelActiveContentSchedules(
  request: ContentScheduleAdminRequest,
  contentTable: string,
  contentId: string,
  reason: string,
): Promise<number> {
  if (!contentTable.trim() || !contentId.trim() || !reason.trim()) {
    throw new Error("A content table, content ID, and cancellation reason are required.");
  }

  const targetFilter =
    `content_table=eq.${encodeURIComponent(contentTable)}&content_id=eq.${encodeURIComponent(contentId)}`;
  const activeFilter = "status=in.(queued,processing)";
  const rows = await request<ActiveScheduleRow[]>(
    `/rest/v1/content_publish_queue?${targetFilter}&${activeFilter}&select=id,status,updated_at&order=updated_at.asc`,
    { method: "GET" },
  );
  if (!Array.isArray(rows)) {
    throw new Error("Unable to verify active scheduled publications.");
  }

  let cancelledCount = 0;
  for (const initialRow of rows) {
    let current: ActiveScheduleRow | null = initialRow;

    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
      if (!current || !isActiveStatus(current.status)) break;
      if (!current.id.trim() || !current.updated_at || !Number.isFinite(Date.parse(current.updated_at))) {
        throw new Error("An active scheduled publication has an invalid row-version token.");
      }

      const nextUpdatedAt = buildNextRowVersionUpdatedAt(current.updated_at);
      const changed = await request<Array<{ id: string }>>(
        `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(current.id)}&${activeFilter}&updated_at=eq.${encodeURIComponent(current.updated_at)}&select=id`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({
            status: "cancelled",
            error_message: reason.slice(0, 500),
            updated_at: nextUpdatedAt,
          }),
        },
      );

      if (Array.isArray(changed) && changed.some((row) => row.id === current?.id)) {
        cancelledCount += 1;
        break;
      }

      // The queue row may have been claimed or completed between the read and
      // PATCH. Only retry after a fresh read proves it is still active.
      const refreshed = await request<ActiveScheduleRow[]>(
        `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(current.id)}&select=id,status,updated_at&limit=1`,
        { method: "GET" },
      );
      if (!Array.isArray(refreshed)) {
        throw new Error("Unable to re-read a scheduled publication after a concurrent update.");
      }
      current = refreshed[0] ?? null;
      if (!current || !isActiveStatus(current.status)) break;

      if (attempt === MAX_CAS_ATTEMPTS - 1) {
        throw new Error("A scheduled publication kept changing while cancellation was in progress; retry after refreshing the Admin page.");
      }
    }
  }

  return cancelledCount;
}
