import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';
import { uploadCloudinaryImage } from '@/features/media/services/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_FOLDERS = new Set(['homepage', 'stories', 'articles', 'videos', 'competitions', 'branding', 'kids', 'media']);

function responseError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function folder(value: FormDataEntryValue | null) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ALLOWED_FOLDERS.has(normalized) ? normalized : 'media';
}

export async function GET() {
  const auth = await requireAdminApi('media.manage');
  if (!auth.ok) return responseError(auth.error, auth.status);

  try {
    const assets = await supabaseServerAdminRequest<Array<Record<string, unknown>>>(
      '/rest/v1/media_assets?select=id,name,title,media_type,asset_type,url,storage_path,mime_type,size_bytes,source_id,license,attribution,rights_verified,verified_rights,published,created_by,created_at,updated_at,alt_text_ar,width,height,duration_seconds&order=created_at.desc&limit=300',
      { method: 'GET' },
    );
    return NextResponse.json({ assets: assets ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/media] GET error', error);
    return responseError('تعذر تحميل مكتبة الوسائط.', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi('media.manage');
  if (!auth.ok) return responseError(auth.error, auth.status);

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return responseError('اختر ملف صورة صالحًا.');
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return responseError('الصيغ المدعومة: JPG وPNG وWEBP وGIF.');
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return responseError('حجم الصورة يجب ألا يتجاوز 8 ميجابايت.');

    const title = String(form.get('title') ?? file.name).trim() || file.name;
    const altText = String(form.get('alt_text_ar') ?? '').trim() || null;
    const license = String(form.get('license') ?? '').trim() || null;
    const attribution = String(form.get('attribution') ?? '').trim() || null;
    const sourceId = String(form.get('source_id') ?? '').trim() || null;
    const assetFolder = folder(form.get('folder'));

    if (!license && !attribution) {
      return responseError('أدخل الترخيص أو بيانات النسب قبل تسجيل الأصل.');
    }

    if (sourceId) {
      const source = await supabaseServerAdminRequest<Array<{ id: string; verified: boolean }>>(
        `/rest/v1/content_sources?select=id,verified&id=eq.${encodeURIComponent(sourceId)}&limit=1`,
        { method: 'GET' },
      );
      if (!source[0]?.verified) return responseError('المصدر المختار غير موثّق.');
    }

    const upload = await uploadCloudinaryImage({
      file,
      folder: `zikr/${assetFolder}`,
      publicId: `${auth.profile.id}-${crypto.randomUUID()}`,
      tags: ['zikr', 'admin', 'media', assetFolder],
      maxBytes: MAX_IMAGE_BYTES,
    });

    const rows = await supabaseServerAdminRequest<Array<Record<string, unknown>>>('/rest/v1/media_assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        name: file.name,
        title,
        media_type: 'image',
        asset_type: assetFolder,
        url: upload.secureUrl,
        storage_path: upload.publicId,
        mime_type: file.type,
        size_bytes: upload.bytes,
        source_id: sourceId,
        license,
        attribution,
        rights_verified: false,
        verified_rights: false,
        published: false,
        metadata: { provider: 'cloudinary', cloudinary_public_id: upload.publicId },
        created_by: auth.profile.id,
        alt_text_ar: altText,
      }),
    });

    return NextResponse.json({ asset: rows?.[0] ?? null }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/media] POST error', error);
    return responseError(error instanceof Error ? error.message : 'تعذر رفع الأصل.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi('media.manage');
  if (!auth.ok) return responseError(auth.error, auth.status);

  try {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown; action?: unknown };
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const action = typeof body.action === 'string' ? body.action : '';
    if (!id || !['verify_rights', 'publish', 'unpublish'].includes(action)) return responseError('إجراء وسائط غير صالح.');

    if (action === 'verify_rights') {
      await supabaseServerAdminRequest(`/rest/v1/media_assets?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ rights_verified: true, verified_rights: true, updated_at: new Date().toISOString() }),
      });
    } else {
      const current = await supabaseServerAdminRequest<Array<{ rights_verified: boolean; verified_rights: boolean }>>(
        `/rest/v1/media_assets?select=rights_verified,verified_rights&id=eq.${encodeURIComponent(id)}&limit=1`,
        { method: 'GET' },
      );
      if (action === 'publish' && !(current[0]?.rights_verified && current[0]?.verified_rights)) {
        return responseError('لا يمكن نشر الأصل قبل توثيق حقوقه.');
      }
      await supabaseServerAdminRequest(`/rest/v1/media_assets?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ published: action === 'publish', updated_at: new Date().toISOString() }),
      });
    }

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/media] PATCH error', error);
    return responseError('تعذر تحديث الأصل.', 500);
  }
}
