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

export type StoragePurposeConfig = {
  bucket: string;
  maxBytes: number;
  isPublic: boolean;
  allowedContentTypes: readonly string[];
};

// Supabase createSignedUploadUrl has a fixed two-hour lifetime. Unlike
// createSignedUrl, its SDK method does not accept a custom expiresIn value.
export const SIGNED_UPLOAD_URL_TTL_SECONDS = 2 * 60 * 60;

const PURPOSE_CONFIG: Record<StorageObjectPurpose, StoragePurposeConfig> = {
  avatar: {
    bucket: 'avatars',
    maxBytes: 5 * 1024 * 1024,
    isPublic: true,
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  media: {
    bucket: 'media',
    maxBytes: 20 * 1024 * 1024,
    isPublic: true,
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
  audio: {
    bucket: 'audio',
    maxBytes: 50 * 1024 * 1024,
    isPublic: false,
    allowedContentTypes: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'],
  },
  document: {
    bucket: 'documents',
    maxBytes: 20 * 1024 * 1024,
    isPublic: false,
    allowedContentTypes: ['application/pdf'],
  },
  video: {
    bucket: 'videos',
    maxBytes: 512 * 1024 * 1024,
    isPublic: true,
    allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'],
  },
};

export function getStoragePurposeConfig(purpose: StorageObjectPurpose): StoragePurposeConfig {
  return PURPOSE_CONFIG[purpose];
}

export function isAllowedStorageContentType(purpose: StorageObjectPurpose, contentType: string) {
  return PURPOSE_CONFIG[purpose].allowedContentTypes.includes(contentType.trim().toLowerCase());
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
