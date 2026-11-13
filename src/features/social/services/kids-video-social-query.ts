export type KidsSocialQueueRow = {
  id: string;
  content_id: string | null;
  content_type: string;
  body: string | null;
  target_platforms: string[] | null;
  status: string;
  published_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type KidsSocialQueueRequest = <T>(path: string) => Promise<T>;

const KIDS_SOCIAL_QUEUE_PAGE_SIZE = 500;
const KIDS_SOCIAL_QUEUE_MAX_ROWS = 5_000;
const KIDS_SOCIAL_QUEUE_SELECT =
  "id,content_id,content_type,body,target_platforms,status,published_at,created_at,metadata";

type QueueCursor = {
  createdAt: string;
  id: string;
};

/**
 * Read every matching Kids social queue row with a stable keyset cursor.
 * The bounded scan fails closed: a truncated queue must never be treated as
 * a complete publication/deletion history for the public Kids feed.
 */
export async function loadKidsSocialQueueRows(
  requestIdsInput: readonly string[],
  request: KidsSocialQueueRequest,
): Promise<KidsSocialQueueRow[]> {
  const requestIds = [...new Set(requestIdsInput
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0))];
  if (requestIds.length === 0) return [];

  const contentIdFilter = requestIds.map(encodeURIComponent).join(",");
  const rows: KidsSocialQueueRow[] = [];
  const seenIds = new Set<string>();
  let cursor: QueueCursor | null = null;

  while (true) {
    const cursorFilter = cursor
      ? "&or=" + encodeURIComponent(
          "(created_at.lt." + cursor.createdAt +
          ",and(created_at.eq." + cursor.createdAt + ",id.lt." + cursor.id + "))",
        )
      : "";
    const path =
      "/rest/v1/social_publish_queue?content_id=in.(" + contentIdFilter + ")" +
      "&metadata->>audience=eq.kids" +
      "&select=" + KIDS_SOCIAL_QUEUE_SELECT +
      "&order=created_at.desc,id.desc" +
      "&limit=" + KIDS_SOCIAL_QUEUE_PAGE_SIZE +
      cursorFilter;

    const page = await request<KidsSocialQueueRow[]>(path);
    if (!Array.isArray(page) || page.length > KIDS_SOCIAL_QUEUE_PAGE_SIZE) {
      throw new Error("Kids social queue pagination returned an invalid page; publication history is incomplete.");
    }
    if (rows.length + page.length > KIDS_SOCIAL_QUEUE_MAX_ROWS) {
      throw new Error("Kids social queue history exceeded the safe scan limit; publication badges are withheld.");
    }
    if (page.length === 0) return rows;

    for (const row of page) {
      if (
        !row ||
        typeof row !== "object" ||
        typeof row.id !== "string" ||
        row.id.trim().length === 0 ||
        typeof row.created_at !== "string" ||
        !Number.isFinite(Date.parse(row.created_at))
      ) {
        throw new Error("Kids social queue page contains a row without a stable cursor; publication history is incomplete.");
      }
      if (seenIds.has(row.id)) {
        throw new Error("Kids social queue pagination repeated a row; publication history is incomplete.");
      }
      seenIds.add(row.id);
      rows.push(row);
    }

    if (page.length < KIDS_SOCIAL_QUEUE_PAGE_SIZE) return rows;

    const last = page[page.length - 1];
    const nextCursor = { createdAt: last.created_at, id: last.id };
    if (
      cursor &&
      cursor.createdAt === nextCursor.createdAt &&
      cursor.id === nextCursor.id
    ) {
      throw new Error("Kids social queue pagination did not advance; publication history is incomplete.");
    }
    cursor = nextCursor;
  }
}
