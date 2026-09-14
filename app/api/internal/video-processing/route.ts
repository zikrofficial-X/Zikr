import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  processTemplateVideoQueue,
  seedAutomatedVideoRequests,
} from '@/scripts/jobs/template-video-automation';
import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
} from '@/lib/services/social-publishing';

export const dynamic = 'force-dynamic';

const VIDEO_BATCH_SIZE = 3;
const SOCIAL_BATCH_SIZE = 10;

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!supplied) return false;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('get_push_scheduler_secret');
  return !error && typeof data === 'string' && data.length > 0 && supplied === data;
}

/**
 * Durable production queue entrypoint. Supabase pg_cron invokes this endpoint
 * every minute using the scheduler secret. Production video generation is
 * intentionally locked to the free FFmpeg renderer; HeyGen is not part of
 * this execution path.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queued = await seedAutomatedVideoRequests();
    const videos = await processTemplateVideoQueue(VIDEO_BATCH_SIZE);
    const socialItems = await claimPendingSocialPublishItems(SOCIAL_BATCH_SIZE);

    let socialSucceeded = 0;
    let socialFailed = 0;
    for (const item of socialItems) {
      const ok = await processSocialPublishItem(item, { alreadyClaimed: true });
      if (ok) socialSucceeded += 1;
      else socialFailed += 1;
    }

    return NextResponse.json({
      ok: videos.failed === 0 && socialFailed === 0,
      generator: 'template',
      queued,
      processed: videos.processed,
      succeeded: videos.succeeded,
      failed: videos.failed,
      socialProcessed: socialItems.length,
      socialSucceeded,
      socialFailed,
    });
  } catch (error) {
    console.error('[api/internal/video-processing] failed:', error);
    return NextResponse.json({ error: 'Video processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
