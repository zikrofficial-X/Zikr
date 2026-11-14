import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const BUCKET = "site-audio";
const MAX_PENDING_INTENTS = 5000;
const CLEANUP_CONFIRMATION = "DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS";
const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg",
  "audio/mp4", "audio/aac", "audio/webm",
]);

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function assertExpectedSupabaseProject(supabaseUrl, expectedProjectRef) {
  const expected = asString(expectedProjectRef).toLowerCase();
  if (!/^[a-z0-9]{20}$/.test(expected)) {
    throw new Error("EXPECTED_PROJECT_REF must be the canonical 20-character Supabase project ref.");
  }
  const parsed = new URL(supabaseUrl);
  if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== expected + ".supabase.co") {
    throw new Error("Refusing site-audio cleanup for an unexpected Supabase project.");
  }
  return expected;
}

export function assertSiteAudioCleanupApplyConfirmation(apply, confirmation, writesPaused) {
  if (!apply) return;
  if (writesPaused !== true) {
    throw new Error("Refusing site-audio cleanup unless SITE_AUDIO_UPLOAD_WRITES_PAUSED=true for the entire apply window.");
  }
  if (asString(confirmation) !== CLEANUP_CONFIRMATION) {
    throw new Error("Refusing site-audio cleanup without SITE_AUDIO_CLEANUP_CONFIRMATION=" + CLEANUP_CONFIRMATION + ".");
  }
}

export function isSafeSiteAudioUploadIntent(intent) {
  const ownerId = asString(intent?.owner_user_id).toLowerCase();
  const storagePath = asString(intent?.storage_path);
  const parts = storagePath.split("/");
  const uploadExpiresAt = Date.parse(intent?.upload_expires_at ?? "");
  const cleanupAfter = Date.parse(intent?.cleanup_after ?? "");
  const mimeType = asString(intent?.mime_type).toLowerCase();
  return (
    intent?.status === "pending" &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(ownerId) &&
    parts.length === 2 &&
    parts[0] === ownerId &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}-[a-z0-9._-]{1,120}$/i.test(parts[1] ?? "") &&
    ALLOWED_MIME_TYPES.has(mimeType) &&
    Number.isSafeInteger(intent?.size_bytes) &&
    intent.size_bytes > 0 &&
    intent.size_bytes <= 52428800 &&
    Number.isFinite(uploadExpiresAt) &&
    Number.isFinite(cleanupAfter) &&
    cleanupAfter > uploadExpiresAt
  );
}

export function selectExpiredSiteAudioUploadIntents(intents, now = Date.now()) {
  const expired = (intents ?? []).filter((intent) => {
    if (intent?.status !== "pending") return false;
    const cleanupAfter = Date.parse(intent?.cleanup_after ?? "");
    return Number.isFinite(cleanupAfter) && cleanupAfter <= now;
  });
  for (const intent of expired) {
    if (!isSafeSiteAudioUploadIntent(intent)) {
      throw new Error("An expired site-audio upload intent has an unsafe path or invalid metadata; refusing cleanup.");
    }
    if (Date.parse(intent.upload_expires_at) > now) {
      throw new Error("An expired site-audio cleanup intent still has a live upload window; refusing cleanup.");
    }
  }
  return expired;
}

function splitStoragePath(storagePath) {
  const parts = storagePath.split("/");
  return { directory: parts[0], fileName: parts[1] };
}

async function updateIntent(client, storagePath, patch) {
  const { data, error } = await client
    .from("site_audio_upload_intents")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("storage_path", storagePath)
    .eq("status", "pending")
    .select("storage_path")
    .maybeSingle();
  if (error) throw new Error("Could not reconcile site-audio upload intent: " + error.message);
  return Boolean(data);
}

async function findAssetReference(client, storagePath) {
  const { data, error } = await client
    .from("site_audio_assets")
    .select("id")
    .eq("storage_path", storagePath)
    .limit(2);
  if (error) throw new Error("Could not verify site-audio metadata references: " + error.message);
  if ((data ?? []).length > 1) {
    throw new Error("Multiple site-audio metadata rows reference one upload path; refusing cleanup.");
  }
  return data?.[0] ?? null;
}

