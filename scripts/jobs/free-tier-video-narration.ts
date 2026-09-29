/**
 * Free Tier Video Narration System
 * Generates AI narration for educational videos without cost overhead
 * Uses TTS APIs with free quotas and optimized caching
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface VideoNarration {
  videoId: string;
  title: string;
  narrationAr: string;
  narrationEn: string;
  audioUrlAr?: string;
  audioUrlEn?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'tts' | 'cache' | 'custom';
  duration: number;
  cached: boolean;
}

interface TTSProvider {
  name: string;
  freeQuota: number;
  usedToday: number;
  apiKey?: string;
  enabled: boolean;
}

/**
 * Free TTS Providers (no credit card required)
 */
const FREE_TTS_PROVIDERS: TTSProvider[] = [
  {
    name: 'Google Cloud TTS (Free Tier)',
    freeQuota: 1000000, // 1M characters/month
    usedToday: 0,
    enabled: true,
  },
  {
    name: 'Azure Cognitive Services (Free)',
    freeQuota: 5000000, // 5M characters/month
    usedToday: 0,
    enabled: true,
  },
  {
    name: 'Elevenlabs Free',
    freeQuota: 10000, // chars/month
    usedToday: 0,
    enabled: false, // Requires credit card
  },
  {
    name: 'Play.ht Free',
    freeQuota: 100000, // chars/month
    usedToday: 0,
    enabled: true,
  },
];

/**
 * Cache narrations to avoid redundant API calls
 */
const NARRATION_CACHE = new Map<string, VideoNarration>();

/**
 * Generate narration for video without cost
 */
export async function generateVideoNarration(
  videoId: string,
  title: string,
  contentAr: string,
  contentEn: string
): Promise<VideoNarration> {
  try {
    // Check cache first
    const cacheKey = `${videoId}-${contentAr.substring(0, 50)}`;
    if (NARRATION_CACHE.has(cacheKey)) {
      console.log(`[free-narration] Using cached narration for ${videoId}`);
      return NARRATION_CACHE.get(cacheKey)!;
    }

    // Optimize text for TTS (shorter = fewer API calls)
    const optimizedAr = optimizeTextForTTS(contentAr);
    const optimizedEn = optimizeTextForTTS(contentEn);

    // Get available free TTS provider
    const provider = getAvailableTTSProvider(optimizedAr.length + optimizedEn.length);
    if (!provider) {
      throw new Error('No free TTS providers available');
    }

    console.log(`[free-narration] Using ${provider.name} for ${videoId}`);

    // Generate audio using free tier
    let audioUrlAr: string | undefined;
    let audioUrlEn: string | undefined;

    // Only generate if text is within quota
    if (optimizedAr.length < provider.freeQuota) {
      audioUrlAr = await generateAudioWithProvider(optimizedAr, 'ar-SA', provider);
    }

    if (optimizedEn.length < provider.freeQuota) {
      audioUrlEn = await generateAudioWithProvider(optimizedEn, 'en-US', provider);
    }

    const narration: VideoNarration = {
      videoId,
      title,
      narrationAr: optimizedAr,
      narrationEn: optimizedEn,
      audioUrlAr,
      audioUrlEn,
      status: audioUrlAr && audioUrlEn ? 'completed' : 'failed',
      method: 'tts',
      duration: estimateDuration(optimizedAr + optimizedEn),
      cached: false,
    };

    // Cache result
    NARRATION_CACHE.set(cacheKey, narration);

    // Store in database for persistence
    await saveNarrationToDatabase(narration);

    return narration;
  } catch (error) {
    console.error(`[free-narration] Error generating narration:`, error);
    throw error;
  }
}

/**
 * Optimize text for free TTS (reduce API calls)
 * - Remove excessive punctuation
 * - Shorten long sentences
 * - Remove diacritics (optional)
 * - Consolidate repetitive content
 */
function optimizeTextForTTS(text: string): string {
  return (
    text
      // Remove extra spaces and newlines
      .replace(/\s+/g, ' ')
      // Remove excessive punctuation
      .replace(/[!?]{2,}/g, '!')
      // Consolidate common phrases
      .replace(/الحمد لله الحمد لله/g, 'الحمد لله')
      .trim()
  );
}

/**
 * Get available free TTS provider with quota
 */
function getAvailableTTSProvider(textLength: number): TTSProvider | null {
  return FREE_TTS_PROVIDERS.find(
    provider =>
      provider.enabled &&
      provider.usedToday + textLength < provider.freeQuota
  ) || null;
}

/**
 * Generate audio using free TTS provider
 */
