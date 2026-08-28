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
type YoutubeSearchItem = { id: { videoId?: string }; snippet: YoutubeSnippet };
type YoutubePlaylistItem = { id: string; snippet: YoutubeSnippet; contentDetails?: { itemCount?: number } };
type YoutubeListResponse<T> = { items?: T[]; nextPageToken?: string; pageInfo?: { totalResults?: number } };

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

export type YoutubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
};

export type YoutubePlaylist = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  itemCount: number | null;
};

export type YoutubeChannelFeed = {
  configured: boolean;
  channelId: string | null;
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

function getYoutubeErrorCode(error: unknown): YoutubeChannelFeed['errorCode'] {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/\b429\b|quota exceeded|quotaExceeded|dailyLimitExceeded|forbidden.*quota/i.test(message)) {
    return 'quota_exceeded';
  }
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
    const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${searchParams.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`YouTube API failed (${response.status}): ${body.slice(0, 220)}`);
    }
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

function toVideo(row: YoutubeCacheRow): YoutubeVideo {
  return {
    id: row.video_id,
    title: row.title,
    description: row.description,
    publishedAt: row.published_at,
    thumbnailUrl: row.thumbnail_url,
  };
}

async function readCachedVideos(channelId: string): Promise<YoutubeVideo[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('youtube_feed_cache')
    .select('video_id,channel_id,title,description,thumbnail_url,published_at,video_url,synced_at')
    .eq('channel_id', channelId)
    .order('published_at', { ascending: false })
    .limit(CACHE_LIMIT);
  if (error) throw error;
  return ((data ?? []) as YoutubeCacheRow[]).map(toVideo);
}

async function readSyncHealth(channelId: string): Promise<YoutubeSyncHealth> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('youtube_sync_state')
    .select('id,channel_id,status,last_attempted_at,last_success_at,next_allowed_sync_at,last_error,updated_at')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  const row = data as YoutubeSyncStateRow | null;
  return {
    configured: true,
    status: row?.channel_id === channelId ? row.status : 'never_synced',
    lastAttemptedAt: row?.last_attempted_at ?? null,
    lastSuccessAt: row?.last_success_at ?? null,
    nextAllowedSyncAt: row?.next_allowed_sync_at ?? null,
    lastError: row?.last_error ?? null,
  };
}

export async function getYoutubeSyncHealth(): Promise<YoutubeSyncHealth> {
  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = getServerEnv();
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    return { configured: false, status: 'never_synced', lastAttemptedAt: null, lastSuccessAt: null, nextAllowedSyncAt: null, lastError: null };
  }
  try {
    return await readSyncHealth(YOUTUBE_CHANNEL_ID);
  } catch (error) {
    return {
      configured: true,
      status: 'error',
      lastAttemptedAt: null,
      lastSuccessAt: null,
      nextAllowedSyncAt: null,
      lastError: error instanceof Error ? error.message : 'Failed to read YouTube sync state.',
    };
  }
}

export async function getYoutubeChannelFeed(maxResults = 24): Promise<YoutubeChannelFeed> {
  const { YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY } = getServerEnv();
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    return { configured: false, channelId: null, videos: [], playlists: [] };
  }
  try {
    const videos = await readCachedVideos(YOUTUBE_CHANNEL_ID);
    return { configured: true, channelId: YOUTUBE_CHANNEL_ID, videos: videos.slice(0, maxResults), playlists: [], stale: false };
  } catch (error) {
    return {
      configured: true,
      channelId: YOUTUBE_CHANNEL_ID,
      videos: [],
      playlists: [],
      error: error instanceof Error ? error.message : 'Unable to read cached YouTube feed.',
      errorCode: 'unknown',
    };
  }
}

