// Keep file payloads safely below the configured 4MB Server Action boundary.
export const MAX_CLOUDINARY_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_CLOUDINARY_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function validateCloudinaryImage(file: File) {
  if (!ALLOWED_CLOUDINARY_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPG, PNG, WEBP, and GIF images are supported.');
  }
  if (file.size <= 0 || file.size > MAX_CLOUDINARY_IMAGE_BYTES) {
    throw new Error('Image uploads must be between 1 byte and 2MB.');
  }
}
