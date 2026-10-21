import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';
import { hasCompleteVideoApprovalChecklist, REQUIRED_VIDEO_APPROVAL_CHECKS } from '@/features/videos/services/video-publish-approval';

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
  const auth = await requireAdminApi('video.delete');
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
  const auth = await requireAdminApi('video.manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

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
        id: string; status: string; category: string; video_url: string | null; content: unknown; updated_at: string;
      }>>('/rest/v1/video_generation_requests?id=eq.' + encodeURIComponent(id) + '&select=id,status,category,video_url,content,updated_at&limit=1');
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
      const reviewedAt = new Date().toISOString();
      const updatedContent = { ...currentContent, approvalStatus: 'approved', approvalReviewedAt: reviewedAt,
        qualityReview: { ...Object.fromEntries(REQUIRED_VIDEO_APPROVAL_CHECKS.map((key) => [key, true])), reviewedAt } };
      const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
        '/rest/v1/video_generation_requests?id=eq.' + encodeURIComponent(id) + '&status=eq.completed&updated_at=eq.' + encodeURIComponent(current.updated_at),
        { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({ content: updatedContent, updated_at: reviewedAt }) },
      );
      if (!updated?.length) return NextResponse.json({ error: 'تغيرت حالة العملية أثناء المراجعة؛ حدّث التفاصيل ثم أعد الفحص.' }, { status: 409 });
      return NextResponse.json({ ok: true, approvalStatus: 'approved',
        note: 'سيتولى عامل GitHub Actions المجدول مزامنة طابور النشر؛ لم تتم إضافة مجدول جديد.' });
    }

    if (action === 'retry_publish') {
      const rows = await supabaseServerAdminRequest<Array<{
        id: string;
        status: string;
        heygen_video_id: string | null;
        youtube_id: string | null;
        facebook_id: string | null;
        video_url: string | null;
        updated_at: string;
      }>>(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&select=id,status,heygen_video_id,youtube_id,facebook_id,video_url,updated_at&limit=1`);
      const current = rows?.[0];
      if (!current) return NextResponse.json({ error: 'عملية الفيديو غير موجودة.' }, { status: 404 });
      if (!current.heygen_video_id && !current.video_url) {
        return NextResponse.json({ error: 'لا توجد مهمة توليد مكتملة يمكن إعادة نشرها.' }, { status: 409 });
      }

      await supabaseServerAdminRequest(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&status=eq.${encodeURIComponent(current.status)}&updated_at=eq.${encodeURIComponent(current.updated_at)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'processing',
          error_message: null,
          error_details: null,
          updated_at: new Date().toISOString(),
        }),
      });
      return NextResponse.json({ ok: true, mode: 'retry_publish', preserved: { youtube: Boolean(current.youtube_id), facebook: Boolean(current.facebook_id) } });
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
