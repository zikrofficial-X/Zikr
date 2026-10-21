import { supabaseServerAdminRequest } from '@/lib/supabase/admin-rest';
import { getServerEnv } from '@/lib/env';
import {
  getFacebookPageCredentials,
  setFacebookReelsNextAllowedAt,
} from '@/features/social/services/facebook-credentials';
import {
  FACEBOOK_REELS_MIN_POST_INTERVAL_MS,
  FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS,
  facebookReelsCooldownDeferredError,
  isFacebookReelsRateLimitResponseError,
  resolveFacebookReelsNextAllowedAt,
} from '@/features/social/services/facebook-reels-rate-limit';
import type { VideoGenerationRequest } from '@/lib/types/video';

export type { VideoGenerationRequest };

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

function contentObject(request: VideoGenerationRequest): Record<string, unknown> {
  return request.content && typeof request.content === 'object' && !Array.isArray(request.content)
    ? (request.content as Record<string, unknown>)
    : {};
}

function isVerticalVideo(request: VideoGenerationRequest): boolean {
  const content = contentObject(request);
  if (content.videoFormat === 'horizontal') return false;
  const resolution = typeof content.resolution === 'string' ? content.resolution : '';
  return /^(?:\d+x\d+)?$/.test(resolution)
    ? (() => {
        const match = resolution.match(/^(\d+)x(\d+)$/);
        return match ? Number(match[2]) > Number(match[1]) : true;
      })()
    : true;
}

/** Create a durable video-generation request for the canonical template worker. */
export async function createVideoGenerationRequest(data: {
  title: string;
  description: string;
  category: string;
  content: string | Record<string, unknown>;
}): Promise<VideoGenerationRequest | null> {
  try {
    let content: Record<string, unknown> = {};
    if (typeof data.content === 'string') {
      try {
        const parsed = JSON.parse(data.content);
        content = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : { text: data.content };
      } catch {
        content = { text: data.content };
      }
    } else {
      content = { ...data.content };
    }

    content = {
      ...content,
      renderer: typeof content.renderer === 'string' ? content.renderer : 'template',
    };

    const result = await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      '/rest/v1/video_generation_requests',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description.trim(),
          category: data.category.trim(),
          content,
          status: 'pending',
          error_message: null,
          error_details: null,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return Array.isArray(result) ? result[0] ?? null : result ?? null;
  } catch (error) {
    console.error('[video-automation] Failed to create video request:', error);
    return null;
  }
}

export async function getPendingVideoRequests(limit = 100): Promise<VideoGenerationRequest[]> {
  try {
    return (await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      `/rest/v1/video_generation_requests?status=eq.pending&order=created_at.asc&limit=${Math.max(1, Math.min(500, limit))}`,
    )) ?? [];
  } catch (error) {
    console.error('[video-automation] Failed to fetch pending requests:', error);
    return [];
  }
}