async function listExactObject(client, directory, fileName) {
  const { data, error } = await client.storage.from(BUCKET).list(directory, {
    search: fileName,
    limit: 20,
  });
  if (error) throw new Error("Could not inspect site-audio Storage path: " + error.message);
  return (data ?? []).find((object) => object.name === fileName) ?? null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  assertSiteAudioCleanupApplyConfirmation(
    apply,
    process.env.SITE_AUDIO_CLEANUP_CONFIRMATION,
    process.env.SITE_AUDIO_UPLOAD_WRITES_PAUSED === "true",
  );

  const supabaseUrl = asString(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = asString(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const expectedProjectRef = asString(process.env.EXPECTED_PROJECT_REF);
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  assertExpectedSupabaseProject(supabaseUrl, expectedProjectRef);

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const now = new Date();
  const { data, error } = await client
    .from("site_audio_upload_intents")
    .select("storage_path,owner_user_id,mime_type,size_bytes,upload_expires_at,cleanup_after,status,asset_id")
    .eq("status", "pending")
    .lte("cleanup_after", now.toISOString())
    .order("cleanup_after", { ascending: true })
    .limit(MAX_PENDING_INTENTS + 1);
  if (error) throw new Error("Could not read expired site-audio upload intents: " + error.message);
  if ((data ?? []).length > MAX_PENDING_INTENTS) {
    throw new Error("Expired site-audio upload intents exceeded the safe scan limit; refusing cleanup.");
  }

  const candidates = selectExpiredSiteAudioUploadIntents(data ?? [], now.getTime());
  console.log("ZIKR site-audio orphan reconciliation: " + (apply ? "APPLY" : "DRY RUN"));
  console.log("Expired pending intents: " + candidates.length);

  for (const intent of candidates) {
    const { directory, fileName } = splitStoragePath(intent.storage_path);
    const referencedAsset = await findAssetReference(client, intent.storage_path);
    if (referencedAsset) {
      if (apply) {
        await updateIntent(client, intent.storage_path, {
          status: "registered",
          asset_id: referencedAsset.id,
        });
      }
      console.log("KEEP referenced site-audio object: " + intent.storage_path);
      continue;
    }

    const object = await listExactObject(client, directory, fileName);
    if (!object) {
      if (apply) await updateIntent(client, intent.storage_path, { status: "cleaned", asset_id: null });
      console.log("RECONCILE missing site-audio object: " + intent.storage_path);
      continue;
    }

    const metadata = object.metadata && typeof object.metadata === "object" && !Array.isArray(object.metadata)
      ? object.metadata
      : {};
    const actualSize = Number(metadata.size ?? metadata.contentLength);
    const actualMimeType = asString(metadata.mimetype ?? metadata.contentType).toLowerCase();
    if (actualSize !== intent.size_bytes || actualMimeType !== intent.mime_type.toLowerCase()) {
      console.log("RETAIN metadata-mismatched site-audio object for manual review: " + intent.storage_path);
      continue;
    }

    if (!apply) {
      console.log("DRY RUN would remove unreferenced expired site-audio object: " + intent.storage_path);
      continue;
    }

    // Re-read both the intent and the canonical metadata table immediately before
    // deletion. The owner must keep all site-audio upload/registration writers paused.
    const { data: currentIntent, error: currentIntentError } = await client
      .from("site_audio_upload_intents")
      .select("storage_path,upload_expires_at,cleanup_after,status")
      .eq("storage_path", intent.storage_path)
      .eq("status", "pending")
      .lte("cleanup_after", now.toISOString())
      .maybeSingle();
    if (currentIntentError) throw new Error("Could not recheck site-audio intent: " + currentIntentError.message);
    if (!currentIntent || Date.parse(currentIntent.upload_expires_at) > now.getTime()) {
      console.log("SKIP changed or unexpired site-audio intent: " + intent.storage_path);
      continue;
    }

    const latestReference = await findAssetReference(client, intent.storage_path);
    if (latestReference) {
      await updateIntent(client, intent.storage_path, {
        status: "registered",
        asset_id: latestReference.id,
      });
      console.log("KEEP newly referenced site-audio object: " + intent.storage_path);
      continue;
    }

    const { error: removeError } = await client.storage.from(BUCKET).remove([intent.storage_path]);
    if (removeError) throw new Error("Site-audio Storage removal failed: " + removeError.message);

    const remaining = await listExactObject(client, directory, fileName);
    if (remaining) {
      throw new Error("Site-audio Storage object is still present after removal; intent remains pending.");
    }

    await updateIntent(client, intent.storage_path, { status: "cleaned", asset_id: null });
    console.log("REMOVED verified unreferenced site-audio object: " + intent.storage_path);
  }

  console.log("Site-audio orphan reconciliation completed; no non-site-audio bucket or asset was inspected.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("[site-audio-orphan-retention] FAILED:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
