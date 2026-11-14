export type FacebookPublicProfileIdentityUpsert = {
  platform: "facebook";
  external_id: string;
  name: string;
  page_url: string;
  status: "ok";
  last_error: null;
  updated_at: string;
} & Partial<{
  description: null;
  category: null;
  website: null;
  handle: null;
  avatar_url: null;
  cover_url: null;
  subscribers_count: null;
  followers_count: null;
  likes_count: null;
  following_count: null;
  view_count: null;
  video_count: null;
  synced_at: null;
}>;

export type FacebookPublicProfileSyncUpsert = {
  platform: "facebook";
  external_id: string;
  name: string;
  description: string;
  category: string | null;
  website: string | null;
  avatar_url: string;
  cover_url: string | null;
  page_url: string;
  followers_count: number | null;
  likes_count: number | null;
  synced_at: string;
  status: "ok";
  last_error: null;
  updated_at: string;
};

export type FacebookPublicProfileCache = {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  pageUrl?: string | null;
  followersCount?: number | null;
  likesCount?: number | null;
};

/**
 * OAuth only verifies Page identity. Preserve profile data when the same Page
 * is reauthorized; clear it when the connected Page changes so metrics and
 * artwork from the previous Page cannot be presented as belonging to the new one.
 */
export function buildFacebookPublicProfileIdentityUpsert(input: {
  pageId: string;
  pageName: string;
  updatedAt: string;
  previousPageId?: string | null;
}): FacebookPublicProfileIdentityUpsert {
  const pageId = input.pageId.trim();
  const pageName = input.pageName.trim();
  if (!pageId || !pageName) {
    throw new Error("Facebook Page ID and name are required to update the public profile identity.");
  }

  const pageChanged = input.previousPageId !== undefined &&
    (input.previousPageId?.trim() ?? "") !== pageId;
  return {
    platform: "facebook",
    external_id: pageId,
    name: pageName,
    page_url: `https://www.facebook.com/${encodeURIComponent(pageId)}`,
    status: "ok",
    last_error: null,
    updated_at: input.updatedAt,
    ...(pageChanged ? {
      description: null,
      category: null,
      website: null,
      handle: null,
      avatar_url: null,
      cover_url: null,
      subscribers_count: null,
      followers_count: null,
      likes_count: null,
      following_count: null,
      view_count: null,
      video_count: null,
      synced_at: null,
    } : {}),
  };
}

function nonEmptyString(value: unknown, fallback: string | null): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function safeCount(value: unknown, fallback: number | null): number | null {
  if (value === null || value === undefined) return fallback;
  const count = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isSafeInteger(count) && count >= 0 ? count : fallback;
}

/**
 * Build a Graph refresh upsert without replacing same-Page cached fields with
 * nulls when Meta omits an optional field or permission-gated metric.
 */
export function buildFacebookPublicProfileSyncUpsert(input: {
  pageId: string;
  name?: unknown;
  description?: unknown;
  category?: unknown;
  website?: unknown;
  avatarUrl?: unknown;
  coverUrl?: unknown;
  pageUrl?: unknown;
  followersCount?: unknown;
  likesCount?: unknown;
  fallbackAvatar: string;
  syncedAt: string;
  cached?: FacebookPublicProfileCache | null;
}): FacebookPublicProfileSyncUpsert {
  const pageId = input.pageId.trim();
  if (!pageId) throw new Error("Facebook Page ID is required to sync the public profile.");
  const cached = input.cached ?? {};
  const defaultDescription = "تابع أحدث محتوى ذِكر على صفحتنا الرسمية على فيسبوك.";
  return {
    platform: "facebook",
    external_id: pageId,
    name: nonEmptyString(input.name, cached.name ?? "ذِكر | ZIKR") ?? "ذِكر | ZIKR",
    description: nonEmptyString(input.description, cached.description ?? defaultDescription) ?? defaultDescription,
    category: nonEmptyString(input.category, cached.category ?? null),
    website: nonEmptyString(input.website, cached.website ?? null),
    avatar_url: nonEmptyString(input.avatarUrl, cached.avatarUrl ?? input.fallbackAvatar) ?? input.fallbackAvatar,
    cover_url: nonEmptyString(input.coverUrl, cached.coverUrl ?? null),
    page_url: nonEmptyString(input.pageUrl, cached.pageUrl ?? `https://www.facebook.com/${encodeURIComponent(pageId)}`) ??
      `https://www.facebook.com/${encodeURIComponent(pageId)}`,
    followers_count: safeCount(input.followersCount, cached.followersCount ?? null),
    likes_count: safeCount(input.likesCount, cached.likesCount ?? null),
    synced_at: input.syncedAt,
    status: "ok",
    last_error: null,
    updated_at: input.syncedAt,
  };
}
