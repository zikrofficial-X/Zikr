export const MAX_MEDIA_IMAGE_BYTES = 3 * 1024 * 1024;

export const MEDIA_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MEDIA_IMAGE_ACCEPT = MEDIA_IMAGE_MIME_TYPES.join(",");

export function isAllowedMediaImageType(value: string): boolean {
  return (MEDIA_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}
