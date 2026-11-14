import { NextRequest, NextResponse } from 'next/server';
import { readBoundedJsonBody } from "@/lib/request/bounded-json-body";
import { requireAdminApi } from '@/features/admin/services/admin';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
import { createAdminClient, supabaseServerAdminRequest } from '@/lib/supabase/server';
import { sanitizeStorageSegment, SIGNED_UPLOAD_URL_TTL_SECONDS } from '@/lib/services/storage';
import { SITE_AUDIO_ALLOWED_MIME_TYPES, SITE_AUDIO_MAX_BYTES } from '@/features/audio/services/site-audio-upload-contract';

const ALLOWED_TYPES = new Set<string>(SITE_AUDIO_ALLOWED_MIME_TYPES);
const MAX_BYTES = SITE_AUDIO_MAX_BYTES;

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi('audio.manage');
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsedBody = await readBoundedJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = parsedBody.value && typeof parsedBody.value === "object" && !Array.isArray(parsedBody.value)
    ? parsedBody.value as Record<string, unknown>
    : null;
  const filename = typeof body?.filename === 'string' ? body.filename.trim() : '';
  const contentType = typeof body?.contentType === 'string' ? body.contentType.toLowerCase().trim() : '';
  const contentLength = Number(body?.contentLength);
  if (!filename || filename.length > 180 || !ALLOWED_TYPES.has(contentType) || !Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > MAX_BYTES) {
    return NextResponse.json({ error: 'ملف الصوت غير صالح. استخدم MP3 أو WAV أو OGG أو M4A أو AAC أو WebM بحجم لا يتجاوز 50MB.' }, { status: 400 });
  }

  const safeName = sanitizeStorageSegment(filename) || 'audio';
  const ownerId = sanitizeStorageSegment(guard.profile.id);
  if (!ownerId) return NextResponse.json({ error: 'تعذر تحديد مالك الملف.' }, { status: 500 });
  const path = `${ownerId}/${crypto.randomUUID()}-${safeName}`;
  const uploadExpiresAt = new Date(Date.now() + SIGNED_UPLOAD_URL_TTL_SECONDS * 1000);
  const cleanupAfter = new Date(uploadExpiresAt.getTime() + 24 * 60 * 60 * 1000);

  try {
    await supabaseServerAdminRequest('/rest/v1/site_audio_upload_intents', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        storage_path: path,
        owner_user_id: guard.profile.id,
        mime_type: contentType,
        size_bytes: contentLength,
        upload_expires_at: uploadExpiresAt.toISOString(),
        cleanup_after: cleanupAfter.toISOString(),
        status: 'pending',
      }),
    });
  } catch (intentError) {
    console.error('[api/admin/site-audio/upload] intent creation failed:', intentError);
    return NextResponse.json({ error: 'تعذر تجهيز سجل الرفع الآمن. أعد المحاولة.' }, { status: 503 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from('site-audio').createSignedUploadUrl(path, { upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    await recordAdminAuditEvent({
      action: "site_audio.upload_url.create",
      permission: "audio.manage",
      resourceType: "site_audio_assets",
      resourceId: path,
      metadata: { contentType, contentLength },
    });
  } catch (auditError) {
    console.error("[api/admin/site-audio/upload] audit event failed after signed URL creation:", auditError);
    // Do not disclose the signed capability when its issuance cannot be audited.
    // The pending intent remains eligible for the guarded orphan-retention workflow.
    return NextResponse.json(
      { error: "تعذر تسجيل عملية الرفع؛ لم يتم إصدار رابط الرفع.", auditRecorded: false },
      { status: 503 },
    );
  }
  return NextResponse.json({
    path,
    token: data.token,
    uploadUrl: data.signedUrl,
    expiresAt: uploadExpiresAt.toISOString(),
    auditRecorded: true,
  });
}
