import { supabaseServerAdminRequest } from '@/lib/supabase/admin-rest';
import { appendSmartLinkDisclosure, MONETAG_SMARTLINK_YOUTUBE_TAGS } from '@/lib/smartlink';
import type { VideoGenerationRequest } from '@/lib/types/video';
import { sourceHash, videoContentHash } from '../providers/content-hash';
import { CURRENT_VIDEO_RENDERER_VERSION } from './video-template-version';

export type { VideoGenerationRequest };

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

function socialHook(category: string) {
  const hooks: Record<string, string> = {
    quran: 'آية قصيرة تستحق دقيقة من التدبر',
    hadith: 'رسالة نحتاج أن نتذكرها اليوم',
    dua: 'ردّد هذا الدعاء بقلب حاضر',
    adhkar: 'اجعل هذه الدقيقة نصيبك من الذكر',
    story: 'قصة قصيرة بمعنى يبقى معك',
  };
  return hooks[category] || 'خذ دقيقة هادئة مع ذِكر';
}

function growthCallToAction() {
  return 'إذا نفعك المقطع، تابع ذِكر واحفظه وشاركه مع من تحب.';
}

function sourceSocialCaption(request: VideoGenerationRequest) {
  const content = contentObject(request);
  const ai = content.ai;
  const caption = ai && typeof ai === 'object' && typeof (ai as Record<string, unknown>).socialCaption === 'string'
    ? String((ai as Record<string, unknown>).socialCaption).trim()
    : '';
  const baseCaption = [caption || request.description || '', growthCallToAction()].filter(Boolean).join('\n\n').slice(0, 800);
  return appendSmartLinkDisclosure(baseCaption, content.audience !== 'kids');
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

    const category = data.category.trim();
    const text = ['textAr', 'text', 'script', 'prompt', 'narration']
      .map((key) => content[key])
      .find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim()
      ?? data.description.trim();
    const sourceId = typeof content.sourceId === 'string'
      ? content.sourceId
      : typeof content.curatedSourceId === 'string'
        ? content.curatedSourceId
        : '';
    const sourceUrl = typeof content.sourceUrl === 'string' ? content.sourceUrl : '';
    const resolution = typeof content.resolution === 'string' ? content.resolution : '';
    const format = /^\d+x\d+$/.test(resolution)
      ? (Number(resolution.split('x')[0]) > Number(resolution.split('x')[1]) ? 'horizontal' : 'vertical')
      : content.videoFormat === 'horizontal' ? 'horizontal' : 'vertical';
    const templateVersion = typeof content.templateVersion === 'string' && content.templateVersion.trim()
      ? content.templateVersion.trim()
      : CURRENT_VIDEO_RENDERER_VERSION;
    const language = typeof content.language === 'string' ? content.language : 'ar';
    const style = typeof content.templateAssetKey === 'string'
      ? content.templateAssetKey
      : typeof content.style === 'string' ? content.style : '';
    const sourceHashValue = sourceHash({ sourceId, sourceUrl, text });
    const contentHashValue = videoContentHash({
      category,
      sourceId,
      text,
      format,
      templateVersion,
      language,
      style,
    });

    content = {
      ...content,
      renderer: typeof content.renderer === 'string' ? content.renderer : 'template',
      templateVersion,
      sourceHash: sourceHashValue,
      contentHash: contentHashValue,
    };

    const result = await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      '/rest/v1/video_generation_requests',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description.trim(),
          category,
          content,
          source_hash: sourceHashValue,
          content_hash: contentHashValue,
          template_version: templateVersion,
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
  const title = `${socialHook(request.category)} | ${request.title}`.slice(0, 100);
  return {
    title,
    description: [sourceSocialCaption(request), qualityNote, sourceLabel, isShort ? '#Shorts' : '', '#ذكر #تدبر #اسلاميات'].filter(Boolean).join('\n\n'),
    tags: ['zikr', 'islamic', 'quran', 'hadith', 'dua', 'adhkar', 'تعلم', 'تدبر', 'ذكر', ...(isShort ? ['shorts', 'ريلز'] : []), ...(content.audience === 'kids' ? [] : [...MONETAG_SMARTLINK_YOUTUBE_TAGS])],
    categoryId: '27',
    isShort,
  };
}

export function generateFacebookMetadata(request: VideoGenerationRequest) {
  return { title: `${socialHook(request.category)} | ${request.title}`.slice(0, 150), description: sourceSocialCaption(request) };
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

/**
 * External provider publishing is retired. Generated media is registered and
 * published only through the internal ZIKR website catalog.
 */
export async function publishToYoutube(
  _videoId: string,
  _metadata: ReturnType<typeof generateYoutubeMetadata>,
  _videoUrl: string,
  _options: { selfDeclaredMadeForKids?: boolean } = {},
): Promise<string> {
  throw new Error("EXTERNAL_SOCIAL_PUBLISHING_RETIRED");
}

export async function publishToFacebook(
  _videoId: string,
  _metadata: ReturnType<typeof generateFacebookMetadata>,
  _videoUrl: string,
  _pageId: string,
  _asReel = false,
): Promise<string | null> {
  throw new Error("EXTERNAL_SOCIAL_PUBLISHING_RETIRED");
}
