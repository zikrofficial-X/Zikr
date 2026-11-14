import { NextRequest, NextResponse } from 'next/server';
import { readBoundedJsonBody, readBoundedRequestBytes } from '@/lib/request/bounded-json-body';
import { MAX_MEDIA_IMAGE_BYTES } from '@/features/media/services/media-asset-limits';
import { supabaseServerAdminCount } from '@/lib/supabase/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { requireAdminStepUpApi } from '@/features/admin/services/security';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
import {
  AdminMediaInputError,
  createAdminMediaAsset,
  getAdminMediaAssets,
  normalizeMediaFolder,
  updateAdminMediaAsset,
} from '@/features/media/services/media-assets';

const MAX_MEDIA_UPLOAD_REQUEST_BYTES = MAX_MEDIA_IMAGE_BYTES + 256 * 1024;
const MAX_MEDIA_PATCH_REQUEST_BYTES = 4 * 1024;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function responseError(
  message: string,
  status = 400,
) {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET() {
  const auth = await requireAdminApi('media.manage');
  if (!auth.ok) return responseError(auth.error, auth.status);

  try {
    const [assets, totalCount] = await Promise.all([
      getAdminMediaAssets(),
      supabaseServerAdminCount('media_assets').catch((countError) => {
        console.warn('[api/admin/media] exact asset count unavailable:', countError);
        return null;
      }),
    ]);
    return NextResponse.json(
      { assets, totalCount },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[api/admin/media] GET error', error);
    return responseError('تعذر تحميل مكتبة الوسائط.', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi('media.manage');
  if (!auth.ok) return responseError(auth.error, auth.status);

  try {
    const boundedBody = await readBoundedRequestBytes(request, MAX_MEDIA_UPLOAD_REQUEST_BYTES);
    if (!boundedBody.ok) return responseError(boundedBody.error, boundedBody.status);

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
      return responseError('صيغة رفع الوسائط غير صالحة.');
    }

    let form: FormData;
    try {
      const boundedRequest = new Request(request.url, {
        method: 'POST',
        headers: { 'content-type': contentType },
        body: boundedBody.bytes,
      });
      form = await boundedRequest.formData();
    } catch {
      return responseError('تعذر قراءة بيانات ملف الوسائط.', 400);
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return responseError('اختر ملف صورة صالحًا.');
    }
    if (file.size > MAX_MEDIA_IMAGE_BYTES) {
      return responseError('حجم الصورة يتجاوز الحد المسموح.', 413);
    }

    const readTextField = (key: string) => {
      const value = form.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };
    const rawFolder = readTextField('folder');
    const assetFolder = !rawFolder ? 'media' : normalizeMediaFolder(rawFolder);
    if (!assetFolder) return responseError('مجلد الوسائط غير صالح.');

    const title = readTextField('title') || file.name;
    const altTextValue = readTextField('alt_text_ar');
    const licenseValue = readTextField('license');
    const attributionValue = readTextField('attribution');
    const sourceIdValue = readTextField('source_id');
    if (
      file.name.length > 180 ||
      title.length > 180 ||
      altTextValue.length > 500 ||
      licenseValue.length > 120 ||
      attributionValue.length > 500 ||
      sourceIdValue.length > 100
    ) {
      return responseError('بيانات الوسائط تتجاوز الحدود المسموحة.', 400);
    }

    const altText = altTextValue || null;
    const license = licenseValue || null;
    const attribution = attributionValue || null;
    const sourceId = sourceIdValue || null;

    const asset = await createAdminMediaAsset({
      file,
      title,
      altText,
      license,
      attribution,
      sourceId,
      folder: assetFolder,
      createdBy: auth.profile.id,
    });
    try {
      await recordAdminAuditEvent({
        action: "media.asset.create",
        permission: "media.manage",
        resourceType: "media_assets",
        resourceId: typeof asset.id === "string" ? asset.id : null,
        metadata: { folder: assetFolder, mimeType: file.type, sizeBytes: file.size, sourceLinked: Boolean(sourceId) },
      });
    } catch (auditError) {
      // The asset row is already committed; returning 500 would invite a duplicate retry.
      console.warn("[api/admin/media] audit event unavailable after asset creation:", auditError);
    }

    return NextResponse.json(
      { asset },
      {
        status: 201,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    if (error instanceof AdminMediaInputError) {
      return responseError(error.message, 400);
    }
    console.error('[api/admin/media] POST error', error);
    return responseError(
      error instanceof Error ? error.message : 'تعذر رفع الأصل.',
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminStepUpApi('media.manage', '/admin/media');
  if (!auth.ok) return NextResponse.json({ error: auth.error, nextPath: 'nextPath' in auth ? auth.nextPath : undefined }, { status: auth.status, headers: { 'Cache-Control': 'no-store' } });

  try {
    const parsedBody = await readBoundedJsonBody(request, MAX_MEDIA_PATCH_REQUEST_BYTES);
    if (!parsedBody.ok) return responseError(parsedBody.error, parsedBody.status);
    if (
      !parsedBody.value ||
      typeof parsedBody.value !== 'object' ||
      Array.isArray(parsedBody.value)
    ) {
      return responseError('بيانات تحديث الوسائط غير صالحة.', 400);
    }
    const body = parsedBody.value as { id?: unknown; action?: unknown };
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const action = typeof body.action === 'string' ? body.action : '';

    if (
      !id ||
      !['verify_rights', 'publish', 'unpublish'].includes(action)
    ) {
      return responseError('إجراء وسائط غير صالح.');
    }

    const result = await updateAdminMediaAsset(
      id,
      action as 'verify_rights' | 'publish' | 'unpublish',
    );
    if (!result.ok) return responseError(result.error);
    try {
      await recordAdminAuditEvent({
        action: `media.asset.${action}`,
        permission: "media.manage",
        resourceType: "media_assets",
        resourceId: id,
      });
    } catch (auditError) {
      // The row-version update is already committed; do not report it as a failed mutation.
      console.warn("[api/admin/media] audit event unavailable after asset update:", auditError);
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[api/admin/media] PATCH error', error);
    return responseError('تعذر تحديث الأصل.', 500);
  }
}
