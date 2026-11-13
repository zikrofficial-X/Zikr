import { NextRequest, NextResponse } from 'next/server';
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
    const assets = await getAdminMediaAssets();
    return NextResponse.json(
      { assets },
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
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return responseError('اختر ملف صورة صالحًا.');
    }

    const assetFolder = normalizeMediaFolder(form.get('folder')) ?? 'media';
    const title = String(form.get('title') ?? file.name).trim() || file.name;
    const altText = String(form.get('alt_text_ar') ?? '').trim() || null;
    const license = String(form.get('license') ?? '').trim() || null;
    const attribution = String(form.get('attribution') ?? '').trim() || null;
    const sourceId = String(form.get('source_id') ?? '').trim() || null;

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
    const body = (await request.json().catch(() => ({}))) as {
      id?: unknown;
      action?: unknown;
    };
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const action =
      typeof body.action === 'string' ? body.action : '';

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