/** Optimistic queue claim. The database condition prevents duplicate claims. */
export async function claimPendingVideoRequests(limit = 100): Promise<VideoGenerationRequest[]> {
  const pending = await getPendingVideoRequests(limit);
  const claimed: VideoGenerationRequest[] = [];
  for (const request of pending) {
    try {
      const result = await supabaseServerAdminRequest<VideoGenerationRequest[]>(
        `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}&status=eq.pending&updated_at=eq.${encodeURIComponent(request.updated_at)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({
            status: 'processing',
            error_message: null,
            error_details: null,
            updated_at: new Date().toISOString(),
          }),
        },
      );
      if (result?.[0]) claimed.push(result[0]);
    } catch (error) {
      console.error(`[video-automation] Failed to claim ${request.id}:`, error);
    }
  }
  return claimed;
}


export async function getAllVideoRequests(): Promise<VideoGenerationRequest[]> {
  try {
    return (await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      '/rest/v1/video_generation_requests?order=created_at.desc&limit=200',
    )) ?? [];
  } catch (error) {
    console.error('[video-automation] Failed to fetch video requests:', error);
    return [];
  }
}

export async function updateVideoRequestStatus(
  videoId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  metadata?: { youtubeId?: string; facebookId?: string; videoUrl?: string },
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (metadata?.youtubeId) body.youtube_id = metadata.youtubeId;
    if (metadata?.facebookId) body.facebook_id = metadata.facebookId;
    if (metadata?.videoUrl) body.video_url = metadata.videoUrl;
    if (status === 'pending') {
      const existingContentRows = await supabaseServerAdminRequest<Array<{ content: unknown }>>(
        '/rest/v1/video_generation_requests?id=eq.' + encodeURIComponent(videoId) + '&select=content&limit=1',
      );
      const existing = existingContentRows?.[0]?.content;
      const content = existing && typeof existing === 'object' && !Array.isArray(existing)
        ? existing as Record<string, unknown> : {};
      body.content = { ...content, approvalStatus: 'awaiting_human_review', approvalReviewedAt: null, qualityReview: null };
      body.error_message = null;
      body.error_details = null;
      body.youtube_id = null;
      body.facebook_id = null;
      body.video_url = null;
      body.heygen_video_id = null;
      body.heygen_status = null;
      body.heygen_submitted_at = null;
      body.heygen_last_polled_at = null;
    }
    await supabaseServerAdminRequest(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(videoId)}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) },
    );
    return true;
  } catch (error) {
    console.error('[video-automation] Failed to update video request:', error);
    return false;
  }
}

export function generateYoutubeMetadata(request: VideoGenerationRequest) {
  const isShort = isVerticalVideo(request);
  const content = contentObject(request);
  const sourceLabel = typeof content.sourceLabel === 'string' ? content.sourceLabel : '';
  const qualityNote = 'محتوى تعليمي موثق بإيقاع واضح وترجمة نصية سهلة القراءة.';
  return {
    title: request.title.slice(0, 100),
    description: [request.description ?? '', qualityNote, sourceLabel, isShort ? '#Shorts' : ''].filter(Boolean).join('\n\n'),
    tags: ['islamic', 'quran', 'hadith', 'dua', 'adhkar', 'تعلم', 'تدبر', ...(isShort ? ['shorts', 'ريلز'] : [])],
    categoryId: '27',
    isShort,
  };
}

export function generateFacebookMetadata(request: VideoGenerationRequest) {
  return { title: request.title, description: request.description ?? '' };
}

export async function generateQuranVideo(
  surahId: number,
  ayahStart: number,
  ayahEnd: number,
  reciterId?: string,
): Promise<VideoGenerationRequest | null> {
  return createVideoGenerationRequest({
    title: `تلاوة سورة رقم ${surahId} - الآيات ${ayahStart}-${ayahEnd}`,
    description: `تلاوة من القرآن الكريم - سورة رقم ${surahId}، من الآية ${ayahStart} إلى الآية ${ayahEnd}`,
    category: 'quran',
    content: {
      renderer: 'template',
      type: 'quran',
      surahId,
      ayahStart,
      ayahEnd,
      reciterId,
    },
  });
}

export async function generateHadithVideo(hadithId: string, bookId: string): Promise<VideoGenerationRequest | null> {
  return createVideoGenerationRequest({
    title: 'حديث شريف',
    description: 'حديث من السنة النبوية الشريفة',
    category: 'hadith',
    content: { renderer: 'template', type: 'hadith', hadithId, bookId },
  });
}

export async function generateStoryVideo(storyId: string): Promise<VideoGenerationRequest | null> {
  return createVideoGenerationRequest({
    title: 'قصة إسلامية',
    description: 'قصة إسلامية مؤثرة',
    category: 'story',
    content: { renderer: 'template', type: 'story', storyId },
  });
}

export async function generateDuaVideo(duaId: string): Promise<VideoGenerationRequest | null> {
  return createVideoGenerationRequest({
    title: 'دعاء مستجاب',
    description: 'دعاء من أدعية القرآن والسنة',
    category: 'dua',
    content: { renderer: 'template', type: 'dua', duaId },
  });
}

export async function generateAdhkarVideo(
  adhkarType: 'morning' | 'evening' | 'prayer',
): Promise<VideoGenerationRequest | null> {
  const titles = { morning: 'أذكار الصباح', evening: 'أذكار المساء', prayer: 'أذكار بعد الصلاة' };
  return createVideoGenerationRequest({
    title: titles[adhkarType],
    description: `مجموعة أذكار ${titles[adhkarType]}`,
    category: 'adhkar',
    content: { renderer: 'template', type: 'adhkar', adhkarType },
  });
}

function assertRemoteVideoUrl(videoUrl: string, target: string): string {
  const parsed = new URL(videoUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${target} requires an HTTP(S) media URL`);
  const host = parsed.hostname.toLowerCase();
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host.endsWith('.youtu.be')) {
    throw new Error(`${target} requires the original media file, not a YouTube watch URL`);
  }
  return parsed.toString();
}

async function getYoutubeAccessToken(): Promise<string> {
  const clientId = getEnv('YOUTUBE_CLIENT_ID');
  const clientSecret = getEnv('YOUTUBE_CLIENT_SECRET');
  const refreshToken = getEnv('YOUTUBE_REFRESH_TOKEN');
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YouTube OAuth is not configured: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN are required');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!response.ok) {
      throw new Error(
        `YouTube OAuth token refresh failed (HTTP ${response.status}): ${payload.error_description || payload.error || 'unknown OAuth error'}`,
      );
    }
    if (!payload.access_token) {
      throw new Error('YouTube OAuth token refresh succeeded without an access token');
    }
    return payload.access_token;
  } catch (error) {
    console.error('[video-automation] YouTube token refresh failed:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function resolveYoutubePrivacy(): 'public' | 'unlisted' | 'private' {
  const value = process.env.YOUTUBE_UPLOAD_PRIVACY?.trim().toLowerCase();
  return value === 'unlisted' || value === 'private' ? value : 'public';
}

export async function publishToYoutube(
  videoId: string,
  metadata: ReturnType<typeof generateYoutubeMetadata>,
  videoUrl: string,
): Promise<string> {
  void videoId;
  const accessToken = await getYoutubeAccessToken();
  const source = assertRemoteVideoUrl(videoUrl, 'YouTube');
  const videoResponse = await fetch(source, { signal: AbortSignal.timeout(60_000) });
  if (!videoResponse.ok) {
    throw new Error(`Could not download generated video (HTTP ${videoResponse.status})`);
  }
  const videoBuffer = await videoResponse.arrayBuffer();
  if (videoBuffer.byteLength < 1024) {
    throw new Error('Generated video download was empty or invalid');
  }

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(videoBuffer.byteLength),
      },
      body: JSON.stringify({
        snippet: {
          title: metadata.title.slice(0, 100),
          description: metadata.description.slice(0, 5000),
          tags: metadata.tags,
          categoryId: metadata.categoryId,
        },
        status: { privacyStatus: resolveYoutubePrivacy(), selfDeclaredMadeForKids: false },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const initBody = await initResponse.text();
  if (!initResponse.ok) {
    throw new Error(`YouTube upload initialization failed (HTTP ${initResponse.status}): ${initBody.slice(0, 500)}`);
  }
  const uploadLocation = initResponse.headers.get('location');
  if (!uploadLocation) {
    throw new Error('YouTube upload initialization succeeded without a resumable upload URL');
  }

  const uploadResponse = await fetch(uploadLocation, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(videoBuffer.byteLength) },
    body: videoBuffer,
    signal: AbortSignal.timeout(120_000),
  });
  const uploadBody = await uploadResponse.text();
  if (!uploadResponse.ok) {
    throw new Error(`YouTube video upload failed (HTTP ${uploadResponse.status}): ${uploadBody.slice(0, 500)}`);
  }

  let payload: { id?: string };
  try {
    payload = JSON.parse(uploadBody) as { id?: string };
  } catch {
    throw new Error('YouTube video upload returned an invalid JSON response');
  }
  if (!payload.id) {
    throw new Error('YouTube video upload completed without returning a video ID');
  }
  return payload.id;
}

