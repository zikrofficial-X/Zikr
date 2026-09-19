import { getServerEnv } from '@/lib/env';

export type NativeSocialSyncConfig = {
  youtubeChannelId: string;
  facebookPageId: string;
  facebookPageAccessToken: string;
  graphApiVersion: string;
};

/**
 * Phase 1 contract for the native publisher.
 * This module deliberately does not call Supabase or Facebook yet; those
 * runtime changes belong to phase 2/3. It centralizes validation and makes
 * the native-only invariant explicit for callers.
 */
export function getNativeSocialSyncConfig(): NativeSocialSyncConfig {
  const env = getServerEnv();
  const youtubeChannelId = env.YOUTUBE_CHANNEL_ID.trim();
  const facebookPageId = env.FACEBOOK_PAGE_ID.trim();
  const facebookPageAccessToken = env.FACEBOOK_PAGE_ACCESS_TOKEN.trim();
  const graphApiVersion = env.FACEBOOK_GRAPH_API_VERSION.trim();

  if (!youtubeChannelId) throw new Error('YOUTUBE_CHANNEL_ID is required for native social sync.');
  if (!facebookPageId) throw new Error('FACEBOOK_PAGE_ID is required for native social sync.');
  if (!facebookPageAccessToken) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN is required for native social sync.');
  if (!/^v\d+\.\d+$/.test(graphApiVersion)) throw new Error('FACEBOOK_GRAPH_API_VERSION must look like vNN.N.');

  return { youtubeChannelId, facebookPageId, facebookPageAccessToken, graphApiVersion };
}

/** Native publishing must never downgrade to a YouTube link post. */
export function assertNativeMediaUrl(mediaUrl: string | null | undefined): string {
  const value = (mediaUrl || '').trim();
  if (!value) throw new Error('A real video media URL is required for native Facebook publishing.');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Native video media URL must be an absolute URL.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Native video media URL must use HTTPS.');
  }

  if (/youtube\.com|youtu\.be/i.test(url.hostname)) {
    throw new Error('YouTube watch URLs are not valid native media sources.');
  }

  return url.toString();
}
