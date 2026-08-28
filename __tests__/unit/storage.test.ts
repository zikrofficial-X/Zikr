import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  encodeStorageKey,
  getStoragePurposeConfig,
  parseStorageKey,
  sanitizeStorageSegment,
} from '@/lib/services/storage';

describe('Supabase Storage helpers', () => {
  it('maps upload purposes to Supabase Storage buckets', () => {
    assert.equal(getStoragePurposeConfig('avatar').bucket, 'avatars');
    assert.equal(getStoragePurposeConfig('media').bucket, 'media');
    assert.equal(getStoragePurposeConfig('audio').bucket, 'audio');
    assert.equal(getStoragePurposeConfig('document').bucket, 'documents');
    assert.equal(getStoragePurposeConfig('video').bucket, 'videos');
    assert.equal(getStoragePurposeConfig('video').maxBytes, 512 * 1024 * 1024);
  });

  it('sanitizes path segments and parses bucket-prefixed keys', () => {
    assert.equal(sanitizeStorageSegment(' User 123 / Avatar.PNG '), 'user-123-avatar.png');
    assert.deepEqual(parseStorageKey(encodeStorageKey('avatars', '/user-123/file.png')), {
      bucket: 'avatars',
      path: 'user-123/file.png',
    });
  });
});
