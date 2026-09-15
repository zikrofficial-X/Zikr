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
 * Compatibility endpoint for the legacy Supabase cron entrypoint.
 * Production rendering and social publishing are owned exclusively by the
 * GitHub Actions background worker, which has FFmpeg and the canonical
 * Actions/Repository secrets. Vercel must never render or publish videos.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    mode: 'compatibility-noop',
    worker: 'github-actions',
    deprecated: true,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: 'compatibility-noop',
    worker: 'github-actions',
    deprecated: true,
  });
}
