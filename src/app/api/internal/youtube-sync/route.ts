import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { requireAdminApi } from '@/features/admin/services/admin';
import { syncYoutubeFeed } from '@/features/videos/integrations/youtube';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const env = getServerEnv();
    const internalSecret = request.headers.get('x-internal-job-secret');
    const configuredSecret = process.env.YOUTUBE_SYNC_SECRET ?? '';

    let authorized = false;
    if (configuredSecret && internalSecret === configuredSecret) authorized = true;
    if (!authorized) {
      const admin = await requireAdminApi();
      if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
      authorized = true;
    }

    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!env.YOUTUBE_API_KEY || !env.YOUTUBE_CHANNEL_ID) {
      return NextResponse.json({ error: 'YouTube is not configured.' }, { status: 503 });
    }

    const result = await syncYoutubeFeed(24);
    return NextResponse.json({
      ok: true,
      configured: result.configured,
      channelId: result.channelId,
      videos: result.videos.length,
      playlists: result.playlists.length,
      stale: result.stale ?? false,
      errorCode: result.errorCode ?? null,
      error: result.error ?? null,
    });
  } catch (error) {
    console.error('[youtube-sync] POST failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'YouTube synchronization failed.' },
      { status: 500 }
    );
  }
}