export async function syncYoutubeFeed(maxResults = 24): Promise<YoutubeChannelFeed> {
  const { YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY } = getServerEnv();
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    return { configured: false, channelId: null, videos: [], playlists: [], error: 'YouTube is not configured.' };
  }

  const supabase = createAdminClient();
  const now = Date.now();
  const health = await readSyncHealth(YOUTUBE_CHANNEL_ID);
  const nextAllowed = health.nextAllowedSyncAt ? new Date(health.nextAllowedSyncAt).getTime() : 0;
  if (nextAllowed > now) {
    const cached = await readCachedVideos(YOUTUBE_CHANNEL_ID);
    return {
      configured: true,
      channelId: YOUTUBE_CHANNEL_ID,
      videos: cached.slice(0, maxResults),
      playlists: [],
      stale: true,
      error: health.lastError ?? 'YouTube sync is temporarily throttled.',
      errorCode: health.status === 'quota_exceeded' ? 'quota_exceeded' : 'unknown',
    };
  }

  await supabase.from('youtube_sync_state').upsert({
    id: 1,
    channel_id: YOUTUBE_CHANNEL_ID,
    status: 'never_synced',
    last_attempted_at: new Date(now).toISOString(),
    next_allowed_sync_at: new Date(now + ERROR_COOLDOWN_MS).toISOString(),
    last_error: null,
  });

  try {
    const [videosResponse, playlistsResponse] = await Promise.all([
      youtubeFetch<YoutubeListResponse<YoutubeSearchItem>>('search', {
        part: 'snippet',
        channelId: YOUTUBE_CHANNEL_ID,
        maxResults,
        order: 'date',
        type: 'video',
      }),
      youtubeFetch<YoutubeListResponse<YoutubePlaylistItem>>('playlists', {
        part: 'snippet,contentDetails',
        channelId: YOUTUBE_CHANNEL_ID,
        maxResults: Math.min(maxResults, 25),
      }),
    ]);

    const videoRows = (videosResponse.items ?? []).flatMap((item) => {
      const id = item.id.videoId;
      if (!id) return [];
      return [{
        video_id: id,
        channel_id: YOUTUBE_CHANNEL_ID,
        title: item.snippet.title,
        description: item.snippet.description ?? '',
        thumbnail_url: pickThumbnail(item.snippet),
        published_at: item.snippet.publishedAt ?? null,
        video_url: `https://www.youtube.com/watch?v=${id}`,
        synced_at: new Date().toISOString(),
      }];
    });

    if (videoRows.length > 0) {
      const { error: upsertError } = await supabase.from('youtube_feed_cache').upsert(videoRows, { onConflict: 'video_id' });
      if (upsertError) throw upsertError;
    }

    const videos = videoRows.map(toVideo);
    const playlists: YoutubePlaylist[] = (playlistsResponse.items ?? []).map((item) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description ?? '',
      thumbnailUrl: pickThumbnail(item.snippet),
      itemCount: item.contentDetails?.itemCount ?? null,
    }));

    const syncedAt = new Date().toISOString();
    await supabase.from('youtube_sync_state').upsert({
      id: 1,
      channel_id: YOUTUBE_CHANNEL_ID,
      status: 'ok',
      last_attempted_at: syncedAt,
      last_success_at: syncedAt,
      next_allowed_sync_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      last_error: null,
    });

    return { configured: true, channelId: YOUTUBE_CHANNEL_ID, videos: videos.slice(0, maxResults), playlists, stale: false };
  } catch (error) {
    const errorCode = getYoutubeErrorCode(error);
    const cooldown = errorCode === 'quota_exceeded' ? QUOTA_COOLDOWN_MS : ERROR_COOLDOWN_MS;
    const message = error instanceof Error ? error.message : 'Unknown YouTube API error.';
    await supabase.from('youtube_sync_state').upsert({
      id: 1,
      channel_id: YOUTUBE_CHANNEL_ID,
      status: errorCode === 'quota_exceeded' ? 'quota_exceeded' : 'error',
      last_attempted_at: new Date().toISOString(),
      next_allowed_sync_at: new Date(Date.now() + cooldown).toISOString(),
      last_error: errorCode === 'quota_exceeded' ? 'YouTube API quota is temporarily exhausted.' : message.slice(0, 500),
    });

    const cached = await readCachedVideos(YOUTUBE_CHANNEL_ID);
    return {
      configured: true,
      channelId: YOUTUBE_CHANNEL_ID,
      videos: cached.slice(0, maxResults),
      playlists: [],
      stale: cached.length > 0,
      error: errorCode === 'quota_exceeded' ? 'YouTube API quota is temporarily exhausted; cached content remains available.' : message,
      errorCode,
    };
  }
}