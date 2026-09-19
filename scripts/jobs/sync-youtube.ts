import { syncYoutubeFeed } from '../../src/features/videos/integrations/youtube';

async function main() {
  const result = await syncYoutubeFeed(24);
  if (!result.configured) {
    console.log('[youtube-sync] YouTube is not configured; nothing to do.');
    return;
  }
  console.log('[youtube-sync] Sync result:', JSON.stringify({
    videos: result.videos.length,
    playlists: result.playlists.length,
    stale: result.stale ?? false,
    errorCode: result.errorCode ?? null,
    error: result.error ?? null,
  }));
  if (result.errorCode && result.errorCode !== 'quota_exceeded') {
    throw new Error(result.error ?? 'YouTube sync failed.');
  }
}

main().catch((error) => {
  console.error('[youtube-sync] Run failed:', error);
  process.exit(1);
});