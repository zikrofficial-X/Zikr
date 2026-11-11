import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { requireAdminStepUpApi } from '@/features/admin/services/security';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';
import { buildVideoApprovalSnapshotHash, hasCompleteVideoApprovalChecklist, REQUIRED_VIDEO_APPROVAL_CHECKS } from '@/features/videos/services/video-publish-approval';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set(['pending', 'processing', 'completed', 'failed']);

function idsFromBody(body: unknown): string[] {
  if (!body || typeof body !== 'object') return [];
  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0))];
}

export async function GET() {
  const auth = await requireAdminApi('video.manage');
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
  const auth = await requireAdminStepUpApi('video.delete', '/admin/video/requests');
  if (!auth.ok) return NextResponse.json({ error: auth.error, nextPath: 'nextPath' in auth ? auth.nextPath : undefined }, { status: auth.status, headers: { 'Cache-Control': 'no-store' } });

  try {
    const body = await request.json().catch(() => ({}));
    const ids = idsFromBody(body);
    const deleteFailed =
      body !== null &&
      typeof body === "object" &&
      (body as { deleteFailed?: unknown }).deleteFailed === true;

    if (!ids.length && !deleteFailed) {
      return NextResponse.json({ error: 'حدد عمليات للحذف أو استخدم deleteFailed.' }, { status: 400 });
    }

    const filter = deleteFailed
      ? "status=eq.failed"
      : `id=in.(${ids.map(encodeURIComponent).join(",")})&status=eq.failed`;
    const deleted = await supabaseServerAdminRequest<Array<{ id: string }>>(
      `/rest/v1/video_generation_requests?${filter}&select=id`,
      { method: 'DELETE', headers: { Prefer: 'return=representation' } },
    );
    if (!deleted.length) {
      return NextResponse.json({ ok: true, affected: 0 });
    }
    await recordAdminAuditEvent({
      action: "video_generation.delete_failed",
      permission: "video.delete",
      resourceType: "video_generation_requests",
      metadata: { requestedIds: ids.length, deleteFailed, affected: deleted.length },
    });
    return NextResponse.json({ ok: true, affected: deleted.length });
  } catch (error) {
    console.error('[api/admin/video-generation] DELETE:', error);
    return NextResponse.json({ error: 'تعذر حذف عمليات توليد الفيديو الفاشلة.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminStepUpApi('video.manage', '/admin/video/requests');
  if (!auth.ok) return NextResponse.json({ error: auth.error, nextPath: 'nextPath' in auth ? auth.nextPath : undefined }, { status: auth.status, headers: { 'Cache-Control': 'no-store' } });

  try {
    const body = await request.json() as {
      id?: unknown;
      status?: unknown;
      errorMessage?: unknown;
      action?: unknown;
      qaChecklist?: unknown;
    };
    const id = typeof body.id === 'string' ? body.id : '';
    const status = typeof body.status === 'string' ? body.status : '';
    const action = typeof body.action === 'string' ? body.action : '';
    if (!id) return NextResponse.json({ error: 'معرّف العملية مطلوب.' }, { status: 400 });

    // Publish retry preserves the generated provider job and any successful
    // platform IDs so only missing publication work is attempted again.
    if (action === 'approve_publish') {
      if (!hasCompleteVideoApprovalChecklist(body.qaChecklist)) {
        return NextResponse.json({ error: 'لا يمكن الاعتماد قبل إتمام فحوص المصدر والصوت والصورة والترجمة والحقوق.' }, { status: 400 });
      }
      const rows = await supabaseServerAdminRequest<Array<{
        id: string; status: string; category: string; video_url: string | null; source_hash: string | null; content_hash: string | null; template_version: string | null; content: unknown; updated_at: string;
      }>>('/rest/v1/video_generation_requests?id=eq.' + encodeURIComponent(id) + '&select=id,status,category,video_url,source_hash,content_hash,template_version,content,updated_at&limit=1');
      const current = rows?.[0];
      if (!current) return NextResponse.json({ error: 'عملية الفيديو غير موجودة.' }, { status: 404 });
      if (current.status !== 'completed' || !current.video_url) {
        return NextResponse.json({ error: 'يجب أن يكتمل توليد ملف الفيديو قبل اعتماده للنشر.' }, { status: 409 });
      }
      const currentContent = current.content && typeof current.content === 'object' && !Array.isArray(current.content)
        ? current.content as Record<string, unknown> : {};
      if (new Set(['quran', 'hadith', 'story', 'dua', 'adhkar']).has(current.category)) {
        const sourceUrl = typeof currentContent.sourceUrl === 'string' ? currentContent.sourceUrl : '';
        const sourceLabel = typeof currentContent.sourceLabel === 'string' ? currentContent.sourceLabel.trim() : '';
        const sourceText = typeof currentContent.textAr === 'string' ? currentContent.textAr.trim()
          : typeof currentContent.text === 'string' ? currentContent.text.trim() : '';
        let validSourceUrl = false;
        try { validSourceUrl = new URL(sourceUrl).protocol === 'https:'; } catch { validSourceUrl = false; }
        if (!validSourceUrl || !sourceLabel || !sourceText) {
          return NextResponse.json({ error: 'المصدر أو نصه أو مرجعه غير مكتمل؛ لا يمكن اعتماد فيديو ديني بلا مصدر موثق.' }, { status: 422 });
        }
      }
      const approvalSnapshotHash = buildVideoApprovalSnapshotHash({
        category: current.category,
        sourceHash: current.source_hash,
        contentHash: current.content_hash,
        templateVersion: current.template_version,
        videoUrl: current.video_url,
      });
      if (!approvalSnapshotHash) {
        return NextResponse.json({ error: 'بصمة المصدر أو المحتوى أو ملف الفيديو غير مكتملة؛ أعد تجهيز الفيديو قبل اعتماده.' }, { status: 422 });
      }
      const reviewedAt = new Date().toISOString();
      const updatedContent = {
        ...currentContent,
        approvalStatus: 'approved',
        approvalReviewerId: auth.profile.id,
        approvalReviewedAt: reviewedAt,
        approvalSnapshotHash,
        qualityReview: { ...Object.fromEntries(REQUIRED_VIDEO_APPROVAL_CHECKS.map((key) => [key, true])), reviewedAt },
      };
      const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
        '/rest/v1/video_generation_requests?id=eq.' + encodeURIComponent(id) + '&status=eq.completed&updated_at=eq.' + encodeURIComponent(current.updated_at),
        { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({ content: updatedContent, updated_at: reviewedAt }) },
      );
      if (!updated?.length) return NextResponse.json({ error: 'تغيرت حالة العملية أثناء المراجعة؛ حدّث التفاصيل ثم أعد الفحص.' }, { status: 409 });
      await recordAdminAuditEvent({
        action: "video_generation.publish.approve",
        permission: "video.manage",
        resourceType: "video_generation_requests",
        resourceId: id,
        metadata: { category: current.category, approvalChecks: REQUIRED_VIDEO_APPROVAL_CHECKS.length, approvalSnapshotHash },
      });
      return NextResponse.json({ ok: true, approvalStatus: 'approved',
        note: 'تم اعتماد جودة الفيديو لمكتبة ZIKR الداخلية فقط؛ لا يتم نشره على منصات خارجية.' });
    }

    if (action === "retry_publish") {
      return NextResponse.json(
        {
          ok: false,
          code: "EXTERNAL_VIDEO_PUBLISHING_RETIRED",
          error: "إعادة النشر على المنصات الخارجية متوقفة. إعادة توليد الفيديو الداخلي متاحة من طابور ZIKR.",
        },
        { status: 410, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
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
      patch.youtube_id = null;
      patch.facebook_id = null;
      patch.video_url = null;
    }
    if (typeof body.errorMessage === 'string') patch.error_message = body.errorMessage.slice(0, 1000);

    const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
    if (!updated.length) return NextResponse.json({ error: 'عملية الفيديو غير موجودة.' }, { status: 404 });
    await recordAdminAuditEvent({
      action: "video_generation.status.update",
      permission: "video.manage",
      resourceType: "video_generation_requests",
      resourceId: id,
      metadata: { status, changedFields: Object.keys(patch) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/video-generation] PATCH:', error);
    return NextResponse.json({ error: 'تعذر تحديث العملية.' }, { status: 500 });
  }
}
