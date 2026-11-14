const FACEBOOK_PAGE_PUBLISHING_TASKS = new Set([
  "CREATE_CONTENT",
  "PROFILE_PLUS_CREATE_CONTENT",
  "PROFILE_PLUS_FULL_CONTROL",
]);

/**
 * Meta returns legacy CREATE_CONTENT for classic Page roles and PROFILE_PLUS_*
 * task names for the New Pages Experience. Missing task data must fail closed.
 */
export function hasFacebookPagePublishingTask(tasks: unknown): boolean {
  return Array.isArray(tasks) &&
    tasks.some((task) => typeof task === "string" && FACEBOOK_PAGE_PUBLISHING_TASKS.has(task));
}


export const FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS = Object.freeze([
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
]);

export const FACEBOOK_OPTIONAL_INSIGHTS_PERMISSION = "read_insights";

export const FACEBOOK_REQUESTED_PERMISSIONS = Object.freeze([
  ...FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS,
  FACEBOOK_OPTIONAL_INSIGHTS_PERMISSION,
]);

export function hasFacebookPublishingPermissions(permissions: unknown): boolean {
  const granted = new Set(
    Array.isArray(permissions)
      ? permissions.filter((permission): permission is string => typeof permission === "string")
      : [],
  );
  return FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS.every((permission) => granted.has(permission));
}

export function hasFacebookInsightsPermission(permissions: unknown): boolean {
  return Array.isArray(permissions) &&
    permissions.includes(FACEBOOK_OPTIONAL_INSIGHTS_PERMISSION);
}


export type FacebookPageListError = {
  status: number;
  code?: number | string | null;
};

export type FacebookPageListResponse<T> = {
  data?: readonly T[] | null;
  paging?: {
    cursors?: { after?: string | null };
    next?: string | null;
  };
  error?: FacebookPageListError | null;
};

export type FacebookPageLookup<T> = {
  page: T | null;
  multiplePages: boolean;
  complete: boolean;
  pagesFetched: number;
  error?: FacebookPageListError;
};

function getFacebookNextPageCursor(
  paging: FacebookPageListResponse<unknown>["paging"],
): { hasNext: boolean; cursor: string | null } {
  const nextUrl = typeof paging?.next === "string" ? paging.next.trim() : "";
  if (!nextUrl) return { hasNext: false, cursor: null };

  const cursor = typeof paging?.cursors?.after === "string"
    ? paging.cursors.after.trim()
    : "";
  if (cursor) return { hasNext: true, cursor };

  try {
    const parsed = new URL(nextUrl, "https://graph.facebook.com");
    if (parsed.origin !== "https://graph.facebook.com") return { hasNext: true, cursor: null };
    return {
      hasNext: true,
      cursor: parsed.searchParams.get("after")?.trim() || null,
    };
  } catch {
    return { hasNext: true, cursor: null };
  }
}

/**
 * Resolve the configured Page across Meta's cursor-paginated /me/accounts edge.
 * Never guess a Page when the scan is ambiguous or bounded before completion.
 */
export async function findFacebookPageAcrossPages<T extends { id?: string }>(
  fetchPage: (after?: string) => Promise<FacebookPageListResponse<T>>,
  configuredPageId?: string,
  maxPages = 3,
): Promise<FacebookPageLookup<T>> {
  const configured = configuredPageId?.trim() ?? "";
  const pageLimit = Number.isFinite(maxPages)
    ? Math.max(1, Math.min(5, Math.floor(maxPages)))
    : 3;
  const pages = new Map<string, T>();
  const seenCursors = new Set<string>();
  let after: string | undefined;

  for (let pageIndex = 0; pageIndex < pageLimit; pageIndex += 1) {
    const response = await fetchPage(after);
    if (response.error) {
      return {
        page: null,
        multiplePages: false,
        complete: false,
        pagesFetched: pageIndex + 1,
        error: response.error,
      };
    }

    for (const page of Array.isArray(response.data) ? response.data : []) {
      if (!page || typeof page !== "object") continue;
      const id = typeof page.id === "string" ? page.id.trim() : "";
      if (!id) continue;
      pages.set(id, page);
      if (configured && id === configured) {
        return {
          page,
          multiplePages: false,
          complete: true,
          pagesFetched: pageIndex + 1,
        };
      }
    }

    if (!configured && pages.size > 1) {
      return {
        page: null,
        multiplePages: true,
        complete: true,
        pagesFetched: pageIndex + 1,
      };
    }

    const pagination = getFacebookNextPageCursor(response.paging);
    if (!pagination.hasNext) {
      return {
        page: !configured && pages.size === 1 ? [...pages.values()][0] : null,
        multiplePages: pages.size > 1,
        complete: true,
        pagesFetched: pageIndex + 1,
      };
    }
    if (!pagination.cursor || seenCursors.has(pagination.cursor)) {
      return {
        page: null,
        multiplePages: !configured && pages.size > 1,
        complete: false,
        pagesFetched: pageIndex + 1,
      };
    }
    seenCursors.add(pagination.cursor);
    after = pagination.cursor;
  }

  return {
    page: null,
    multiplePages: !configured && pages.size > 1,
    complete: false,
    pagesFetched: pageLimit,
  };
}
