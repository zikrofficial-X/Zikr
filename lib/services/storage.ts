import { createClient } from '@/lib/supabase/server';

export type StorageObjectPurpose = 'avatar' | 'media' | 'audio' | 'document' | 'video';

export type PresignedUpload = {
  key: string;
  bucket: string;
  path: string;
  token: string;
  uploadUrl: string;
  publicUrl: string | null;
  expiresIn: number;
};

const PURPOSE_CONFIG: Record<StorageObjectPurpose, { bucket: string; maxBytes: number; isPublic: boolean }> = {
  avatar: { bucket: 'avatars', maxBytes: 5 * 1024 * 1024, isPublic: true },
  media: { bucket: 'media', maxBytes: 20 * 1024 * 1024, isPublic: true },
  audio: { bucket: 'audio', maxBytes: 50 * 1024 * 1024, isPublic: false },
  document: { bucket: 'documents', maxBytes: 20 * 1024 * 1024, isPublic: false },
  video: { bucket: 'videos', maxBytes: 512 * 1024 * 1024, isPublic: true },
};

export function getStoragePurposeConfig(purpose: StorageObjectPurpose) {
  return PURPOSE_CONFIG[purpose];
}

export function sanitizeStorageSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function buildStoragePath(ownerId: string, filename: string) {
  const cleanOwner = sanitizeStorageSegment(ownerId) || 'anonymous';
  const cleanFilename = sanitizeStorageSegment(filename) || 'file';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${cleanOwner}/${timestamp}-${cleanFilename}`;
}

export function encodeStorageKey(bucket: string, path: string) {
  return `${bucket}/${path.replace(/^\/+/, '')}`;
}

export function parseStorageKey(key: string) {
  const cleanKey = key.trim().replace(/^\/+/, '');
  const separator = cleanKey.indexOf('/');
  if (separator <= 0 || separator === cleanKey.length - 1) return null;

  return {
    bucket: cleanKey.slice(0, separator),
    path: cleanKey.slice(separator + 1),
  };
}

export async function createPresignedUploadUrl(params: {
  purpose: StorageObjectPurpose;
  ownerId: string;
  filename: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number;
}): Promise<PresignedUpload> {
  const config = PURPOSE_CONFIG[params.purpose];
  if (params.contentLength <= 0 || params.contentLength > config.maxBytes) {
    throw new Error(`File size exceeds the ${Math.round(config.maxBytes / 1024 / 1024)}MB limit for ${params.purpose} uploads.`);
  }

  if (!params.contentType || !/^[\w.+-]+\/[\w.+-]+$/.test(params.contentType)) {
    throw new Error('A valid content type is required for Supabase Storage uploads.');
  }

  const supabase = await createClient();
  const path = buildStoragePath(params.ownerId, params.filename);
  const expiresIn = Math.min(Math.max(params.expiresIn ?? 300, 60), 900);
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
    expiresIn,
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
