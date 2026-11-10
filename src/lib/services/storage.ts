import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  buildStoragePath,
  encodeStorageKey,
  getStoragePurposeConfig,
  isAllowedStorageContentType,
  parseStorageKey,
  SIGNED_UPLOAD_URL_TTL_SECONDS,
  type PresignedUpload,
  type StorageObjectPurpose,
} from "./storage-contract";

export {
  buildStoragePath,
  encodeStorageKey,
  getStoragePurposeConfig,
  isAllowedStorageContentType,
  parseStorageKey,
  sanitizeStorageSegment,
  SIGNED_UPLOAD_URL_TTL_SECONDS,
} from "./storage-contract";
export type {
  PresignedUpload,
  StorageObjectPurpose,
  StoragePurposeConfig,
} from "./storage-contract";

export async function createPresignedUploadUrl(params: {
  purpose: StorageObjectPurpose;
  ownerId: string;
  filename: string;
  contentType: string;
  contentLength: number;
}): Promise<PresignedUpload> {
  const config = getStoragePurposeConfig(params.purpose);
  if (!Number.isSafeInteger(params.contentLength) || params.contentLength <= 0 || params.contentLength > config.maxBytes) {
    throw new Error(`File size exceeds the ${Math.round(config.maxBytes / 1024 / 1024)}MB limit for ${params.purpose} uploads.`);
  }

  if (!params.contentType || !/^[\w.+-]+\/[\w.+-]+$/.test(params.contentType.trim())) {
    throw new Error('A valid content type is required for Supabase Storage uploads.');
  }

  if (!isAllowedStorageContentType(params.purpose, params.contentType)) {
    throw new Error(`Unsupported content type for ${params.purpose} uploads.`);
  }

  const supabase = await createClient();
  const path = buildStoragePath(params.ownerId, params.filename);
  const { data, error } = await supabase.storage
    .from(config.bucket)
    .createSignedUploadUrl(path, { upsert: false });

  if (error) throw new Error(error.message);

  const publicUrl = config.isPublic
    ? supabase.storage.from(config.bucket).getPublicUrl(path).data.publicUrl
    : null;

  return {
    key: encodeStorageKey(config.bucket, data.path),
    bucket: config.bucket,
    path: data.path,
    token: data.token,
    uploadUrl: data.signedUrl,
    publicUrl,
    expiresIn: SIGNED_UPLOAD_URL_TTL_SECONDS,
  };
}

export async function createPresignedDownloadUrl(key: string, expiresIn = 300) {
  const parsed = parseStorageKey(key);
  if (!parsed) throw new Error('Invalid storage object key.');

  const safeExpiresIn = Math.min(Math.max(expiresIn, 60), 900);
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, safeExpiresIn);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteStorageObject(key: string) {
  const parsed = parseStorageKey(key);
  if (!parsed) throw new Error('Invalid storage object key.');

  const supabase = await createClient();
  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  if (error) throw new Error(error.message);
}
