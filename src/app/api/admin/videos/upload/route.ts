import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStepUpApi } from '@/features/admin/services/security';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
import { runPostCommitAudit } from '@/features/admin/services/post-commit-audit';
import { createPresignedUploadUrl } from '@/lib/services/storage';
import { readBoundedJsonBody } from '@/lib/request/bounded-json-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminStepUpApi('video.manage', '/admin/videos');
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.error, nextPath: 'nextPath' in guard ? guard.nextPath : undefined },
      { status: guard.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const parsedBody = await readBoundedJsonBody(request);
    if (!parsedBody.ok) return jsonError(parsedBody.error, parsedBody.status);
    const body =
      parsedBody.value && typeof parsedBody.value === "object" && !Array.isArray(parsedBody.value)
        ? (parsedBody.value as Record<string, unknown>)
        : null;
    const filename = typeof body?.filename === 'string' ? body.filename.trim() : '';
    const contentType = typeof body?.contentType === 'string' ? body.contentType.trim().toLowerCase() : '';
    const contentLength = Number(body?.contentLength ?? 0);

    if (!filename || filename.length > 180) {
      return jsonError('اسم ملف الفيديو غير صالح.', 400);
    }
    if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
      return jsonError('صيغة الفيديو غير مدعومة. استخدم MP4 أو WebM أو MOV.', 400);
    }
    if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
      return jsonError('حجم ملف الفيديو غير صالح.', 400);
    }

    const upload = await createPresignedUploadUrl({
      purpose: 'video',
      ownerId: guard.profile.id,
      filename,
      contentType,
      contentLength,
    });
    const auditRecorded = await runPostCommitAudit(
      () => recordAdminAuditEvent({
        action: "video.upload_url.create",
        permission: "video.manage",
        resourceType: "video_uploads",
        resourceId: upload.path,
        metadata: { filename, contentType, contentLength },
      }),
      (auditError) => console.error("[api/admin/videos/upload] audit event failed after committed mutation:", auditError),
    );

    // Do not disclose a short-lived storage capability when the required audit
    // event could not be persisted.
    if (!auditRecorded) {
      return jsonError("تعذر تسجيل عملية الرفع؛ لم يتم إصدار رابط الرفع.", 503);
    }

    return NextResponse.json(upload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error('[api/admin/videos/upload] POST error:', error);
    return jsonError(error instanceof Error ? error.message : 'تعذر تجهيز رفع الفيديو.', 500);
  }
}

export async function GET() {
  return jsonError('Method not allowed', 405);
}
