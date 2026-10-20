import { getServerEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/server';
import { readStoredFacebookCredential } from '@/features/social/services/facebook-credentials';

export type FacebookPageProfile = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  website: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  pageUrl: string;
  likesCount: number | null;
  followersCount: number | null;
  followingCount: number | null;
  syncedAt: string | null;
  stale: boolean;
  configured: boolean;
  error?: string;
};

type CachedRow = Record<string, unknown>;

const PROFILE_TTL_MS = 30 * 60 * 1000;
const FALLBACK_PAGE_URL = 'https://www.facebook.com/zikrmediaofficial1';

function toProfile(row: CachedRow | null, pageId: string): FacebookPageProfile | null {
  if (!row || row.platform !== 'facebook') return null;
  return {
    id: String(row.external_id ?? pageId),
    name: String(row.name ?? 'ذِكر | ZIKR'),
    description: String(row.description ?? ''),
    category: row.category ? String(row.category) : null,
    website: row.website ? String(row.website) : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    coverUrl: row.cover_url ? String(row.cover_url) : null,
    pageUrl: String(row.page_url ?? FALLBACK_PAGE_URL),
    likesCount: row.likes_count == null ? null : Number(row.likes_count),
    followersCount: row.followers_count == null ? null : Number(row.followers_count),
    followingCount: row.following_count == null ? null : Number(row.following_count),
    syncedAt: row.synced_at ? String(row.synced_at) : null,
    stale: false,
    configured: true,
  };
}

async function readCachedProfile(pageId: string): Promise<FacebookPageProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('social_platform_profiles')
    .select('*')
    .eq('platform', 'facebook')
    .maybeSingle();
  if (error) throw error;
  return toProfile((data ?? null) as CachedRow | null, pageId);
}

type FacebookGraphProfileResponse = {
  id?: unknown;
  name?: unknown;
  about?: unknown;
  description?: unknown;
  category?: unknown;
  website?: unknown;
  link?: unknown;
  picture?: { data?: { url?: unknown } };
  cover?: { source?: unknown };
  fan_count?: unknown;
  followers_count?: unknown;
  error?: { message?: unknown };
};

function safeFacebookProfileError(error: unknown): string {
  const message = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  if (
    message.includes("session has expired") ||
    message.includes("error validating access token") ||
    message.includes("invalid oauth") ||
    message.includes("access token has expired") ||
    message.includes("oauthexception") ||
    message.includes("code 190")
  ) {
    return "اتصال صفحة Facebook يحتاج إلى التجديد من مركز النشر.";
  }
  if (message.includes("permission") || message.includes("code 10") || message.includes("code 200")) {
    return "اتصال صفحة Facebook يحتاج إلى مراجعة الصلاحيات من مركز النشر.";
  }
  return "تعذر تحديث بيانات صفحة Facebook حاليًا.";
}

async function fetchGraphProfile(pageId: string, accessToken: string, version: string) {
  const url = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}`);
  url.searchParams.set('fields', 'id,name,about,description,category,website,link,picture.type(large),cover,fan_count,followers_count');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({})) as FacebookGraphProfileResponse;
  if (!response.ok || body.error) {
    throw new Error(String(body?.error?.message ?? `Facebook Graph API failed (${response.status}).`));
  }
  return body;
}

export async function getFacebookPageProfile(): Promise<FacebookPageProfile | null> {
  const env = getServerEnv();
  const storedCredential = await readStoredFacebookCredential();
  const pageId = storedCredential?.page_id?.trim() || env.FACEBOOK_PAGE_ID?.trim() || '';
  const pageAccessToken = storedCredential?.page_access_token?.trim() || env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() || '';
  const graphVersion = env.FACEBOOK_GRAPH_API_VERSION || 'v26.0';
  if (!pageId) return null;

  const fallbackAvatar = `https://graph.facebook.com/${encodeURIComponent(pageId)}/picture?type=large`;

  let cached: FacebookPageProfile | null = null;
  try {
    cached = await readCachedProfile(pageId);
  } catch {
    cached = null;
  }

  const nextSyncAt = cached?.syncedAt ? new Date(cached.syncedAt).getTime() + PROFILE_TTL_MS : 0;
  if (cached && nextSyncAt > Date.now() && storedCredential?.connection_status !== 'reauthorization_required') return { ...cached, avatarUrl: cached.avatarUrl ?? fallbackAvatar };

  if (!pageAccessToken || !graphVersion) {
    return cached
      ? { ...cached, stale: true, avatarUrl: cached.avatarUrl ?? fallbackAvatar, error: 'Facebook Page credentials are not configured.' }
      : {
          id: pageId,
          name: 'ذِكر | ZIKR',
          description: 'تابع أحدث محتوى ذِكر على صفحتنا الرسمية على فيسبوك.',
          category: 'منصة محتوى إسلامي',
          website: null,
          avatarUrl: fallbackAvatar,
          coverUrl: null,
          pageUrl: FALLBACK_PAGE_URL,
          likesCount: null,
          followersCount: null,
          followingCount: null,
          syncedAt: null,
          stale: true,
          configured: true,
          error: 'Facebook Page credentials are not configured.',
        };
  }

  try {
    const body = await fetchGraphProfile(pageId, pageAccessToken, graphVersion);
    const syncedAt = new Date().toISOString();
    const profile = {
      platform: 'facebook',
      external_id: String(body.id ?? pageId),
      handle: null,
      name: String(body.name ?? 'ذِكر | ZIKR'),
      description: String(body.description ?? body.about ?? 'تابع أحدث محتوى ذِكر على صفحتنا الرسمية على فيسبوك.'),
      category: body.category ? String(body.category) : null,
      website: body.website ? String(body.website) : null,
      avatar_url: body?.picture?.data?.url ? String(body.picture.data.url) : fallbackAvatar,
      cover_url: body?.cover?.source ? String(body.cover.source) : null,
      page_url: String(body.link ?? FALLBACK_PAGE_URL),
      subscribers_count: null,
      followers_count: body.followers_count == null ? null : Number(body.followers_count),
      likes_count: body.fan_count == null ? null : Number(body.fan_count),
      following_count: null,
      view_count: null,
      video_count: null,
      synced_at: syncedAt,
      status: 'ok',
      last_error: null,
    };

    const supabase = createAdminClient();
    const { error } = await supabase.from('social_platform_profiles').upsert(profile, { onConflict: 'platform' });
    if (error) throw error;

    return {
      id: profile.external_id,
      name: profile.name,
      description: profile.description,
      category: profile.category,
      website: profile.website,
      avatarUrl: profile.avatar_url,
      coverUrl: profile.cover_url,
      pageUrl: profile.page_url,
      likesCount: profile.likes_count,
      followersCount: profile.followers_count,
      followingCount: profile.following_count,
      syncedAt,
      stale: false,
      configured: true,
    };
  } catch (error) {
    return cached
      ? {
          ...cached,
          stale: true,
          avatarUrl: cached.avatarUrl ?? fallbackAvatar,
          error: safeFacebookProfileError(error),
        }
      : {
          id: pageId,
          name: 'ذِكر | ZIKR',
          description: 'تابع أحدث محتوى ذِكر على صفحتنا الرسمية على فيسبوك.',
          category: 'منصة محتوى إسلامي',
          website: null,
          avatarUrl: fallbackAvatar,
          coverUrl: null,
          pageUrl: FALLBACK_PAGE_URL,
          likesCount: null,
          followersCount: null,
          followingCount: null,
          syncedAt: null,
          stale: true,
          configured: true,
          error: safeFacebookProfileError(error),
        };
  }
}
