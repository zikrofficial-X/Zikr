import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const VALID_PLATFORMS = new Set([
  'facebook',
  'whatsapp',
  'twitter',
  'copy-link',
]);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type ShareRequest = {
  slug?: unknown;
  platform?: unknown;
  action?: unknown;
};

function getClientAddress(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function isRateLimited(request: NextRequest, slug: string, platform: string): boolean {
  const now = Date.now();
  const key = `${getClientAddress(request)}:${slug}:${platform}`;
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (rateLimitBuckets.size > 2_000) {
      for (const [bucketKey, bucket] of rateLimitBuckets) {
        if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
      }
    }
    return false;
  }
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  current.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  let body: ShareRequest;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    body = parsed as ShareRequest;
  } catch {
    return NextResponse.json({ error: 'Malformed JSON request body' }, { status: 400 });
  }

  try {
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const platform = typeof body.platform === 'string' ? body.platform : '';
    const action = body.action === undefined ? 'share' : body.action;

    if (!slug || slug.length > 160 || !SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ error: 'Invalid content slug' }, { status: 400 });
    }
    if (!VALID_PLATFORMS.has(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }
    if (action !== 'share') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (isRateLimited(request, slug, platform)) {
      return NextResponse.json(
        { error: 'Too many share events. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('increment_kids_content_shares', {
      p_slug: slug,
    });

    if (error) {
      console.error('[Kids Share Tracking Error] RPC failed:', error);
      return NextResponse.json({ error: 'Failed to track share' }, { status: 500 });
    }

    const updated = Array.isArray(data) ? data[0] : data;
    if (!updated) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      platform,
      shares: updated.shares,
    });
  } catch (error) {
    console.error('[Kids Share Tracking Error] Request failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
