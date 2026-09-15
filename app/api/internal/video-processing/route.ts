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
export const maxDuration = 60;

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!supplied) return false;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('get_push_scheduler_secret');
  return !error && typeof data === 'string' && data.length > 0 && supplied === data;
}

/**
 * Canonical lightweight scheduler entrypoint for Supabase pg_cron.
 *
 * The production scheduler already invokes this endpoint every minute. The
 * endpoint therefore owns one small, bounded queue slice per invocation so
 * video generation and social publishing continue even when GitHub-hosted
 * runners are unavailable. GitHub Actions remains a manual/back-up worker.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const seeded = await seedAutomatedVideoRequests();
    const videos = await processTemplateVideoQueue(1);

    const queuedSocial = await claimPendingSocialPublishItems(3);
    let socialSucceeded = 0;
    let socialFailed = 0;

    for (const item of queuedSocial) {
      try {
        const ok = await processSocialPublishItem(item, { alreadyClaimed: true });
        if (ok) socialSucceeded += 1;
        else socialFailed += 1;
      } catch (error) {
        socialFailed += 1;
        console.error(`[video-processing] Social item ${item.id} failed:`, error);
      }
    }

    return NextResponse.json({
      ok: true,
      mode: 'queue-processor',
      worker: 'vercel',
      seeded,
      videos,
      social: {
        claimed: queuedSocial.length,
        succeeded: socialSucceeded,
        failed: socialFailed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[video-processing] Queue run failed:', error);
    return NextResponse.json(
      { ok: false, mode: 'queue-processor', worker: 'vercel', error: message.slice(0, 500) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: 'queue-processor',
    worker: 'vercel',
  });
}