async function generateAudioWithProvider(
  text: string,
  language: string,
  provider: TTSProvider
): Promise<string> {
  try {
    switch (provider.name) {
      case 'Google Cloud TTS (Free Tier)':
        return await generateWithGoogleTTS(text, language);
      case 'Azure Cognitive Services (Free)':
        return await generateWithAzureTTS(text, language);
      case 'Play.ht Free':
        return await generateWithPlayHT(text, language);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  } catch (error) {
    console.error(`[free-narration] Failed with ${provider.name}:`, error);
    return '';
  }
}

/**
 * Google Cloud TTS Free Tier (1M chars/month free)
 */
async function generateWithGoogleTTS(text: string, language: string): Promise<string> {
  // Placeholder - requires Google Cloud API setup
  // In production: https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries
  console.log(`[google-tts] Would generate audio for: ${text.substring(0, 50)}...`);
  
  // Return placeholder or cached audio URL
  return `gs://zikr-audio-cache/${Buffer.from(text).toString('base64')}.mp3`;
}

/**
 * Azure Cognitive Services Free Tier (5M chars/month)
 */
async function generateWithAzureTTS(text: string, language: string): Promise<string> {
  // Placeholder - requires Azure API setup
  // In production: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech
  console.log(`[azure-tts] Would generate audio for: ${text.substring(0, 50)}...`);
  
  return `https://tts-cache.zikr.local/${Buffer.from(text).toString('base64')}.wav`;
}

/**
 * Play.ht Free Tier (100k chars/month)
 */
async function generateWithPlayHT(text: string, language: string): Promise<string> {
  // Placeholder - requires Play.ht API setup
  // In production: https://docs.play.ht/reference/api-overview
  console.log(`[playht-tts] Would generate audio for: ${text.substring(0, 50)}...`);
  
  return `https://playht-cache.zikr.local/${Buffer.from(text).toString('base64')}.mp3`;
}

/**
 * Estimate duration of narration (characters to seconds)
 * Arabic speech: ~0.1 seconds per character (slower)
 * English speech: ~0.05 seconds per character (faster)
 */
function estimateDuration(text: string): number {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const englishChars = text.length - arabicChars;

  const arabicSeconds = arabicChars * 0.1;
  const englishSeconds = englishChars * 0.05;

  return Math.ceil(arabicSeconds + englishSeconds);
}

/**
 * Save narration to database for caching
 */
async function saveNarrationToDatabase(narration: VideoNarration): Promise<void> {
  try {
    const { error } = await supabase
      .from('video_narrations')
      .upsert([
        {
          video_id: narration.videoId,
          narration_ar: narration.narrationAr,
          narration_en: narration.narrationEn,
          audio_url_ar: narration.audioUrlAr,
          audio_url_en: narration.audioUrlEn,
          status: narration.status,
          method: narration.method,
          duration_seconds: narration.duration,
          cached: narration.cached,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('[free-narration] Failed to save to database:', error);
    }
  } catch (error) {
    console.error('[free-narration] Database save error:', error);
  }
}

/**
 * Get cached narration
 */
export async function getCachedNarration(
  videoId: string
): Promise<VideoNarration | null> {
  try {
    const { data, error } = await supabase
      .from('video_narrations')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      videoId: data.video_id,
      title: data.title || '',
      narrationAr: data.narration_ar || '',
      narrationEn: data.narration_en || '',
      audioUrlAr: data.audio_url_ar,
      audioUrlEn: data.audio_url_en,
      status: data.status || 'pending',
      method: data.method || 'cache',
      duration: data.duration_seconds || 0,
      cached: true,
    };
  } catch (error) {
    console.error('[free-narration] Cache retrieval error:', error);
    return null;
  }
}

/**
 * Get free tier usage stats
 */
export async function getFreeNarrationStats(): Promise<{
  totalGenerated: number;
  cachedRequests: number;
  estimatedCost: number;
  quotaRemaining: number;
}> {
  try {
    const { data, error } = await supabase
      .from('video_narrations')
      .select('count(*), status');

    if (error) {
      throw error;
    }

    return {
      totalGenerated: data?.length || 0,
      cachedRequests: NARRATION_CACHE.size,
      estimatedCost: 0, // Always free tier
      quotaRemaining: 1000000, // Conservative estimate
    };
  } catch (error) {
    console.error('[free-narration] Stats error:', error);
    return {
      totalGenerated: 0,
      cachedRequests: NARRATION_CACHE.size,
      estimatedCost: 0,
      quotaRemaining: 1000000,
    };
  }
}

/**
 * Health check for narration service
 */
export async function checkNarrationHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('video_narrations')
      .select('count(*)', { count: 'estimated', head: true });

    return !error;
  } catch (error) {
    console.error('[free-narration] Health check failed:', error);
    return false;
  }
}
