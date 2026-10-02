import { getServerEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/server';

type YoutubeThumbnail = { url: string; width?: number; height?: number };
type YoutubeSnippet = {
  title: string;
  description?: string;
  publishedAt?: string;
  thumbnails?: Record<string, YoutubeThumbnail>;
  channelTitle?: string;
  resourceId?: { videoId?: string };
};
type YoutubeSearchItem = { id: { videoId?: string; channelId?: string }; snippet: YoutubeSnippet };
type YoutubePlaylistItem = { id: string; snippet: YoutubeSnippet; contentDetails?: { itemCount?: number } };
type YoutubeListResponse<T> = { items?: T[]; nextPageToken?: string; pageInfo?: { totalResults?: number } };
type YoutubeChannelItem = { id: string; snippet?: { title?: string; description?: string; customUrl?: string; thumbnails?: Record<string, YoutubeThumbnail> }; statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string } };

type YoutubeCacheRow = {
  video_id: string;
  channel_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  published_at: string | null;
  video_url: string;
  synced_at: string;
};

type YoutubeSyncStateRow = {
  id: number;
  channel_id: string | null;
  status: 'never_synced' | 'ok' | 'quota_exceeded' | 'error';
  last_attempted_at: string | null;
  last_success_at: string | null;
  next_allowed_sync_at: string | null;
  last_error: string | null;
  updated_at: string;
};

export type YoutubeVideo = { id: string; title: string; description: string; publishedAt: string | null; thumbnailUrl: string | null };
export type YoutubePlaylist = { id: string; title: string; description: string; thumbnailUrl: string | null; itemCount: number | null };
export type YoutubeChannel = {
  id: string;
  name: string;
  description: string;
  handle: string | null;
  avatarUrl: string | null;
  pageUrl: string;
  subscriberCount: number | null;
  viewCount: number | null;
  videoCount: number | null;
};
export type YoutubeChannelFeed = {
  configured: boolean;
  channelId: string | null;
  channel: YoutubeChannel | null;
  videos: YoutubeVideo[];
  playlists: YoutubePlaylist[];
  error?: string;
  errorCode?: 'quota_exceeded' | 'http_error' | 'unknown';
  stale?: boolean;
};
export type YoutubeSyncHealth = {
  configured: boolean;
  status: YoutubeSyncStateRow['status'];
  lastAttemptedAt: string | null;
  lastSuccessAt: string | null;
  nextAllowedSyncAt: string | null;
  lastError: string | null;
};

const CACHE_TTL_MS = 45 * 60 * 1000;
const QUOTA_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const ERROR_COOLDOWN_MS = 15 * 60 * 1000;
const CACHE_LIMIT = 100;
const SYNC_LOCK_MS = 10 * 60 * 1000;

export function normalizeYoutubeChannelInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'channel' && segments[1]) return segments[1];
    if (segments[0]?.startsWith('@')) return segments[0];
    if (segments[0] === 'c' && segments[1]) return segments[1];
    if (segments[0] === 'user' && segments[1]) return segments[1];
  } catch {
    // Plain channel ids and handles are handled below.
  }
  return trimmed.replace(/^@?/, match => (trimmed.startsWith('@') ? match : ''));
}

function getYoutubeErrorCode(error: unknown): YoutubeChannelFeed['errorCode'] {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/\b429\b|quota exceeded|quotaExceeded|dailyLimitExceeded|forbidden.*quota/i.test(message)) return 'quota_exceeded';
  if (/YouTube API failed \(\d{3}\)/i.test(message)) return 'http_error';
  return 'unknown';
}

export function isYoutubeQuotaError(feed: Pick<YoutubeChannelFeed, 'error' | 'errorCode'>) {
  return feed.errorCode === 'quota_exceeded' || /\b429\b|quota exceeded|quotaExceeded|dailyLimitExceeded/i.test(feed.error ?? '');
}

function pickThumbnail(snippet: YoutubeSnippet) {
  return snippet.thumbnails?.maxres?.url ?? snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? null;
}

