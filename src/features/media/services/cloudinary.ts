import "server-only";

import { getServerEnv } from '@/lib/env';
import { normalizeCloudinaryFolderPath } from '@/features/media/services/cloudinary-folder';
import { validateCloudinaryImage } from '@/features/media/services/cloudinary-validation';
import { deleteCloudinaryImageIfUnreferenced as deleteCloudinaryImageIfUnreferencedCore } from "@/features/media/services/cloudinary-orphan-compensation";

export { validateCloudinaryImage } from '@/features/media/services/cloudinary-validation';

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
  error?: { message?: string };
};

export type CloudinaryImageUpload = {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string | null;
};

function safeSegment(value: string, fallback: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || fallback;
}

function cloudinaryConfig() {
  const env = getServerEnv();
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured for server-side uploads.');
  }

  return { cloudName, apiKey, apiSecret };
}

/**
 * Upload an authenticated user or administrator image from trusted server code.
 * Cloudinary credentials remain server-only; browser code receives only the
 * resulting HTTPS delivery URL stored in Supabase.
 */
export async function uploadCloudinaryImage(params: {
  file: File;
  folder: string;
  publicId: string;
  tags?: string[];
  maxBytes?: number;
}): Promise<CloudinaryImageUpload> {
  await validateCloudinaryImage(params.file, params.maxBytes);
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();

  const form = new FormData();
  const fileName = safeSegment(params.file.name.replace(/\.[^.]+$/, ''), 'image');
  const extension = params.file.type.split('/')[1] || 'bin';
  form.append(
    'file',
    new Blob([await params.file.arrayBuffer()], { type: params.file.type }),
    `${fileName}.${extension}`
  );
  form.append('folder', normalizeCloudinaryFolderPath(params.folder));
  form.append('public_id', safeSegment(params.publicId, 'image'));
  form.append('overwrite', 'false');
  form.append('resource_type', 'image');
  form.append('invalidate', 'true');
  if (params.tags?.length) form.append('tags', params.tags.map(tag => safeSegment(tag, '')).filter(Boolean).join(','));

  const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
      body: form,
      signal: AbortSignal.timeout(25_000),
    }
  );

  const payload = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;
  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(payload.error?.message || `Cloudinary upload failed (HTTP ${response.status}).`);
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    bytes: payload.bytes ?? params.file.size,
    format: payload.format ?? null,
  };
}

export async function deleteCloudinaryImageIfUnreferenced(
  params: Parameters<typeof deleteCloudinaryImageIfUnreferencedCore>[0],
) {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  return deleteCloudinaryImageIfUnreferencedCore(params, {
    credentials: { cloudName, apiKey, apiSecret },
  });
}
