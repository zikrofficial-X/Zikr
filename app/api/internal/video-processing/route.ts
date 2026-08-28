import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  claimPendingVideoRequests,
  getSubmittedVideoRequests,
  processVideoGenerationRequest,
} from '@/lib/services/video-automation';
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
 * Durable video queue entrypoint. Supabase pg_cron invokes this endpoint every
 * minute using the same scheduler secret as the push worker. Submitted HeyGen
 * jobs are polled before new pending rows are claimed, preventing duplicate
 * provider submissions while allowing jobs to outlive a single request.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submitted = await getSubmittedVideoRequests(VIDEO_BATCH_SIZE);
    const claimed = await claimPendingVideoRequests(VIDEO_BATCH_SIZE);
    const requests = [...submitted, ...claimed];
    const socialItems = await claimPendingSocialPublishItems(SOCIAL_BATCH_SIZE);
    let succeeded = 0;
    let failed = 0;

    for (const videoRequest of requests) {
      const ok = await processVideoGenerationRequest(videoRequest, { alreadyClaimed: true });
      if (ok) succeeded += 1;
      else failed += 1;
    }

    let socialSucceeded = 0;
    let socialFailed = 0;
    for (const item of socialItems) {
      const ok = await processSocialPublishItem(item, { alreadyClaimed: true });
      if (ok) socialSucceeded += 1;
      else socialFailed += 1;
    }

    return NextResponse.json({
      ok: true,
      processed: requests.length,
      succeeded,
      failed,
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