type FacebookVideoApiResponse = {
  id?: string;
  video_id?: string;
  upload_url?: string;
  post_id?: string;
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number | string;
    error_subcode?: number | string;
    fbtrace_id?: string;
  };
};

async function readFacebookApiResponse(response: Response): Promise<FacebookVideoApiResponse> {
  const body = await response.text().catch(() => "");
  if (!body) return {};
  try {
    return JSON.parse(body) as FacebookVideoApiResponse;
  } catch {
    return { message: body.slice(0, 300) };
  }
}

function facebookApiFailure(stage: string, status: number, payload: FacebookVideoApiResponse): Error {
  const provider = payload.error;
  const message = provider?.message || payload.message;
  const details = [
    provider?.type ? `type=${provider.type}` : "",
    provider?.code !== undefined ? `code=${provider.code}` : "",
    provider?.error_subcode !== undefined ? `subcode=${provider.error_subcode}` : "",
    provider?.fbtrace_id ? `trace=${provider.fbtrace_id}` : "",
  ].filter(Boolean);
  const responseHint = message ? `: ${message}` : " (Meta did not provide an error message)";
  const codes = details.length ? ` [${details.join(", ")}]` : "";
  return new Error(`${stage} failed (HTTP ${status})${responseHint}${codes}`);
}

