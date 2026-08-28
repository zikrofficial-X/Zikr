import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { uploadCloudinaryImage } from '@/lib/services/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_FOLDERS = new Set(['homepage', 'stories', 'articles', 'videos', 'competitions', 'branding', 'kids']);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function safeFolder(value: FormDataEntryValue | null) {
  const folder = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ALLOWED_FOLDERS.has(folder) ? folder : null;
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return errorResponse(guard.error, guard.status);

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = safeFolder(formData.get('folder'));
    const requestedPublicId = typeof formData.get('publicId') === 'string' ? String(formData.get('publicId')).trim() : '';

    if (!(file instanceof File)) return errorResponse('يرجى اختيار صورة صالحة.', 400);
    if (!folder) return errorResponse('مجلد الرفع غير صالح.', 400);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return errorResponse('الصيغ المدعومة: JPG وPNG وWEBP وGIF.', 400);
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return errorResponse('حجم الصورة يجب ألا يتجاوز 8 ميجابايت.', 400);

    const upload = await uploadCloudinaryImage({
      file,
      folder: `zikr/${folder}`,
      publicId: requestedPublicId || `${guard.profile.id}-${Date.now()}`,
      tags: ['zikr', 'admin', folder],
    });

    return NextResponse.json(upload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/cloudinary/image] POST error:', error);
    return errorResponse(error instanceof Error ? error.message : 'تعذر رفع الصورة إلى Cloudinary.', 500);
  }
}

export async function GET() {
  return errorResponse('Method not allowed', 405);
}
