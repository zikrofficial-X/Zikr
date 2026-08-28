import { getPublicEnv, getServerEnv } from '@/lib/env';
import { assertSupabaseConnection } from '@/lib/supabase/server';
import { generateGeminiText } from '@/lib/services/gemini-client';
import { getYoutubeSyncHealth } from '@/lib/services/youtube';

export type ApiHealthStatus = 'ok' | 'warning' | 'error';

export type ApiHealthCheck = {
  name: string;
  status: ApiHealthStatus;
  message: string;
};

async function timed(name: string, check: () => Promise<ApiHealthCheck>): Promise<ApiHealthCheck> {
  try {
    return await check();
  } catch (error) {
    return { name, status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function runApiHealthChecks(): Promise<ApiHealthCheck[]> {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();

  return Promise.all([
    timed('Supabase Auth/REST', async () => {
      await assertSupabaseConnection();
      return { name: 'Supabase Auth/REST', status: 'ok', message: 'Supabase URL and anon key responded successfully.' };
    }),
    timed('Gemini Quran/Voice AI', async () => {
      if (!serverEnv.GEMINI_API_KEY) return { name: 'Gemini Quran/Voice AI', status: 'warning', message: 'GEMINI_API_KEY is not configured; AI falls back to static responses.' };
      const text = await generateGeminiText('Return the single Arabic word: جاهز');
      return { name: 'Gemini Quran/Voice AI', status: text ? 'ok' : 'warning', message: text ? 'Gemini responded successfully.' : 'Gemini key exists but no text was returned.' };
    }),
    timed('YouTube channel API', async () => {
      const health = await getYoutubeSyncHealth();
      if (!health.configured) {
        return { name: 'YouTube channel API', status: 'warning', message: 'YouTube is not configured.' };
      }
      if (health.status === 'ok') {
        const suffix = health.lastSuccessAt ? ` Last successful sync: ${health.lastSuccessAt}.` : '';
        return { name: 'YouTube channel API', status: 'ok', message: `Cached YouTube feed is healthy.${suffix}` };
      }
      if (health.status === 'quota_exceeded') {
        return {
          name: 'YouTube channel API',
          status: 'warning',
          message: 'YouTube API quota is temporarily exhausted. Cached channel content remains available; no live quota-consuming check is performed here.',
        };
      }
      if (health.status === 'error') {
        return {
          name: 'YouTube channel API',
          status: 'warning',
          message: health.lastError ?? 'Last YouTube synchronization failed; cached content remains available when present.',
        };
      }
      return {
        name: 'YouTube channel API',
        status: 'warning',
        message: 'YouTube feed has not been synchronized yet. Run the controlled sync job once configuration is ready.',
      };
    }),
    timed('Public site URL', async () => ({
      name: 'Public site URL',
      status: publicEnv.NEXT_PUBLIC_SITE_URL ? 'ok' : 'error',
      message: publicEnv.NEXT_PUBLIC_SITE_URL ? `Configured: ${publicEnv.NEXT_PUBLIC_SITE_URL}` : 'NEXT_PUBLIC_SITE_URL is missing.',
    })),
    timed('Quran/Hadith external APIs', async () => ({
      name: 'Quran/Hadith external APIs',
      status: serverEnv.QURAN_API_BASE_URL || serverEnv.HADITH_API_BASE_URL ? 'ok' : 'warning',
      message: serverEnv.QURAN_API_BASE_URL || serverEnv.HADITH_API_BASE_URL
        ? 'At least one external Quran/Hadith API base URL is configured.'
        : 'No external Quran/Hadith base URL is configured; local/imported database content will be used.',
    })),
  ]);
}