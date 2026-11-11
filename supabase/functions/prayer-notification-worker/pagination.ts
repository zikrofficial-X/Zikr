export async function fetchAllIdPages<T extends { id: string }>(
  fetchPage: (afterId: string | null, pageSize: number) => Promise<readonly T[]>,
  pageSize: number,
): Promise<T[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive safe integer.");
  }

  const rows: T[] = [];
  let cursor: string | null = null;

  while (true) {
    const page = await fetchPage(cursor, pageSize);
    if (page.length > pageSize) {
      throw new Error("Page reader returned more rows than requested.");
    }
    if (page.length === 0) return rows;

    let nextCursor = cursor;
    for (const row of page) {
      const id = typeof row?.id === "string" ? row.id.trim() : "";
      if (!id || (nextCursor !== null && id <= nextCursor)) {
        throw new Error("Page reader must return non-empty IDs in strictly increasing order.");
      }
      nextCursor = id;
      rows.push(row);
    }

    if (page.length < pageSize) return rows;
    if (nextCursor === cursor) {
      throw new Error("Page reader did not advance its cursor.");
    }
    cursor = nextCursor;
  }
}
