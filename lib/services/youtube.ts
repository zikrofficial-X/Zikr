import { getServerEnv } from '@/lib/env';

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
};

function getYoutubeErrorCode(error: unknown): YoutubeChannelFeed['errorCode'] {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/\b429\b|quota exceeded|quotaExceeded|dailyLimitExceeded/i.test(message)) {
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
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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

export async function getYoutubeChannelFeed(maxResults = 24): Promise<YoutubeChannelFeed> {
  const { YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY } = getServerEnv();
  
  // Return early if not configured
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    return { configured: false, channelId: null, videos: [], playlists: [] };
  }

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
        maxResults,
      }),
    ]);

    return {
      configured: true,
      channelId: YOUTUBE_CHANNEL_ID,
      videos: (videosResponse.items ?? []).flatMap((item) => {
        const id = item.id.videoId;
        if (!id) return [];
        return [{
          id,
          title: item.snippet.title,
          description: item.snippet.description ?? '',
          publishedAt: item.snippet.publishedAt ?? null,
          thumbnailUrl: pickThumbnail(item.snippet),
        }];
      }),
      playlists: (playlistsResponse.items ?? []).map((item) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description ?? '',
        thumbnailUrl: pickThumbnail(item.snippet),
        itemCount: item.contentDetails?.itemCount ?? null,
      })),
    };
  } catch (error) {
    return {
      configured: true,
      channelId: YOUTUBE_CHANNEL_ID,
      videos: [],
      playlists: [],
      error: error instanceof Error ? error.message : 'Unknown YouTube API error.',
      errorCode: getYoutubeErrorCode(error),
    };
  }
}
