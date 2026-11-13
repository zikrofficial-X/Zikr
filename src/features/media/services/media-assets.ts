import "server-only";

import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";
import { isDefinitiveSupabaseInsertRejection } from "@/features/media/services/cloudinary-orphan-compensation";
import {
  deleteCloudinaryImageIfUnreferenced,
  uploadCloudinaryImage,
  type CloudinaryImageUpload,
} from "@/features/media/services/cloudinary";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_FOLDERS = new Set([
  "homepage",
  "stories",
  "articles",
  "videos",
  "competitions",
  "branding",
  "kids",
  "media",
]);

export type AdminMediaAsset = Record<string, unknown>;

export type AdminMediaResult =
  | { ok: true }
  | { ok: false; error: string };

export function normalizeMediaFolder(value: unknown): string | null {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALLOWED_FOLDERS.has(normalized) ? normalized : null;
}

function validateImage(file: File): string | null {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return "حجم الصورة يجب ألا يتجاوز 8 ميجابايت.";
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "الصيغ المدعومة: JPG وPNG وWEBP وGIF.";
  }
  return null;
}

export async function getAdminMediaAssets(): Promise<AdminMediaAsset[]> {
  return supabaseServerAdminRequest<AdminMediaAsset[]>(
    "/rest/v1/media_assets?select=id,name,title,media_type,asset_type,url,storage_path,mime_type,size_bytes,source_id,license,attribution,rights_verified,verified_rights,published,created_by,created_at,updated_at,alt_text_ar,width,height,duration_seconds&order=created_at.desc&limit=300",
    { method: "GET" },
  );
}

async function compensateOrphanedMediaAsset(
  upload: CloudinaryImageUpload,
  requestedPublicId: string,
) {
  try {
    const result = await deleteCloudinaryImageIfUnreferenced({
      publicId: upload.publicId,
      expectedPublicId: requestedPublicId,
      secureUrl: upload.secureUrl,
      isReferenced: async ({ publicId, secureUrl }) => {
        const [urlRows, storagePathRows] = await Promise.all([
          supabaseServerAdminRequest<Array<{ id: string }>>(
            "/rest/v1/media_assets?select=id&url=eq." +
              encodeURIComponent(secureUrl) +
              "&limit=1",
            { method: "GET" },
          ),
          supabaseServerAdminRequest<Array<{ id: string }>>(
            "/rest/v1/media_assets?select=id&storage_path=eq." +
              encodeURIComponent(publicId) +
              "&limit=1",
            { method: "GET" },
          ),
        ]);
        if (!Array.isArray(urlRows) || !Array.isArray(storagePathRows)) {
          throw new Error("Unable to verify whether the uploaded media asset is still referenced.");
        }
        return urlRows.length > 0 || storagePathRows.length > 0;
      },
    });
    if (result === "referenced") {
      console.warn(
        "[admin/media] orphan compensation skipped because the exact URL or public ID is still referenced.",
      );
    }
  } catch (cleanupError) {
    console.warn(
      "[admin/media] orphan compensation failed safely; the Cloudinary asset was retained.",
      cleanupError,
    );
  }
}

