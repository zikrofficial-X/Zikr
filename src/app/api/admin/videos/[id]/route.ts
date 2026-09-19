import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';
import type { VideoGenerationRequest } from '@/lib/types/video';

const allowedStatuses = new Set(['pending', 'processing', 'completed', 'failed']);

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi('video.manage');
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await context.params;
    const result = await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&limit=1`,
    );
    const item = result?.[0];
    if (!item) return NextResponse.json({ error: 'Video request not found' }, { status: 404 });
    return NextResponse.json(item, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/videos/[id]] GET:', error);
    return NextResponse.json({ error: 'تعذر تحميل تفاصيل العملية.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi('video.manage');
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const status = typeof body.status === 'string' ? body.status : '';
    if (!allowedStatuses.has(status)) return NextResponse.json({ error: 'حالة غير صالحة.' }, { status: 400 });

    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (typeof body.youtubeId === 'string') patch.youtube_id = body.youtubeId;
    if (typeof body.facebookId === 'string') patch.facebook_id = body.facebookId;
    if (typeof body.errorMessage === 'string') patch.error_message = body.errorMessage.slice(0, 1000);
    if (typeof body.errorDetails === 'string') patch.error_details = body.errorDetails.slice(0, 4000);
    if (status === 'pending') {
      Object.assign(patch, {
        error_message: null,
        error_details: null,
        heygen_video_id: null,
        heygen_status: null,
        heygen_submitted_at: null,
        heygen_last_polled_at: null,
      });
    }

    const updated = await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(patch),
      },
    );
    if (!updated?.length) return NextResponse.json({ error: 'Video request not found' }, { status: 404 });
    return NextResponse.json({ ok: true, item: updated[0] });
  } catch (error) {
    console.error('[api/admin/videos/[id]] PATCH:', error);
    return NextResponse.json({ error: 'تعذر تحديث العملية.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi('video.delete');
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await context.params;

    const rows = await supabaseServerAdminRequest<Array<{ status: string }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&select=status&limit=1`,
    );
    if (!rows?.[0]) return NextResponse.json({ error: 'Video request not found' }, { status: 404 });
    if (rows[0].status !== 'failed') {
      return NextResponse.json({ error: 'يمكن حذف عمليات التوليد الفاشلة فقط.' }, { status: 409 });
    }

    await supabaseServerAdminRequest(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&status=eq.failed`,
      { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/videos/[id]] DELETE:', error);
    return NextResponse.json({ error: 'تعذر حذف العملية الفاشلة.' }, { status: 500 });
  }
}
