import "server-only";

import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { uploadCloudinaryImage } from "@/features/media/services/cloudinary";

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

  const upload = await uploadCloudinaryImage({
    file: input.file,
    folder: `zikr/${input.folder}`,
    publicId: `${input.createdBy}-${crypto.randomUUID()}`,
    tags: ["zikr", "admin", "media", input.folder],
    maxBytes: MAX_IMAGE_BYTES,
  });

  const rows = await supabaseServerAdminRequest<AdminMediaAsset[]>(
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
        },
        created_by: input.createdBy,
        alt_text_ar: input.altText,
      }),
    },
  );

  return rows[0] ?? {};
}

export async function updateAdminMediaAsset(
  id: string,
  action: "verify_rights" | "publish" | "unpublish",
): Promise<AdminMediaResult> {
  if (!id.trim()) return { ok: false, error: "معرّف الأصل غير صالح." };

  if (action === "verify_rights") {
    await supabaseServerAdminRequest(
      `/rest/v1/media_assets?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          rights_verified: true,
          verified_rights: true,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return { ok: true };
  }

  const current = await supabaseServerAdminRequest<
    Array<{ rights_verified: boolean; verified_rights: boolean }>
  >(
    `/rest/v1/media_assets?select=rights_verified,verified_rights&id=eq.${encodeURIComponent(
      id,
    )}&limit=1`,
    { method: "GET" },
  );

  if (
    action === "publish" &&
    !(current[0]?.rights_verified && current[0]?.verified_rights)
  ) {
    return { ok: false, error: "لا يمكن نشر الأصل قبل توثيق حقوقه." };
  }

  await supabaseServerAdminRequest(
    `/rest/v1/media_assets?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        published: action === "publish",
        updated_at: new Date().toISOString(),
      }),
    },
  );

  return { ok: true };
}
