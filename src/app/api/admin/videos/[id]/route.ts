import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { requireAdminStepUpApi } from '@/features/admin/services/security';
import { enforceAdminRateLimit } from '@/features/admin/services/rate-limit';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
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
    const auth = await requireAdminApi("video.manage");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    await enforceAdminRateLimit(auth.profile, "video.request.update", 30, 60);

    const { id } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "بيانات التحديث غير صالحة." }, { status: 400 });
    }
    const status = typeof body.status === "string" ? body.status : "";
    if (!allowedStatuses.has(status)) return NextResponse.json({ error: "حالة غير صالحة." }, { status: 400 });

    const currentRows = await supabaseServerAdminRequest<Array<{ id: string; status: string; updated_at: string | null }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&select=id,status,updated_at&limit=1`,
    );
    const current = currentRows?.[0];
    if (!current) return NextResponse.json({ error: "Video request not found" }, { status: 404 });
    const expectedUpdatedAt = typeof body.updatedAt === "string" ? body.updatedAt.trim() : current.updated_at;
    if (expectedUpdatedAt && current.updated_at !== expectedUpdatedAt) {
      return NextResponse.json({ error: "تم تعديل الطلب بالتزامن. حدّث الصفحة ثم أعد المحاولة." }, { status: 409 });
    }

    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (typeof body.youtubeId === "string") patch.youtube_id = body.youtubeId.slice(0, 200);
    if (typeof body.facebookId === "string") patch.facebook_id = body.facebookId.slice(0, 200);
    if (typeof body.errorMessage === "string") patch.error_message = body.errorMessage.slice(0, 1000);
    if (typeof body.errorDetails === "string") patch.error_details = body.errorDetails.slice(0, 4000);
    if (status === "pending") {
      Object.assign(patch, {
        error_message: null,
        error_details: null,
        heygen_video_id: null,
        heygen_status: null,
        heygen_submitted_at: null,
        heygen_last_polled_at: null,
      });
    }

    const concurrencyFilter = expectedUpdatedAt
      ? `&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`
      : "";
    const updated = await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}${concurrencyFilter}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(patch),
      },
    );
    if (!updated?.length) {
      return NextResponse.json({ error: "تم تعديل الطلب بالتزامن أو لم يعد موجودًا." }, { status: 409 });
    }
    await recordAdminAuditEvent({
      action: "video.request.update",
      permission: "video.manage",
      resourceType: "video_generation_requests",
      resourceId: id,
      metadata: { previousStatus: current.status, nextStatus: status, changedFields: Object.keys(patch).filter((key) => key !== "updated_at") },
    });
    return NextResponse.json({ ok: true, item: updated[0] });
  } catch (error) {
    console.error("[api/admin/videos/[id]] PATCH:", error);
    const message = error instanceof Error ? error.message : "تعذر تحديث العملية.";
    return NextResponse.json({ error: message }, { status: message.includes("تم تجاوز حد العمليات") ? 429 : 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminStepUpApi("video.delete");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    await enforceAdminRateLimit(auth.profile, "video.request.delete", 10, 60);

    const { id } = await context.params;
    const rows = await supabaseServerAdminRequest<Array<{ id: string; status: string; updated_at: string | null }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&select=id,status,updated_at&limit=1`,
    );
    if (!rows?.[0]) return NextResponse.json({ error: "Video request not found" }, { status: 404 });
    if (rows[0].status !== "failed") {
      return NextResponse.json({ error: "يمكن حذف عمليات التوليد الفاشلة فقط." }, { status: 409 });
    }

    const updatedFilter = rows[0].updated_at
      ? `&updated_at=eq.${encodeURIComponent(rows[0].updated_at)}`
      : "";
    const deleted = await supabaseServerAdminRequest<Array<{ id: string }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&status=eq.failed${updatedFilter}&select=id`,
      { method: "DELETE", headers: { Prefer: "return=representation" } },
    );
    if (!deleted?.length) return NextResponse.json({ error: "تم تغيير الطلب بالتزامن؛ حدّث الصفحة." }, { status: 409 });
    await recordAdminAuditEvent({
      action: "video.request.delete",
      permission: "video.delete",
      resourceType: "video_generation_requests",
      resourceId: id,
      metadata: { deletedStatus: "failed" },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/videos/[id]] DELETE:", error);
    const message = error instanceof Error ? error.message : "تعذر حذف العملية الفاشلة.";
    return NextResponse.json({ error: message }, { status: message.includes("تم تجاوز حد العمليات") ? 429 : 500 });
  }
}