export async function publishToFacebook(
  videoId: string,
  metadata: ReturnType<typeof generateFacebookMetadata>,
  videoUrl: string,
  pageId: string,
  asReel = false,
): Promise<string | null> {
  void videoId;
  try {
    const env = getServerEnv();
    const credentials = await getFacebookPageCredentials();
    if (!credentials.isEnabled) {
      throw new Error("Facebook publishing is disabled. Connect the Page from the admin publishing center.");
    }
    const pageAccessToken = credentials.accessToken;
    const actualPageId = credentials.pageId || pageId;
    if (!pageAccessToken || !actualPageId) {
      throw new Error("Facebook Page credentials are incomplete. Reconnect the Page from the admin publishing center.");
    }
    if (asReel && credentials.reelsNextAllowedAt) {
      const cooldownUntil = Date.parse(credentials.reelsNextAllowedAt);
      if (Number.isFinite(cooldownUntil) && cooldownUntil > Date.now()) {
        throw facebookReelsCooldownDeferredError(credentials.reelsNextAllowedAt);
      }
    }
    const source = assertRemoteVideoUrl(videoUrl, 'Facebook');
    const version = env.FACEBOOK_GRAPH_API_VERSION || 'v26.0';

    if (asReel) {
      const startParams = new URLSearchParams({ upload_phase: 'start', access_token: pageAccessToken });
      const startResponse = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(actualPageId)}/video_reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: startParams,
        signal: AbortSignal.timeout(20_000),
      });
      const startData = await readFacebookApiResponse(startResponse);
      if (!startResponse.ok || !startData.video_id || !startData.upload_url) {
        throw facebookApiFailure("Facebook Reel start", startResponse.status, {
          ...startData,
          message: startData.message || (!startData.video_id || !startData.upload_url
            ? "Meta response omitted video_id or upload_url"
            : undefined),
        });
      }

      const uploadResponse = await fetch(startData.upload_url, {
        method: 'POST',
        headers: { Authorization: `OAuth ${pageAccessToken}`, file_url: source },
        signal: AbortSignal.timeout(120_000),
      });
      const uploadData = await readFacebookApiResponse(uploadResponse);
      if (!uploadResponse.ok || uploadData.success !== true) {
        throw facebookApiFailure("Facebook Reel upload", uploadResponse.status, {
          ...uploadData,
          message: uploadData.message || (uploadData.success !== true
            ? "Meta upload response did not confirm success"
            : undefined),
        });
      }

      const finishParams = new URLSearchParams({ upload_phase: 'finish', video_id: startData.video_id, video_state: 'PUBLISHED', title: metadata.title, description: metadata.description, is_ai_generated: 'true', access_token: pageAccessToken });
      const finishResponse = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(actualPageId)}/video_reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: finishParams,
        signal: AbortSignal.timeout(20_000),
      });
      const finishData = await readFacebookApiResponse(finishResponse);
      if (!finishResponse.ok || finishData.success !== true) {
        throw facebookApiFailure("Facebook Reel publish", finishResponse.status, {
          ...finishData,
          message: finishData.message || (finishData.success !== true
            ? "Meta publish response did not confirm success"
            : undefined),
        });
      }
      // Pace Reels to at most one per scheduled publisher run. Meta has already
      // applied a rate restriction, so do not send a burst immediately after recovery.
      await setFacebookReelsNextAllowedAt(
        new Date(Date.now() + FACEBOOK_REELS_MIN_POST_INTERVAL_MS).toISOString(),
      );
      return finishData.post_id ?? startData.video_id;
    }

    const params = new URLSearchParams({ file_url: source, title: metadata.title, description: metadata.description, access_token: pageAccessToken });
    const response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(actualPageId)}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(120_000),
    });
    const data = await readFacebookApiResponse(response);
    if (!response.ok) {
      throw facebookApiFailure("Facebook video publish", response.status, data);
    }
    if (!data.id) {
      throw new Error("Facebook video publish succeeded without returning a video ID.");
    }
    return data.id;
  } catch (error) {
    if (asReel && isFacebookReelsRateLimitResponseError(error)) {
      const rateLimitedUntil = resolveFacebookReelsNextAllowedAt(error)
        ?? new Date(Date.now() + FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS).toISOString();
      try {
        await setFacebookReelsNextAllowedAt(rateLimitedUntil);
      } catch {
        // Keep the external provider failure visible even if cooldown persistence fails.
        console.error('[video-automation] Unable to persist the Facebook Reels rate-limit cooldown.');
      }
      const message = error instanceof Error ? error.message : String(error);
      const rateLimitedError = new Error(`${message} [facebook_reels_rate_limited_until=${rateLimitedUntil}]`);
      console.error('[video-automation] Facebook Reels rate-limited:', rateLimitedError.message);
      throw rateLimitedError;
    }
    // Preserve the stage-specific Meta error instead of returning an opaque null.
    console.error(
      '[video-automation] Failed to publish to Facebook:',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}


