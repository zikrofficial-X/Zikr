// Keep file payloads safely below the configured Server Action boundary.
export const MAX_CLOUDINARY_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_CLOUDINARY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const IMAGE_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": bytes =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": bytes =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a,
  "image/webp": bytes =>
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50,
  "image/gif": bytes =>
    bytes.length >= 6 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
    bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61,
};

export async function validateCloudinaryImage(
  file: File,
  maxBytes = MAX_CLOUDINARY_IMAGE_BYTES,
): Promise<void> {
  if (!ALLOWED_CLOUDINARY_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, and GIF images are supported.");
  }
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || file.size <= 0 || file.size > maxBytes) {
    throw new Error(
      `Image uploads must be between 1 byte and ${Math.floor(maxBytes / (1024 * 1024))}MB.`,
    );
  }

  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!IMAGE_SIGNATURES[file.type](signature)) {
    throw new Error("Image file content does not match its declared raster image type.");
  }
}

/**
 * Accept only image-upload URLs from the configured Cloudinary account.
 * This is used for server-action form values, which can be forged independently
 * of the browser upload widget.
 */
export function isCloudinarySecureImageUrl(value: string, expectedCloudName: string | undefined): boolean {
  const cloudName = expectedCloudName?.trim();
  if (!cloudName) return false;

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.port === "" &&
      !url.username &&
      !url.password &&
      !url.hash &&
      segments[0] === cloudName &&
      segments[1] === "image" &&
      segments[2] === "upload" &&
      segments.length >= 4
    );
  } catch {
    return false;
  }
}
