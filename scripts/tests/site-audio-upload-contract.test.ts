import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readBoundedJsonBody } from "../../src/lib/request/bounded-json-body";
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
assert.ok(adminRoute.includes("readBoundedJsonBody(request)"));
assert.ok(uploadRoute.includes("readBoundedJsonBody(request)"));
assert.equal(adminRoute.includes("request.json()"), false, "admin site-audio JSON bodies must remain bounded");
assert.equal(uploadRoute.includes("request.json()"), false, "site-audio upload JSON bodies must remain bounded");
const oversizedRequest = new Request("https://zikrmediaofficial.vercel.app/api/admin/site-audio", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "x".repeat(20_000) }),
});
assert.deepEqual(
  await readBoundedJsonBody(oversizedRequest),
  { ok: false, status: 413, error: "Request body is too large" },
  "metadata-only site-audio endpoints must reject oversized JSON before buffering it",
);
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
assert.match(uploadRoute, /MP3 أو WAV أو OGG أو M4A أو AAC أو WebM/, "the upload error must list every supported audio format");
const signedUrlPosition = uploadRoute.indexOf("createSignedUploadUrl");
const auditEventPosition = uploadRoute.indexOf("await recordAdminAuditEvent", signedUrlPosition);
assert.ok(signedUrlPosition >= 0 && auditEventPosition > signedUrlPosition, "the audit event is recorded after the signed URL is created");
assert.ok(uploadRoute.includes("catch (auditError)"));
assert.ok(uploadRoute.includes("auditRecorded: true"));
const auditFailureStart = uploadRoute.indexOf("catch (auditError)");
const auditFailureEnd = uploadRoute.indexOf("return NextResponse.json({\n    path,", auditFailureStart);
const auditFailureBlock = uploadRoute.slice(auditFailureStart, auditFailureEnd);
assert.ok(auditFailureBlock.includes("status: 503"), "audit failure must stop signed URL issuance");
assert.equal(auditFailureBlock.includes("data.token"), false, "the signed upload token must not be returned when audit logging fails");
assert.equal(auditFailureBlock.includes("uploadUrl"), false, "the signed upload URL must not be returned when audit logging fails");
assert.ok(manager.includes("const presignAuditRecorded = signed.auditRecorded !== false"));
assert.match(manager, /!presignAuditRecorded/);
assert.match(adminRoute, /recordAuditSafely/);
const primaryPatchStart = adminRoute.indexOf("export async function PATCH");
const deleteStart = adminRoute.indexOf("export async function DELETE");
const primaryPatch = adminRoute.slice(primaryPatchStart, deleteStart);
assert.ok(primaryPatch.includes("admin_set_primary_site_audio_asset"));
assert.ok(primaryPatch.includes("auditRecorded: true"));
assert.equal(primaryPatch.includes("recordAuditSafely"), false, "the audited primary-switch RPC must not create a duplicate API audit event");

const deleteHandler = adminRoute.slice(deleteStart);
const cleanupScript = readFileSync("scripts/cleanup-site-audio-orphans.mjs", "utf8");
const primaryDeleteGuard = deleteHandler.indexOf("if (asset.is_primary === true)");
const deletionIntent = deleteHandler.indexOf('.from("site_audio_upload_intents").upsert');
const rowDelete = deleteHandler.indexOf('.from("site_audio_assets")\n    .delete');
const storageRemove = deleteHandler.indexOf('.storage.from("site-audio").remove');
assert.ok(primaryDeleteGuard >= 0 && primaryDeleteGuard < rowDelete, "the API must reject deletion of the current primary asset");
assert.ok(deletionIntent >= 0 && deletionIntent < rowDelete, "a durable cleanup intent must exist before the asset row is deleted");
assert.ok(deleteHandler.includes('.eq("is_primary", false)'), "the delete must recheck primary state atomically");
assert.ok(rowDelete >= 0 && storageRemove > rowDelete, "the Storage object must not be removed before the non-primary DB row is deleted");
const referenceCheck = deleteHandler.indexOf("const { data: remainingAssetReferences");
const restoreIntentStart = deleteHandler.indexOf("const { data: restoredIntent");
const restoreIntentEnd = deleteHandler.indexOf("if (restoreIntentError || !restoredIntent)", restoreIntentStart);
const restoreIntentBlock = deleteHandler.slice(restoreIntentStart, restoreIntentEnd);
assert.ok(referenceCheck >= 0 && restoreIntentStart > referenceCheck, "remaining references must be checked before restoring a shared-path intent");
assert.ok(restoreIntentBlock.includes('.eq("asset_id", asset.id)'), "the restore CAS must match the asset ID stored by the deleting intent");
assert.ok(restoreIntentBlock.includes("asset_id: survivingAsset.id"), "a surviving asset reference must restore the intent to its canonical asset ID");
assert.equal(restoreIntentBlock.includes('.is("asset_id", null)'), false, "the restore CAS must not expect null after the delete intent records the original asset ID");

const detachIntentStart = deleteHandler.indexOf("const { data: detachedIntent");
const detachIntentEnd = deleteHandler.indexOf('const { error: storageError }', detachIntentStart);
const detachIntentBlock = deleteHandler.slice(detachIntentStart, detachIntentEnd);
assert.ok(detachIntentStart > referenceCheck && detachIntentEnd > detachIntentStart, "the deleted asset pointer must be detached after the reference check");
assert.ok(detachIntentBlock.includes("asset_id: null"), "an unreferenced deleted asset must clear its stale asset_id pointer");
assert.ok(detachIntentBlock.includes('.eq("asset_id", asset.id)'), "detaching must compare-and-set the exact deleted asset ID");
assert.ok(detachIntentBlock.includes("if (detachIntentError || !detachedIntent)"), "Storage removal must fail closed when the cleanup intent cannot be detached");
assert.ok(storageRemove > detachIntentEnd, "Storage removal must occur only after the cleanup intent is safely detached");

assert.ok(cleanupScript.includes('const candidates = validatedExpiredIntents.filter((intent) => intent?.asset_id === null)'), "the retention worker must only remove detached intents with no asset pointer");
assert.ok(cleanupScript.includes('intent?.asset_id !== null'), "an intent with an asset pointer must remain protected until its canonical asset is verified");
const storageVerify = deleteHandler.indexOf('.list(storageDirectory');
const intentCleaned = deleteHandler.indexOf('status: "cleaned"');
assert.ok(storageVerify >= 0 && intentCleaned > storageVerify, "the intent must not be marked cleaned until Storage absence is verified");
assert.ok(deleteHandler.includes("storageCleanupPending"), "failed Storage removal must remain queued for safe retry");
assert.ok(manager.includes("payload.uploadIntentFinalized === false"), "the Admin UI must surface upload-intent finalization failures");
assert.ok(manager.includes("payload.storageCleanupPending"), "the Admin UI must surface deferred Storage cleanup");
assert.ok(manager.includes("disabled={busy || asset.is_primary}"), "the Admin UI must prevent deleting the current primary asset");
assert.match(manager, /payload\.auditRecorded === false/);

console.log("Site-audio upload registration and audit-result contracts passed.");
