import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { sanitizeStorageSegment } from '@/lib/services/storage';

const ALLOWED_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/webm']);
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi('audio.manage');
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await request.json().catch(() => null);
  const filename = typeof body?.filename === 'string' ? body.filename.trim() : '';
  const contentType = typeof body?.contentType === 'string' ? body.contentType.toLowerCase().trim() : '';
  const contentLength = Number(body?.contentLength);
  if (!filename || filename.length > 180 || !ALLOWED_TYPES.has(contentType) || !Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > MAX_BYTES) {
    return NextResponse.json({ error: 'ملف الصوت غير صالح. استخدم MP3 أو WAV أو OGG أو M4A بحجم لا يتجاوز 50MB.' }, { status: 400 });
  }

  const safeName = sanitizeStorageSegment(filename) || 'audio';
  const path = `${sanitizeStorageSegment(guard.profile.id)}/${crypto.randomUUID()}-${safeName}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from('site-audio').createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path, token: data.token, uploadUrl: data.signedUrl });
}