export async function createAdminMediaAsset(input: {
  file: File;
  title: string;
  altText: string | null;
  license: string | null;
  attribution: string | null;
  sourceId: string | null;
  folder: string;
  createdBy: string;
}): Promise<AdminMediaAsset> {
  const validationError = validateImage(input.file);
  if (validationError) throw new Error(validationError);

  if (!input.license && !input.attribution) {
    throw new Error("أدخل الترخيص أو بيانات النسب قبل تسجيل الأصل.");
  }

  if (!ALLOWED_FOLDERS.has(input.folder)) {
    throw new Error("مجلد الوسائط غير صالح.");
  }

  if (input.sourceId) {
    const source = await supabaseServerAdminRequest<
      Array<{ id: string; verified: boolean }>
    >(
      `/rest/v1/content_sources?select=id,verified&id=eq.${encodeURIComponent(
        input.sourceId,
      )}&limit=1`,
      { method: "GET" },
    );
    if (!source[0]?.verified) throw new Error("المصدر المختار غير موثّق.");
  }

  const requestedPublicId = `${input.createdBy}-${crypto.randomUUID()}`;
  const upload = await uploadCloudinaryImage({
    file: input.file,
    folder: `zikr/${input.folder}`,
    publicId: requestedPublicId,
    tags: ["zikr", "admin", "media", input.folder],
    maxBytes: MAX_IMAGE_BYTES,
  });

  let rows: AdminMediaAsset[];
  try {
    rows = await supabaseServerAdminRequest<AdminMediaAsset[]>(
      "/rest/v1/media_assets",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: input.file.name,
          title: input.title,
          media_type: "image",
          asset_type: input.folder,
          url: upload.secureUrl,
          storage_path: upload.publicId,
          mime_type: input.file.type,
          size_bytes: upload.bytes,
          source_id: input.sourceId,
          license: input.license,
          attribution: input.attribution,
          rights_verified: false,
          verified_rights: false,
          published: false,
          metadata: {
            provider: "cloudinary",
            cloudinary_public_id: upload.publicId,
            ...(input.folder === "kids" ? { scope: "kids", section: "kids" } : {}),
          },
          created_by: input.createdBy,
          alt_text_ar: input.altText,
        }),
      },
    );
  } catch (saveError) {
    if (isDefinitiveSupabaseInsertRejection(saveError)) {
      await compensateOrphanedMediaAsset(upload, requestedPublicId);
    } else {
      console.warn(
        "[admin/media] database insert outcome is ambiguous; retaining the Cloudinary asset for reconciliation.",
        saveError,
      );
    }
    throw saveError;
  }

  if (!Array.isArray(rows) || !rows[0]) {
    await compensateOrphanedMediaAsset(upload, requestedPublicId);
    throw new Error("تعذر تسجيل أصل الوسائط بعد رفع الملف.");
  }
  return rows[0];
}

export async function updateAdminMediaAsset(
  id: string,
  action: "verify_rights" | "publish" | "unpublish",
): Promise<AdminMediaResult> {
  if (!id.trim()) return { ok: false, error: "معرّف الأصل غير صالح." };

  const current = await supabaseServerAdminRequest<
    Array<{
      id: string;
      rights_verified: boolean;
      verified_rights: boolean;
      updated_at: string;
    }>
  >(
    `/rest/v1/media_assets?select=id,rights_verified,verified_rights,updated_at&id=eq.${encodeURIComponent(
      id,
    )}&limit=1`,
    { method: "GET" },
  );

  if (!Array.isArray(current) || !current[0]) {
    return { ok: false, error: "أصل الوسائط غير موجود." };
  }
  if (
    typeof current[0].updated_at !== "string" ||
    !current[0].updated_at.trim()
  ) {
    return {
      ok: false,
      error: "تعذر التحقق من إصدار الأصل. حدّث الصفحة ثم أعد المحاولة.",
    };
  }
  if (
    action === "publish" &&
    !(current[0].rights_verified && current[0].verified_rights)
  ) {
    return { ok: false, error: "لا يمكن نشر الأصل قبل توثيق حقوقه." };
  }

  const patch =
    action === "verify_rights"
      ? { rights_verified: true, verified_rights: true }
      : { published: action === "publish" };
  const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/media_assets?id=eq.${encodeURIComponent(
      id,
    )}&updated_at=eq.${encodeURIComponent(current[0].updated_at)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...patch,
        updated_at: buildNextRowVersionUpdatedAt(current[0].updated_at),
      }),
    },
  );
  if (
    !Array.isArray(updated) ||
    updated.length !== 1 ||
    typeof updated[0]?.id !== "string" ||
    !updated[0].id.trim()
  ) {
    return { ok: false, error: "تم تعديل الأصل بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة." };
  }

  return { ok: true };
}
