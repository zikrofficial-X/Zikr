import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertExpectedSupabaseProject,
  assertSiteAudioCleanupApplyConfirmation,
  collectExpiredSiteAudioUploadIntents,
  fingerprintSiteAudioStoragePath,
  isSafeSiteAudioUploadIntent,
  selectExpiredSiteAudioUploadIntents,
} from "../cleanup-site-audio-orphans.mjs";

const ownerId = "2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d";
const fileName = "123e4567-e89b-12d3-a456-426614174000-recording.mp3";
const now = Date.parse("2026-11-14T00:00:00.000Z");
const validIntent = {
  storage_path: ownerId + "/" + fileName,
  owner_user_id: ownerId,
  mime_type: "audio/mpeg",
  size_bytes: 4096,
  upload_expires_at: "2026-11-12T22:00:00.000Z",
  cleanup_after: "2026-11-13T22:00:00.000Z",
  status: "pending",
  asset_id: null,
};
const deletingIntent = { ...validIntent, status: "deleting" };
const detachedRegisteredIntent = { ...validIntent, status: "registered" };

assert.equal(assertExpectedSupabaseProject("https://zqtssvlvmkzeeyqghqfk.supabase.co", "zqtssvlvmkzeeyqghqfk"), "zqtssvlvmkzeeyqghqfk");
assert.throws(() => assertExpectedSupabaseProject("https://other.supabase.co", "zqtssvlvmkzeeyqghqfk"), /unexpected Supabase project/);
assert.doesNotThrow(() => assertSiteAudioCleanupApplyConfirmation(false, "", false));
assert.throws(() => assertSiteAudioCleanupApplyConfirmation(true, "DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS", false), /SITE_AUDIO_UPLOAD_WRITES_PAUSED=true/);
assert.throws(() => assertSiteAudioCleanupApplyConfirmation(true, "wrong", true), /DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS/);
assert.doesNotThrow(() => assertSiteAudioCleanupApplyConfirmation(true, "DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS", true));
assert.equal(isSafeSiteAudioUploadIntent(validIntent), true);
assert.equal(isSafeSiteAudioUploadIntent(deletingIntent), true, "a delete-locked intent with no asset pointer is eligible after its grace period");
assert.equal(isSafeSiteAudioUploadIntent(detachedRegisteredIntent), true, "a detached registered intent is eligible only when asset_id is null");
const pathFingerprint = fingerprintSiteAudioStoragePath(validIntent.storage_path);
assert.match(pathFingerprint, /^[a-f0-9]{16}$/);
assert.equal(pathFingerprint.includes(ownerId), false);
assert.equal(pathFingerprint.includes(fileName), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, storage_path: ownerId + "/../recording.mp3" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, owner_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, mime_type: "application/pdf" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, size_bytes: 0 }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, cleanup_after: "2026-11-11T00:00:00.000Z" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, cleanup_after: "2026-11-13T21:59:59.000Z" }), false, "the cleanup worker must preserve the full 24-hour grace period");
const protectedAssetIntent = { ...validIntent, asset_id: "123e4567-e89b-12d3-a456-426614174001" };
assert.equal(isSafeSiteAudioUploadIntent(protectedAssetIntent), false, "a pending intent with an asset pointer must never be a Storage deletion candidate");
assert.deepEqual(
  selectExpiredSiteAudioUploadIntents([validIntent, deletingIntent, detachedRegisteredIntent, protectedAssetIntent], now),
  [validIntent, deletingIntent, detachedRegisteredIntent, protectedAssetIntent],
  "the expired inventory must retain protected asset-pointer rows so the worker can reconcile them separately",
);
assert.equal(isSafeSiteAudioUploadIntent(protectedAssetIntent), false, "protected rows are never Storage deletion candidates");
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, asset_id: "not-a-uuid" }), false, "asset pointers must be canonical UUIDs");
const pagedRows = Array.from({ length: 1001 }, (_, index) => ({ index }));
const pageOffsets = [];
const pagedInventory = await collectExpiredSiteAudioUploadIntents(async (offset, pageSize) => {
  pageOffsets.push(offset);
  assert.equal(pageSize, 500);
  return pagedRows.slice(offset, offset + pageSize);
});
assert.equal(pagedInventory.length, 1001, "the inventory reader must cross the Supabase 1,000-row API ceiling");
assert.deepEqual(pageOffsets, [0, 500, 1000]);
await assert.rejects(
  () => collectExpiredSiteAudioUploadIntents(async (offset, pageSize) =>
    Array.from({ length: 5001 }, (_, index) => ({ index })).slice(offset, offset + pageSize),
  ),
  /exceeded the safe scan limit/,
  "the global 5,000-intent cap must be enforced across pages",
);

