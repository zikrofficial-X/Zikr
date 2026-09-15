import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!supplied) return false;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('get_push_scheduler_secret');
  return !error && typeof data === 'string' && data.length > 0 && supplied === data;
}

/**
 * Compatibility endpoint for the historical Supabase scheduler.
 *
 * Video rendering and social publishing are intentionally NOT executed in
 * Vercel. The canonical worker is GitHub Actions, where FFmpeg and the full
 * background-job runtime are available. Keeping this endpoint lightweight
 * prevents the previous `spawn ffmpeg ENOENT` failure and prevents two queue
 * owners from racing each other.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    mode: 'compatibility-noop',
    worker: 'github-actions',
    message: 'Video and social background queues are processed by GitHub Actions.',
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: 'compatibility-noop',
    worker: 'github-actions',
  });
}
