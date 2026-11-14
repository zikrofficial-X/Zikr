import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertExpectedSupabaseProject,
  assertSiteAudioCleanupApplyConfirmation,
  collectExpiredSiteAudioUploadIntents,
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

assert.equal(assertExpectedSupabaseProject("https://zqtssvlvmkzeeyqghqfk.supabase.co", "zqtssvlvmkzeeyqghqfk"), "zqtssvlvmkzeeyqghqfk");
assert.throws(() => assertExpectedSupabaseProject("https://other.supabase.co", "zqtssvlvmkzeeyqghqfk"), /unexpected Supabase project/);
assert.doesNotThrow(() => assertSiteAudioCleanupApplyConfirmation(false, "", false));
assert.throws(() => assertSiteAudioCleanupApplyConfirmation(true, "DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS", false), /SITE_AUDIO_UPLOAD_WRITES_PAUSED=true/);
assert.throws(() => assertSiteAudioCleanupApplyConfirmation(true, "wrong", true), /DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS/);
assert.doesNotThrow(() => assertSiteAudioCleanupApplyConfirmation(true, "DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS", true));
assert.equal(isSafeSiteAudioUploadIntent(validIntent), true);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, storage_path: ownerId + "/../recording.mp3" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, owner_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, mime_type: "application/pdf" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, size_bytes: 0 }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, cleanup_after: "2026-11-11T00:00:00.000Z" }), false);
assert.equal(isSafeSiteAudioUploadIntent({ ...validIntent, cleanup_after: "2026-11-13T21:59:59.000Z" }), false, "the cleanup worker must preserve the full 24-hour grace period");
const protectedAssetIntent = { ...validIntent, asset_id: "123e4567-e89b-12d3-a456-426614174001" };
assert.equal(isSafeSiteAudioUploadIntent(protectedAssetIntent), false, "a pending intent with an asset pointer must never be a Storage deletion candidate");
assert.deepEqual(
  selectExpiredSiteAudioUploadIntents([validIntent, protectedAssetIntent], now),
  [validIntent],
  "a failed metadata deletion may leave a protected intent; it must be preserved without blocking unrelated safe candidates",
);
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
assert.deepEqual(selectExpiredSiteAudioUploadIntents([{ ...validIntent, status: "registered" }], now), []);
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
assert.match(cleanupScript, /SITE_AUDIO_CLEANUP_CONFIRMATION/);
assert.match(cleanupScript, /SITE_AUDIO_UPLOAD_WRITES_PAUSED/);
assert.ok(cleanupScript.indexOf('from("site_audio_assets")') < cleanupScript.indexOf('.remove([intent.storage_path])'), "the canonical asset reference must be checked before exact-path deletion");
assert.ok(cleanupScript.includes("const protectedIntents = expiredIntents.filter"), "expired intents with an asset pointer must be reconciled separately from Storage deletion candidates");
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
assert.match(workflow, /workflow_dispatch:/);
assert.ok(workflow.includes("${{ secrets.SUPABASE_SERVICE_ROLE_KEY"), "GitHub expressions must remain executable in the manual workflow");
assert.ok(workflow.includes("${{ inputs.confirmation }}"), "manual confirmation input must be passed through to the cleanup process");
assert.ok(workflow.includes("${SITE_AUDIO_UPLOAD_WRITES_PAUSED}"), "the shell must evaluate the write-freeze confirmation");
assert.equal(workflow.includes("\\${{"), false, "GitHub expressions must not be escaped as literal text");
assert.doesNotMatch(workflow, /^\s*schedule:/m, "orphan cleanup must not run on a timer");
assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
assert.match(workflow, /inputs\.apply == true/);
assert.match(workflow, /DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS/);
assert.match(workflow, /SITE_AUDIO_UPLOAD_WRITES_PAUSED/);

console.log("Site-audio upload-intent and reference-checked orphan-retention contracts passed.");
