export async function forEachIdPage<T extends { id: string }>(
  fetchPage: (afterId: string | null, pageSize: number) => Promise<readonly T[]>,
  pageSize: number,
  visitPage: (page: readonly T[]) => Promise<void> | void,
): Promise<number> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive safe integer.");
  }

  let cursor: string | null = null;
  let total = 0;

  while (true) {
    const page = await fetchPage(cursor, pageSize);
    if (page.length > pageSize) {
      throw new Error("Page reader returned more rows than requested.");
    }
    if (page.length === 0) return total;

    let nextCursor: string | null = cursor;
    for (const row of page) {
      const id = typeof row?.id === "string" ? row.id.trim() : "";
      if (!id || (nextCursor !== null && id <= nextCursor)) {
        throw new Error("Page reader must return non-empty IDs in strictly increasing order.");
      }
      nextCursor = id;
    }

    await visitPage(page);
    total += page.length;

    if (page.length < pageSize) return total;
    if (nextCursor === cursor) {
      throw new Error("Page reader did not advance its cursor.");
    }
    cursor = nextCursor;
  }
}

export async function fetchAllIdPages<T extends { id: string }>(
  fetchPage: (afterId: string | null, pageSize: number) => Promise<readonly T[]>,
  pageSize: number,
): Promise<T[]> {
  const rows: T[] = [];
  await forEachIdPage(fetchPage, pageSize, page => {
    rows.push(...page);
  });
  return rows;
}