async function youtubeFetch<T>(path: string, params: Record<string, string | number | undefined>) {
  const { YOUTUBE_API_KEY } = getServerEnv();
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is missing.');
  const searchParams = new URLSearchParams();
  Object.entries({ ...params, key: YOUTUBE_API_KEY }).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${searchParams.toString()}`, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`YouTube API failed (${response.status}): ${body.slice(0, 220)}`);
    }
    return response.json() as Promise<T>;
  } finally { clearTimeout(timeoutId); }
}

async function resolveYoutubeChannelId(input: string) {
  const candidate = normalizeYoutubeChannelInput(input);
  if (/^UC[A-Za-z0-9_-]{22}$/.test(candidate)) return candidate;

  if (candidate.startsWith('@')) {
    const response = await youtubeFetch<YoutubeListResponse<{ id: string }>>('channels', { part: 'id', forHandle: candidate });
    const id = response.items?.[0]?.id;
    if (id) return id;
  }

  const response = await youtubeFetch<YoutubeListResponse<YoutubeSearchItem>>('search', { part: 'snippet', q: candidate.replace(/^@/, ''), type: 'channel', maxResults: 1 });
  const id = response.items?.[0]?.id?.channelId;
  if (id) return id;
  throw new Error(`YouTube channel was not found for ${input}.`);
}

function toVideo(row: YoutubeCacheRow): YoutubeVideo {
  return { id: row.video_id, title: row.title, description: row.description, publishedAt: row.published_at, thumbnailUrl: row.thumbnail_url };
}

function toYoutubeChannel(row: Record<string, unknown> | null): YoutubeChannel | null {
  if (!row || row.platform !== 'youtube' || !row.external_id) return null;
  return {
    id: String(row.external_id),
    name: String(row.name ?? 'ZIKR | ذِكرٌ'),
    description: String(row.description ?? ''),
    handle: row.handle ? String(row.handle) : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    pageUrl: String(row.page_url ?? 'https://www.youtube.com/@ZikrMediaOfficial'),
    subscriberCount: row.subscribers_count == null ? null : Number(row.subscribers_count),
    viewCount: row.view_count == null ? null : Number(row.view_count),
    videoCount: row.video_count == null ? null : Number(row.video_count),
  };
}

async function readCachedChannel(): Promise<YoutubeChannel | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('social_platform_profiles').select('*').eq('platform', 'youtube').maybeSingle();
  if (error) throw error;
  return toYoutubeChannel((data ?? null) as Record<string, unknown> | null);
}

async function readCachedVideos(channelId: string): Promise<YoutubeVideo[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('youtube_feed_cache').select('video_id,channel_id,title,description,thumbnail_url,published_at,video_url,synced_at').eq('channel_id', channelId).order('published_at', { ascending: false }).limit(CACHE_LIMIT);
  if (error) throw error;
  return ((data ?? []) as YoutubeCacheRow[]).map(toVideo);
}

async function readSyncHealth(channelId: string): Promise<YoutubeSyncHealth> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('youtube_sync_state').select('id,channel_id,status,last_attempted_at,last_success_at,next_allowed_sync_at,last_error,updated_at').eq('id', 1).maybeSingle();
  if (error) throw error;
  const row = data as YoutubeSyncStateRow | null;
  return { configured: true, status: row?.channel_id === channelId ? row.status : 'never_synced', lastAttemptedAt: row?.last_attempted_at ?? null, lastSuccessAt: row?.last_success_at ?? null, nextAllowedSyncAt: row?.next_allowed_sync_at ?? null, lastError: row?.last_error ?? null };
}

export async function getYoutubeSyncHealth(): Promise<YoutubeSyncHealth> {
  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = getServerEnv();
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return { configured: false, status: 'never_synced', lastAttemptedAt: null, lastSuccessAt: null, nextAllowedSyncAt: null, lastError: null };
  try { return await readSyncHealth(YOUTUBE_CHANNEL_ID); }
  catch (error) { return { configured: true, status: 'error', lastAttemptedAt: null, lastSuccessAt: null, nextAllowedSyncAt: null, lastError: error instanceof Error ? error.message : 'Failed to read YouTube sync state.' }; }
}

export async function getYoutubeChannelFeed(maxResults = 24): Promise<YoutubeChannelFeed> {
  const { YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY } = getServerEnv();
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return { configured: false, channelId: null, channel: null, videos: [], playlists: [] };
  try {
    const [videos, health, channel] = await Promise.all([
      readCachedVideos(YOUTUBE_CHANNEL_ID),
      readSyncHealth(YOUTUBE_CHANNEL_ID),
      readCachedChannel(),
    ]);
    const nextAllowed = health.nextAllowedSyncAt ? new Date(health.nextAllowedSyncAt).getTime() : 0;
    if (videos.length === 0 || nextAllowed <= Date.now()) return await syncYoutubeFeed(maxResults);
    return { configured: true, channelId: YOUTUBE_CHANNEL_ID, channel, videos: videos.slice(0, maxResults), playlists: [] };
  } catch (error) {
    return { configured: true, channelId: YOUTUBE_CHANNEL_ID, channel: null, videos: [], playlists: [], error: error instanceof Error ? error.message : 'Unable to read cached YouTube feed.', errorCode: 'unknown' };
  }
}

export async function syncYoutubeFeed(maxResults = 24): Promise<YoutubeChannelFeed> {
  const { YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY } = getServerEnv();
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return { configured: false, channelId: null, channel: null, videos: [], playlists: [], error: 'YouTube is not configured.' };

  const channelId = await resolveYoutubeChannelId(YOUTUBE_CHANNEL_ID);

  const supabase = createAdminClient();
  const health = await readSyncHealth(channelId);
  const now = Date.now();
  const nextAllowed = health.nextAllowedSyncAt ? new Date(health.nextAllowedSyncAt).getTime() : 0;
  const lastAttempted = health.lastAttemptedAt ? new Date(health.lastAttemptedAt).getTime() : 0;
  if (nextAllowed > now || (lastAttempted > now - SYNC_LOCK_MS && !health.lastSuccessAt)) {
    const [cached, channel] = await Promise.all([readCachedVideos(channelId), readCachedChannel()]);
    return { configured: true, channelId, channel, videos: cached.slice(0, maxResults), playlists: [], stale: true, error: health.lastError ?? 'YouTube sync is temporarily throttled.', errorCode: health.status === 'quota_exceeded' ? 'quota_exceeded' : 'unknown' };
  }

  const attemptAt = new Date().toISOString();
  const { error: stateError } = await supabase.from('youtube_sync_state').upsert({ id: 1, channel_id: channelId, status: 'never_synced', last_attempted_at: attemptAt, next_allowed_sync_at: new Date(now + SYNC_LOCK_MS).toISOString(), last_error: null });
  if (stateError) throw stateError;

  try {
    const [videosResponse, playlistsResponse, channelResponse] = await Promise.all([
      youtubeFetch<YoutubeListResponse<YoutubeSearchItem>>('search', { part: 'snippet', channelId, maxResults, order: 'date', type: 'video' }),
      youtubeFetch<YoutubeListResponse<YoutubePlaylistItem>>('playlists', { part: 'snippet,contentDetails', channelId, maxResults: Math.min(maxResults, 25) }),
      youtubeFetch<YoutubeListResponse<YoutubeChannelItem>>('channels', { part: 'snippet,statistics', id: channelId }),
    ]);

    const syncedAt = new Date().toISOString();
    const videoRows = (videosResponse.items ?? []).flatMap((item) => {
      const id = item.id.videoId;
      if (!id) return [];
      return [{ video_id: id, channel_id: channelId, title: item.snippet.title, description: item.snippet.description ?? '', thumbnail_url: pickThumbnail(item.snippet), published_at: item.snippet.publishedAt ?? null, video_url: `https://www.youtube.com/watch?v=${id}`, synced_at: syncedAt }];
    });
    if (videoRows.length > 0) {
      const { error } = await supabase.from('youtube_feed_cache').upsert(videoRows, { onConflict: 'video_id' });
      if (error) throw error;
    }

    const channelItem = channelResponse.items?.[0];
    const channelProfile = channelItem ? {
      platform: 'youtube',
      external_id: channelId,
      handle: channelItem.snippet?.customUrl ?? null,
      name: channelItem.snippet?.title ?? 'ZIKR | ذِكرٌ',
      description: channelItem.snippet?.description ?? '',
      category: 'media',
      website: null,
      avatar_url: channelItem.snippet?.thumbnails?.high?.url ?? channelItem.snippet?.thumbnails?.default?.url ?? null,
      cover_url: null,
      page_url: channelItem.snippet?.customUrl ? `https://www.youtube.com/${channelItem.snippet.customUrl.replace(/^\//, '')}` : `https://www.youtube.com/channel/${channelId}`,
      subscribers_count: channelItem.statistics?.subscriberCount ? Number(channelItem.statistics.subscriberCount) : null,
      followers_count: null,
      likes_count: null,
      following_count: null,
      view_count: channelItem.statistics?.viewCount ? Number(channelItem.statistics.viewCount) : null,
      video_count: channelItem.statistics?.videoCount ? Number(channelItem.statistics.videoCount) : null,
      synced_at: syncedAt,
      status: 'ok',
      last_error: null,
    };
    const { error: profileError } = await supabase.from('social_platform_profiles').upsert(channelProfile, { onConflict: 'platform' });
    if (profileError) throw profileError;

    const videos = await readCachedVideos(channelId);
    const channel = toYoutubeChannel(channelProfile as unknown as Record<string, unknown>);
    const playlists: YoutubePlaylist[] = (playlistsResponse.items ?? []).map((item) => ({ id: item.id, title: item.snippet.title, description: item.snippet.description ?? '', thumbnailUrl: pickThumbnail(item.snippet), itemCount: item.contentDetails?.itemCount ?? null }));
    await supabase.from('youtube_sync_state').upsert({ id: 1, channel_id: channelId, status: 'ok', last_attempted_at: syncedAt, last_success_at: syncedAt, next_allowed_sync_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(), last_error: null });
    return { configured: true, channelId, channel, videos: videos.slice(0, maxResults), playlists, stale: false };
  } catch (error) {
    const errorCode = getYoutubeErrorCode(error);
    const cooldown = errorCode === 'quota_exceeded' ? QUOTA_COOLDOWN_MS : ERROR_COOLDOWN_MS;
    const message = error instanceof Error ? error.message : 'Unknown YouTube API error.';
    await supabase.from('youtube_sync_state').upsert({ id: 1, channel_id: channelId, status: errorCode === 'quota_exceeded' ? 'quota_exceeded' : 'error', last_attempted_at: new Date().toISOString(), next_allowed_sync_at: new Date(Date.now() + cooldown).toISOString(), last_error: errorCode === 'quota_exceeded' ? 'YouTube API quota is temporarily exhausted.' : message.slice(0, 500) });
    const [cached, channel] = await Promise.all([readCachedVideos(channelId), readCachedChannel()]);
    return { configured: true, channelId, channel, videos: cached.slice(0, maxResults), playlists: [], stale: cached.length > 0, error: errorCode === 'quota_exceeded' ? 'YouTube API quota is temporarily exhausted; cached content remains available.' : message, errorCode };
  }
}
