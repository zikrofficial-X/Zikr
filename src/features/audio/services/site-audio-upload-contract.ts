import { sanitizeStorageSegment } from "../../../lib/services/storage-contract";

export const SITE_AUDIO_ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/webm",
] as const;

export const SITE_AUDIO_MAX_BYTES = 50 * 1024 * 1024;

export type SiteAudioUploadPathValidation =
  | { ok: true; directory: string; fileName: string }
  | { ok: false; reason: "invalid_path" | "invalid_mime_type" | "invalid_size" };

export type SiteAudioStorageListItem = {
  name?: unknown;
  metadata?: unknown;
};

export type SiteAudioObjectValidation =
  | { ok: true }
  | { ok: false; reason: "missing_object" | "invalid_metadata" | "size_mismatch" | "mime_mismatch" };

export function validateSiteAudioUploadPath(input: {
  ownerId: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}): SiteAudioUploadPathValidation {
  const ownerSegment = sanitizeStorageSegment(input.ownerId);
  const parts = input.storagePath.split("/");
  if (
    !ownerSegment ||
    parts.length !== 2 ||
    parts[0] !== ownerSegment ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}-[a-z0-9._-]{1,120}$/i.test(parts[1] ?? "")
  ) {
    return { ok: false, reason: "invalid_path" };
  }

  if (!SITE_AUDIO_ALLOWED_MIME_TYPES.includes(input.mimeType.trim().toLowerCase() as typeof SITE_AUDIO_ALLOWED_MIME_TYPES[number])) {
    return { ok: false, reason: "invalid_mime_type" };
  }

  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > SITE_AUDIO_MAX_BYTES) {
    return { ok: false, reason: "invalid_size" };
  }

  return { ok: true, directory: ownerSegment, fileName: parts[1] };
}

export function validateSiteAudioStorageObject(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  objects: readonly SiteAudioStorageListItem[];
}): SiteAudioObjectValidation {
  const object = input.objects.find((candidate) => candidate.name === input.fileName);
  if (!object) return { ok: false, reason: "missing_object" };

  const metadata = object.metadata && typeof object.metadata === "object" && !Array.isArray(object.metadata)
    ? object.metadata as Record<string, unknown>
    : {};
  const rawSize = metadata.size ?? metadata.contentLength;
  const actualSize = typeof rawSize === "number" ? rawSize : Number(rawSize);
  const rawMimeType = metadata.mimetype ?? metadata.contentType;
  const actualMimeType = typeof rawMimeType === "string" ? rawMimeType.trim().toLowerCase() : "";

  if (!Number.isSafeInteger(actualSize) || actualSize <= 0 || !actualMimeType) {
    return { ok: false, reason: "invalid_metadata" };
  }
  if (actualSize !== input.sizeBytes) return { ok: false, reason: "size_mismatch" };
  if (actualMimeType !== input.mimeType.trim().toLowerCase()) return { ok: false, reason: "mime_mismatch" };

  return { ok: true };
}
