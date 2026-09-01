import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set(['pending', 'processing', 'completed', 'failed']);

function idsFromBody(body: unknown): string[] {
  if (!body || typeof body !== 'object') return [];
  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0))];
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await supabaseServerAdminRequest<Array<{
      id: string;
      title: string;
      description: string | null;
      category: string;
      status: string;
      youtube_id: string | null;
      facebook_id: string | null;
      video_url: string | null;
      heygen_video_id: string | null;
      heygen_status: string | null;
      error_message: string | null;
      error_details: string | null;
      created_at: string;
      updated_at: string;
    }>>('/rest/v1/video_generation_requests?order=created_at.desc&limit=500');

    const items = rows ?? [];
    const counts = { total: items.length, pending: 0, processing: 0, completed: 0, failed: 0 };
    for (const row of items) {
      if (row.status in counts) counts[row.status as keyof typeof counts] += 1;
    }
    return NextResponse.json({ items, counts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/video-generation] GET:', error);
    return NextResponse.json({ error: 'تعذر تحميل عمليات توليد الفيديو.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json().catch(() => ({}));
    const ids = idsFromBody(body);
    const deleteFailed = Boolean((body as { deleteFailed?: unknown })?.deleteFailed);

    if (!ids.length && !deleteFailed) {
      return NextResponse.json({ error: 'حدد عمليات للحذف أو استخدم deleteFailed.' }, { status: 400 });
    }

    if (ids.length) {
      const filter = ids.map(encodeURIComponent).join(',');
      await supabaseServerAdminRequest(
        `/rest/v1/video_generation_requests?id=in.(${filter})&status=eq.failed`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
      );
    }

    if (deleteFailed) {
      await supabaseServerAdminRequest(
        '/rest/v1/video_generation_requests?status=eq.failed',
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/video-generation] DELETE:', error);
    return NextResponse.json({ error: 'تعذر حذف عمليات توليد الفيديو الفاشلة.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json() as { id?: unknown; status?: unknown; errorMessage?: unknown };
    const id = typeof body.id === 'string' ? body.id : '';
    const status = typeof body.status === 'string' ? body.status : '';
    if (!id || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'معرّف أو حالة غير صالحة.' }, { status: 400 });
    }
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'pending') {
      patch.error_message = null;
      patch.error_details = null;
      patch.heygen_status = null;
      patch.heygen_video_id = null;
      patch.heygen_submitted_at = null;
      patch.heygen_last_polled_at = null;
    }
    if (typeof body.errorMessage === 'string') patch.error_message = body.errorMessage.slice(0, 1000);

    await supabaseServerAdminRequest(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/video-generation] PATCH:', error);
    return NextResponse.json({ error: 'تعذر تحديث العملية.' }, { status: 500 });
  }
}