assert.deepEqual(selectExpiredSiteAudioUploadIntents([validIntent], now), [validIntent]);
assert.deepEqual(selectExpiredSiteAudioUploadIntents([{ ...validIntent, status: "registered", asset_id: "123e4567-e89b-12d3-a456-426614174001" }], now), [{ ...validIntent, status: "registered", asset_id: "123e4567-e89b-12d3-a456-426614174001" }], "a registered intent with a live asset pointer remains in the protected inventory, not the deletion candidates");
assert.deepEqual(selectExpiredSiteAudioUploadIntents([{ ...validIntent, cleanup_after: "2026-11-15T00:00:00.000Z" }], now), []);
assert.throws(() => selectExpiredSiteAudioUploadIntents([{ ...validIntent, storage_path: ownerId + "/../../other" }], now), /unsafe path or invalid metadata/);
assert.throws(() => selectExpiredSiteAudioUploadIntents([{ ...validIntent, cleanup_after: "2026-11-11T00:00:00.000Z" }], now), /unsafe path or invalid metadata/);

const uploadRoute = readFileSync("src/app/api/admin/site-audio/upload/route.ts", "utf8");
const adminRoute = readFileSync("src/app/api/admin/site-audio/route.ts", "utf8");
const cleanupScript = readFileSync("scripts/cleanup-site-audio-orphans.mjs", "utf8");
const workflow = readFileSync(".github/workflows/site-audio-orphan-retention.yml", "utf8");
const migrationText = readFileSync("supabase/migrations/20261114000000_site_audio_upload_intents.sql", "utf8");

