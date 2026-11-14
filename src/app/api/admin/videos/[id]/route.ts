import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { requireAdminStepUpApi } from '@/features/admin/services/security';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
import { runPostCommitAudit } from '@/features/admin/services/post-commit-audit';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';
import type { VideoGenerationRequest } from '@/lib/types/video';
import { updateVideoRequestStatus } from '@/features/videos/services/video-automation';

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
    const auth = await requireAdminStepUpApi('video.manage', '/admin/video/requests');
    if (!auth.ok) return NextResponse.json({ error: auth.error, nextPath: 'nextPath' in auth ? auth.nextPath : undefined }, { status: auth.status, headers: { 'Cache-Control': 'no-store' } });
    const { id } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    if (body.status !== 'pending') {
      return NextResponse.json(
        { error: 'تغيير حالة العملية يتم بواسطة عامل الطابور؛ إعادة المحاولة متاحة للعمليات الفاشلة فقط.' },
        { status: 410, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const currentRows = await supabaseServerAdminRequest<Array<{ status: string }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&select=status&limit=1`,
    );
    if (!currentRows?.[0]) return NextResponse.json({ error: 'Video request not found' }, { status: 404 });
    if (currentRows[0].status !== 'failed') {
      return NextResponse.json({ error: 'يمكن إعادة تعيين عمليات التوليد الفاشلة فقط.' }, { status: 409 });
    }

    const updated = await updateVideoRequestStatus(id, 'pending', undefined, 'failed');
    if (!updated) {
      return NextResponse.json(
        { error: 'تم تغيير حالة العملية أثناء إعادة المحاولة؛ حدّث الصفحة ثم أعد المحاولة.' },
        { status: 409 },
      );
    }
    const auditRecorded = await runPostCommitAudit(
      () => recordAdminAuditEvent({
      action: 'video_generation.update',
      permission: 'video.manage',
      resourceType: 'video_generation_requests',
      resourceId: id,
      metadata: { status: 'pending', changedFields: ['status', 'approvalStatus', 'error_message', 'error_details', 'heygen_video_id', 'heygen_status', 'heygen_submitted_at', 'heygen_last_polled_at', 'youtube_id', 'facebook_id', 'video_url'] },
      }),
      (auditError) => console.error("[api/admin/videos/[id]] audit event failed after committed mutation:", auditError),
    );
    return NextResponse.json({ ok: true, auditRecorded });
  } catch (error) {
    console.error('[api/admin/videos/[id]] PATCH:', error);
    return NextResponse.json({ error: 'تعذر تحديث العملية.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminStepUpApi('video.delete', '/admin/video/requests');
    if (!auth.ok) return NextResponse.json({ error: auth.error, nextPath: 'nextPath' in auth ? auth.nextPath : undefined }, { status: auth.status, headers: { 'Cache-Control': 'no-store' } });
    const { id } = await context.params;

    const rows = await supabaseServerAdminRequest<Array<{ status: string }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&select=status&limit=1`,
    );
    if (!rows?.[0]) return NextResponse.json({ error: 'Video request not found' }, { status: 404 });
    if (rows[0].status !== 'failed') {
      return NextResponse.json({ error: 'يمكن حذف عمليات التوليد الفاشلة فقط.' }, { status: 409 });
    }

    const deleted = await supabaseServerAdminRequest<Array<{ id: string }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&status=eq.failed`,
      { method: 'DELETE', headers: { Prefer: 'return=representation' } },
    );
    if (!deleted.length) {
      return NextResponse.json(
        { error: 'تم تغيير حالة العملية؛ حدّث الصفحة ثم أعد المحاولة.' },
        { status: 409 },
      );
    }
    const auditRecorded = await runPostCommitAudit(
      () => recordAdminAuditEvent({
      action: 'video_generation.delete_failed',
      permission: 'video.delete',
      resourceType: 'video_generation_requests',
      resourceId: id,
      }),
      (auditError) => console.error("[api/admin/videos/[id]] audit event failed after committed mutation:", auditError),
    );
    return NextResponse.json({ ok: true, auditRecorded });
  } catch (error) {
    console.error('[api/admin/videos/[id]] DELETE:', error);
    return NextResponse.json({ error: 'تعذر حذف العملية الفاشلة.' }, { status: 500 });
  }
}
