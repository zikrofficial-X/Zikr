import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { consumeKidsShareRateLimit } from '@/features/kids/services/share-rate-limit';
import { getTrustedClientAddress } from '@/features/kids/services/client-address';

const VALID_PLATFORMS = new Set([
  'facebook',
  'whatsapp',
  'twitter',
  'copy-link',
]);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
type ShareRequest = {
  slug?: unknown;
  platform?: unknown;
  action?: unknown;
};

function getClientAddress(request: NextRequest): string {
  return getTrustedClientAddress(
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for'),
  );
}

export async function POST(request: NextRequest) {
  try {
    const allowed = await consumeKidsShareRateLimit(getClientAddress(request));
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many share events. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
      );
    }
  } catch (error) {
    console.error('[Kids Share Tracking Error] Rate limiter unavailable:', error);
    return NextResponse.json(
      { error: 'Share tracking is temporarily unavailable.' },
      { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
    );
  }

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
