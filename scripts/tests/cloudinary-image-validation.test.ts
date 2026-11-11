import assert from "node:assert/strict";
import { validateCloudinaryImage } from "../../src/features/media/services/cloudinary-validation";

function image(bytes: number[], type: string, size?: number) {
  const payload = size && size > bytes.length
    ? new Uint8Array(size)
    : new Uint8Array(bytes);
  payload.set(bytes);
  return new File([payload], "upload.bin", { type });
}

await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0xff, 0xd8, 0xff, 0xdb], "image/jpeg")),
);
await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png")),
);
await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], "image/webp")),
);
await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], "image/gif")),
);

await assert.rejects(
  () => validateCloudinaryImage(image([...Buffer.from("<svg onload=alert(1)>")], "image/png")),
  /does not match its declared raster image type/,
  "an SVG/HTML payload disguised as PNG must be rejected before upload",
);
await assert.rejects(
  () => validateCloudinaryImage(image([...Buffer.from("not-an-image")], "image/jpeg")),
  /does not match its declared raster image type/,
);
await assert.rejects(
  () => validateCloudinaryImage(image([0xff, 0xd8, 0xff], "image/svg+xml")),
  /Only JPG, PNG, WEBP, and GIF/,
);
await assert.rejects(
  () => validateCloudinaryImage(image([0x89, 0x50, 0x4e, 0x47], "image/png", 1024), 512),
  /between 1 byte and 0MB/,
);

console.log("Cloudinary raster signature validation contract passed.");
