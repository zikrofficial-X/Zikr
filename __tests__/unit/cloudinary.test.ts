import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateCloudinaryImage } from '@/lib/services/cloudinary-validation';

function file(bytes: number, type: string) {
  return new File([new Uint8Array(bytes)], 'upload.bin', { type });
}

describe('Cloudinary image upload validation', () => {
  it('accepts a supported image within the avatar size limit', () => {
    assert.doesNotThrow(() => validateCloudinaryImage(file(1024, 'image/webp')));
  });

  it('rejects unsupported upload types before any provider request', () => {
    assert.throws(
      () => validateCloudinaryImage(file(1024, 'image/svg+xml')),
      /Only JPG, PNG, WEBP, and GIF images are supported/
    );
  });

  it('rejects uploads above the server-side 2MB limit', () => {
    assert.throws(
      () => validateCloudinaryImage(file(2 * 1024 * 1024 + 1, 'image/png')),
      /between 1 byte and 2MB/
    );
  });
});
