import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { createPresignedUploadUrl } from '@/lib/services/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return jsonError(guard.error, guard.status);

  try {
    const body = await request.json().catch(() => null);
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
      expiresIn: 900,
    });

    return NextResponse.json(upload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/videos/upload] POST error:', error);
    return jsonError(error instanceof Error ? error.message : 'تعذر تجهيز رفع الفيديو.', 500);
  }
}

export async function GET() {
  return jsonError('Method not allowed', 405);
}
