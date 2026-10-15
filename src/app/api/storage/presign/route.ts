import {
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
  getStoragePurposeConfig,
  parseStorageKey,
  sanitizeStorageSegment,
  type StorageObjectPurpose,
} from '@/lib/services/storage';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const PURPOSES = new Set<StorageObjectPurpose>(['avatar', 'media', 'audio', 'document']);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function dependencyError(error: unknown): boolean {
  return error instanceof Error && /Missing (?:NEXT_PUBLIC_)?SUPABASE_|SUPABASE_SERVICE_ROLE_KEY/.test(error.message);
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return jsonError('Unauthorized', 401);
    const body = await request.json().catch(() => null);
    const purpose = body?.purpose as StorageObjectPurpose;
    if (!PURPOSES.has(purpose)) return jsonError('Invalid upload purpose.', 400);

    const filename = typeof body?.filename === 'string' ? body.filename : '';
    const contentType = typeof body?.contentType === 'string' ? body.contentType : '';
    const contentLength = Number(body?.contentLength ?? 0);

    const upload = await createPresignedUploadUrl({
      purpose,
      ownerId: user.id,
      filename,
      contentType,
      contentLength,
    });

    return NextResponse.json(upload);
  } catch (error) {
    console.error('[api/storage/presign] POST error:', error);
    return jsonError(dependencyError(error) ? 'Storage service is not configured.' : 'Failed to create upload URL.', dependencyError(error) ? 503 : 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return jsonError('Unauthorized', 401);
    const key = request.nextUrl.searchParams.get('key')?.trim();
    if (!key) return jsonError('Missing object key.', 400);

    const parsed = parseStorageKey(key);
    if (!parsed) return jsonError('Invalid storage object key.', 400);

    const ownerSegment = sanitizeStorageSegment(user.id);
    const ownsKey = Array.from(PURPOSES).some((purpose) => {
      const { bucket } = getStoragePurposeConfig(purpose);
      return parsed.bucket === bucket && parsed.path.startsWith(`${ownerSegment}/`);
    });
    if (!ownsKey) return jsonError('Forbidden object key.', 403);

    const url = await createPresignedDownloadUrl(key);
    return NextResponse.json({ url, expiresIn: 300 });
  } catch (error) {
    console.error('[api/storage/presign] GET error:', error);
    return jsonError(dependencyError(error) ? 'Storage service is not configured.' : 'Failed to create download URL.', dependencyError(error) ? 503 : 500);
  }
}
