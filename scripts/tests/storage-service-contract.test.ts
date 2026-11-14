import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildStoragePath,
  encodeStorageKey,
  getStoragePurposeConfig,
  isAllowedStorageContentType,
  parseStorageKey,
  sanitizeStorageSegment,
  SIGNED_UPLOAD_URL_TTL_SECONDS,
  type StorageObjectPurpose,
} from "../../src/lib/services/storage-contract";

const expectedConfig: Record<StorageObjectPurpose, {
  bucket: string;
  maxBytes: number;
  isPublic: boolean;
  allowedContentTypes: string[];
}> = {
  avatar: {
    bucket: "avatars",
    maxBytes: 5 * 1024 * 1024,
    isPublic: true,
    allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  media: {
    bucket: "media",
    maxBytes: 20 * 1024 * 1024,
    isPublic: true,
    allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
  },
  audio: {
    bucket: "audio",
    maxBytes: 50 * 1024 * 1024,
    isPublic: false,
    allowedContentTypes: ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav"],
  },
  document: {
    bucket: "documents",
    maxBytes: 20 * 1024 * 1024,
    isPublic: false,
    allowedContentTypes: ["application/pdf"],
  },
  video: {
    bucket: "videos",
    maxBytes: 512 * 1024 * 1024,
    isPublic: true,
    allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"],
  },
};

for (const [purpose, expected] of Object.entries(expectedConfig) as [StorageObjectPurpose, typeof expectedConfig[StorageObjectPurpose]][]) {
  assert.deepEqual(getStoragePurposeConfig(purpose), expected, `${purpose} storage limits and MIME types must match Supabase bucket configuration`);
  for (const contentType of expected.allowedContentTypes) {
    assert.equal(isAllowedStorageContentType(purpose, contentType), true);
    assert.equal(isAllowedStorageContentType(purpose, contentType.toUpperCase()), true);
  }
  assert.equal(isAllowedStorageContentType(purpose, "text/html"), false);
}

assert.equal(
  SIGNED_UPLOAD_URL_TTL_SECONDS,
  7200,
  "the response must report Supabase's fixed two-hour signed-upload URL lifetime",
);

assert.equal(sanitizeStorageSegment(" User 123/My Photo.PNG "), "user-123-my-photo.png");
const generatedPath = buildStoragePath("User 123", "My Photo.PNG");
assert.match(
  generatedPath,
  /^user-123\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-my-photo\.png$/,
);
assert.equal(encodeStorageKey("avatars", "/user-123/avatar.png"), "avatars/user-123/avatar.png");
assert.deepEqual(parseStorageKey("avatars/user-123/avatar.png"), {
  bucket: "avatars",
  path: "user-123/avatar.png",
});
assert.equal(parseStorageKey("avatars"), null);
assert.equal(parseStorageKey("avatars/"), null);

const migrationPath = resolve(
  "supabase/migrations/20261110115000_restore_owner_scoped_user_storage_policies.sql",
);
const migration = readFileSync(migrationPath, "utf8");
for (const action of ["select", "insert", "update", "delete"]) {
  assert.match(
    migration,
    new RegExp(`create policy "user_storage_${action}_own"[\\s\\S]*?for ${action}\\s+to authenticated`, "i"),
    `user storage ${action} policy must be restricted to authenticated users`,
  );
}
assert.equal(
  (migration.match(/auth\.uid\(\)::text = \(storage\.foldername\(name\)\)\[1\]/g) ?? []).length,
  5,
  "all four policies and both sides of UPDATE must enforce the owner path",
);
assert.match(migration, /bucket_id in \('avatars', 'media', 'audio', 'documents'\)/i);
assert.doesNotMatch(migration, /to anon/i, "the migration must not grant anonymous write access");
assert.doesNotMatch(migration, /insert into storage\.buckets/i, "the migration must not alter bucket visibility or limits");


const storagePresignRouteSource = readFileSync("src/app/api/storage/presign/route.ts", "utf8");
assert.match(storagePresignRouteSource, /readBoundedJsonBody\(request\)/);
assert.doesNotMatch(storagePresignRouteSource, /request\.json\(\)/);
assert.match(storagePresignRouteSource, /export const dynamic = ['"]force-dynamic['"]/);
assert.equal(
  (storagePresignRouteSource.match(/"Cache-Control": "no-store"/g) || []).length,
  3,
  "upload, download, and error responses must never cache signed storage capabilities",
);

console.log("Storage owner-policy, MIME, path, upload-expiry, and bounded no-store presign contracts passed.");
