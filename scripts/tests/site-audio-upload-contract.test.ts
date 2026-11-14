import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SITE_AUDIO_MAX_BYTES,
  validateSiteAudioStorageObject,
  validateSiteAudioUploadPath,
} from "../../src/features/audio/services/site-audio-upload-contract";

const ownerId = "2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d";
const fileName = "123e4567-e89b-12d3-a456-426614174000-recording.mp3";
const storagePath = `${ownerId}/${fileName}`;

assert.deepEqual(
  validateSiteAudioUploadPath({
    ownerId,
    storagePath,
    mimeType: "audio/mpeg",
    sizeBytes: 4096,
  }),
  { ok: true, directory: ownerId, fileName },
);
assert.deepEqual(
  validateSiteAudioUploadPath({
    ownerId,
    storagePath: `other-user/${fileName}`,
    mimeType: "audio/mpeg",
    sizeBytes: 4096,
  }),
  { ok: false, reason: "invalid_path" },
  "an administrator cannot register an upload outside their own storage prefix",
);
assert.deepEqual(
  validateSiteAudioUploadPath({
    ownerId,
    storagePath: `${ownerId}/nested/${fileName}`,
    mimeType: "audio/mpeg",
    sizeBytes: 4096,
  }),
  { ok: false, reason: "invalid_path" },
  "metadata registration must use the exact server-generated two-segment path",
);
assert.deepEqual(
  validateSiteAudioUploadPath({
    ownerId,
    storagePath,
    mimeType: "text/plain",
    sizeBytes: 4096,
  }),
  { ok: false, reason: "invalid_mime_type" },
);
assert.deepEqual(
  validateSiteAudioUploadPath({
    ownerId,
    storagePath,
    mimeType: "audio/mpeg",
    sizeBytes: SITE_AUDIO_MAX_BYTES + 1,
  }),
  { ok: false, reason: "invalid_size" },
);

const uploadedObject = {
  name: fileName,
  metadata: { size: "4096", mimetype: "audio/mpeg" },
};
assert.deepEqual(
  validateSiteAudioStorageObject({
    fileName,
    mimeType: "audio/mpeg",
    sizeBytes: 4096,
    objects: [uploadedObject],
  }),
  { ok: true },
);
assert.deepEqual(
  validateSiteAudioStorageObject({
    fileName,
    mimeType: "audio/mpeg",
    sizeBytes: 4096,
    objects: [],
  }),
  { ok: false, reason: "missing_object" },
  "the API must not register a path before the signed upload actually exists",
);
assert.deepEqual(
  validateSiteAudioStorageObject({
    fileName,
    mimeType: "audio/mpeg",
    sizeBytes: 4097,
    objects: [uploadedObject],
  }),
  { ok: false, reason: "size_mismatch" },
);
assert.deepEqual(
  validateSiteAudioStorageObject({
    fileName,
    mimeType: "audio/wav",
    sizeBytes: 4096,
    objects: [uploadedObject],
  }),
  { ok: false, reason: "mime_mismatch" },
);
assert.deepEqual(
  validateSiteAudioStorageObject({
    fileName,
    mimeType: "audio/mpeg",
    sizeBytes: 4096,
    objects: [{ name: fileName, metadata: {} }],
  }),
  { ok: false, reason: "invalid_metadata" },
);

const adminRoute = readFileSync("src/app/api/admin/site-audio/route.ts", "utf8");
const uploadRoute = readFileSync("src/app/api/admin/site-audio/upload/route.ts", "utf8");
const manager = readFileSync("src/features/admin/components/site-audio-manager.tsx", "utf8");
assert.match(adminRoute, /validateSiteAudioUploadPath/);
assert.ok(adminRoute.includes('.from("site-audio")\n    .list('));
assert.match(adminRoute, /validateSiteAudioStorageObject/);
const objectValidationCall = adminRoute.indexOf("const objectValidation = validateSiteAudioStorageObject(");
const metadataInsertCall = adminRoute.indexOf('.from("site_audio_assets")\n    .insert');
assert.ok(
  objectValidationCall >= 0 && metadataInsertCall > objectValidationCall,
  "storage object verification must finish before metadata is inserted",
);
assert.match(uploadRoute, /SITE_AUDIO_ALLOWED_MIME_TYPES/);
assert.match(uploadRoute, /SITE_AUDIO_MAX_BYTES/);
const signedUrlPosition = uploadRoute.indexOf("createSignedUploadUrl");
const auditEventPosition = uploadRoute.indexOf("await recordAdminAuditEvent", signedUrlPosition);
assert.ok(signedUrlPosition >= 0 && auditEventPosition > signedUrlPosition, "the audit event is recorded after the signed URL is created");
assert.match(uploadRoute, /let auditRecorded = true/);
assert.ok(uploadRoute.includes("catch (auditError)"));
assert.match(uploadRoute, /auditRecorded,/);
assert.ok(manager.includes("const presignAuditRecorded = signed.auditRecorded !== false"));
assert.match(manager, /!presignAuditRecorded/);
assert.match(adminRoute, /recordAuditSafely/);
assert.match(manager, /payload\.auditRecorded === false/);

console.log("Site-audio upload registration and audit-result contracts passed.");