assert.ok(uploadRoute.indexOf("site_audio_upload_intents") < uploadRoute.indexOf("createSignedUploadUrl"), "the intent must exist before a signed upload URL is issued");
assert.match(uploadRoute, /SIGNED_UPLOAD_URL_TTL_SECONDS/);
assert.match(adminRoute, /site_audio_upload_intents/);
const adminPostStart = adminRoute.indexOf("export async function POST");
const adminPostEnd = adminRoute.indexOf("export async function PATCH", adminPostStart);
const adminPost = adminRoute.slice(adminPostStart, adminPostEnd);
assert.ok(adminPost.indexOf("upload_expires_at") < adminPost.indexOf("validateSiteAudioStorageObject"), "the registration route must reject expired intents before checking Storage");
assert.ok(adminPost.indexOf('.from("site_audio_assets")') < adminPost.indexOf('status: "registered"'), "the asset row must be authoritative before an intent is marked registered");
assert.match(adminPost, /asset_id=is\\.null/);
assert.match(adminPost, /Prefer: "return=representation"/);
assert.ok(adminPost.includes("finalizedIntent.length === 1"), "registration must confirm exactly one pending intent was finalized");
assert.ok(adminPost.includes('.delete()') && adminPost.includes('.eq("id", data.id)'), "a failed intent compare-and-set must roll back the row created by this request");
assert.ok(adminPost.indexOf("const auditRecorded") > adminPost.indexOf("uploadIntentFinalized"), "the success audit event must follow successful intent finalization");
const adminDeleteStart = adminRoute.indexOf("export async function DELETE");
const adminDelete = adminRoute.slice(adminDeleteStart);
assert.match(adminDelete, /status: "deleting"/, "delete must lock the intent before removing the asset row");
assert.match(adminDelete, /\\.eq\\("status", "deleting"\\)/);
assert.ok(adminDelete.indexOf('.from("site_audio_assets")') < adminDelete.indexOf('.remove([asset.storage_path])'), "the delete route must recheck references before removing Storage bytes");
const cleanupLogLines = cleanupScript.split(/\r?\n/).filter((line) => line.includes("console.log("));
assert.ok(cleanupLogLines.every((line) => !line.includes("intent.storage_path") || line.includes("safePathLogReference(intent.storage_path)")), "public workflow logs must use a path fingerprint instead of owner UUIDs or uploaded filenames");
assert.match(cleanupScript, /SITE_AUDIO_CLEANUP_CONFIRMATION/);
assert.match(cleanupScript, /SITE_AUDIO_UPLOAD_WRITES_PAUSED/);
assert.ok(cleanupScript.indexOf('from("site_audio_assets")') < cleanupScript.indexOf('.remove([intent.storage_path])'), "the canonical asset reference must be checked before exact-path deletion");
assert.ok(cleanupScript.includes("const protectedIntents = expiredIntents.filter"), "expired intents with an asset pointer must be reconciled separately from Storage deletion candidates");
assert.ok(cleanupScript.includes(".filter((intent) => intent?.asset_id === null)"), "only detached intents may enter the Storage deletion loop");
assert.ok(cleanupScript.includes("status.in.(pending,deleting),and(status.eq.registered,asset_id.is.null)"), "the worker must include delete-locked and detached registered intents without scanning live registered assets");
assert.ok(cleanupScript.includes('.eq("status", expectedStatus)'), "intent state changes must use compare-and-set updates");
assert.ok(cleanupScript.includes("referencedAsset.id !== intent.asset_id"), "protected intents must match the exact canonical asset ID before being marked registered");
assert.match(cleanupScript, /listExactObject\(client, directory, fileName\)/);
assert.ok(cleanupScript.includes(".range(offset, offset + pageSize - 1)"), "intent inventory must use bounded pages instead of the PostgREST max_rows-limited single query");
assert.ok(cleanupScript.includes('.order("storage_path", { ascending: true })'), "intent pages must use a stable tie-breaker");
await assert.rejects(
  () => collectExpiredSiteAudioUploadIntents(async () => null),
  /page was invalid/,
  "an invalid page must fail closed",
);
assert.match(migrationText, /ENABLE ROW LEVEL SECURITY/);
assert.match(migrationText, /REVOKE ALL ON TABLE public\.site_audio_upload_intents FROM PUBLIC, anon, authenticated/);
assert.match(migrationText, /cleanup_after >= upload_expires_at \+ interval '24 hours'/, "the database must enforce the same 24-hour cleanup grace period");
assert.match(migrationText, /GRANT ALL ON TABLE public\.site_audio_upload_intents TO service_role/);
assert.ok(migrationText.includes("CHECK (status IN ('pending', 'registered', 'deleting', 'cleaned'))"), "the database state machine must include an explicit deleting lock");
assert.ok(migrationText.includes("status = 'registered' AND asset_id IS NULL"), "detached registered rows must be indexed for safe orphan reconciliation");
assert.match(workflow, /workflow_dispatch:/);
const siteAudioJobEnvStart = workflow.indexOf("    env:");
const siteAudioStepsStart = workflow.indexOf("    steps:", siteAudioJobEnvStart);
const siteAudioJobEnv = workflow.slice(siteAudioJobEnvStart, siteAudioStepsStart);
assert.doesNotMatch(siteAudioJobEnv, /SUPABASE_SERVICE_ROLE_KEY/, "the service-role key must not be exposed to dependency installation or tests through job-level env");
const siteAudioInstallStart = workflow.indexOf("- name: Install runtime dependencies");
const siteAudioInstallEnd = workflow.indexOf("- name: Verify site-audio cleanup safety tests", siteAudioInstallStart);
assert.doesNotMatch(workflow.slice(siteAudioInstallStart, siteAudioInstallEnd), /SUPABASE_SERVICE_ROLE_KEY/);
const siteAudioSafetyTestStart = workflow.indexOf("- name: Verify site-audio cleanup safety tests");
const siteAudioDryRunStart = workflow.indexOf("- name: Print redacted site-audio cleanup plan (dry run)");
const siteAudioApplyStart = workflow.indexOf("- name: Apply manually approved site-audio orphan cleanup", siteAudioDryRunStart);
assert.doesNotMatch(workflow.slice(siteAudioSafetyTestStart, siteAudioDryRunStart), /SUPABASE_SERVICE_ROLE_KEY/, "safety tests must run without production credentials");
assert.match(workflow.slice(siteAudioDryRunStart, siteAudioApplyStart), /SUPABASE_SERVICE_ROLE_KEY/, "read-only cleanup preview must receive the key only in its step scope");
assert.match(workflow.slice(siteAudioApplyStart), /SUPABASE_SERVICE_ROLE_KEY/, "approved cleanup must receive the key only in its step scope");
assert.ok(workflow.includes("${{ secrets.SUPABASE_SERVICE_ROLE_KEY"), "the service-role key must be scoped to explicit runtime steps");
assert.ok(workflow.includes("${{ inputs.confirmation }}"), "manual confirmation input must be passed through to the cleanup process");
assert.ok(workflow.includes("${SITE_AUDIO_UPLOAD_WRITES_PAUSED}"), "the shell must evaluate the write-freeze confirmation");
assert.equal(workflow.includes("\\${{"), false, "GitHub expressions must not be escaped as literal text");
assert.doesNotMatch(workflow, /^\s*schedule:/m, "orphan cleanup must not run on a timer");
assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
assert.match(workflow, /inputs\.apply == true/);
assert.match(workflow, /DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS/);
assert.match(workflow, /SITE_AUDIO_UPLOAD_WRITES_PAUSED/);

console.log("Site-audio upload-intent and reference-checked orphan-retention contracts passed.");
