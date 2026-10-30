import { createClient } from "@supabase/supabase-js";

const VIDEO_BUCKET = "videos";
const ANDROID_BUCKET = "android-releases";
const VIDEO_PREFIX = "automated";
const VIDEO_RETENTION_HOURS = 48;
const REQUIRED_ANDROID_ASSETS = [
  "app-release.apk",
  "app-release.aab",
  "release-metadata.json",
  "SHA256SUMS",
];
const GITHUB_RELEASES_API =
  "https://api.github.com/repos/zikrofficial-X/Zikr/releases/tags";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function hasConfirmedPlatformResults(targetPlatforms, metadata) {
  if (!Array.isArray(targetPlatforms) || targetPlatforms.length === 0) return false;
  const results = asObject(asObject(metadata).platformResults);
  return targetPlatforms.every((platform) => {
    if (typeof platform !== "string" || !platform.trim()) return false;
    const result = asObject(results[platform]);
    return result.ok === true && Boolean(asString(result.remoteId));
  });
}

export function extractManagedVideoPath(value, supabaseUrl) {
  try {
    const parsed = new URL(value);
    const base = new URL(supabaseUrl);
    if (parsed.protocol !== "https:" || parsed.hostname !== base.hostname) return null;
    const prefix = "/storage/v1/object/public/videos/";
    if (!parsed.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    if (!path.startsWith("automated/") || path.includes("\\0")) return null;
    if (path.split("/").some((part) => part === "." || part === "..")) return null;
    return path;
  } catch {
    return null;
  }
}

export function isEligiblePublishedQueueItem(item, cutoffIso, supabaseUrl) {
  if (!item || item.status !== "published") return false;
  if (!item.published_at || !(Date.parse(item.published_at) < Date.parse(cutoffIso))) return false;
  if (!hasConfirmedPlatformResults(item.target_platforms, item.metadata)) return false;
  return Boolean(extractManagedVideoPath(item.video_url, supabaseUrl));
}

export function compareSemverTags(a, b) {
  const parse = (value) => {
    const match = /^v?(\\d+)\\.(\\d+)\\.(\\d+)$/.exec(String(value ?? ""));
    return match ? match.slice(1).map(Number) : null;
  };
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return 0;
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

export function selectProtectedAndroidTags(availableTags, pinnedTag) {
  const valid = [...new Set(availableTags.filter((tag) => /^v\\d+\\.\\d+\\.\\d+$/.test(tag)))];
  valid.sort((a, b) => compareSemverTags(b, a));
  const protectedTags = new Set(valid.slice(0, 2));
  if (pinnedTag) protectedTags.add(pinnedTag);
  // v1.1.3 has no GitHub Release binaries; keep it until an external backup exists.
  protectedTags.add("v1.1.3");
  return protectedTags;
}

function assertEnv() {
  const supabaseUrl = asString(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = asString(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  if (!/^https:\\/\\//.test(supabaseUrl)) throw new Error("SUPABASE_URL must use HTTPS.");
  return { supabaseUrl: supabaseUrl.replace(/\\/$/, ""), serviceRoleKey };
}

async function listDirectory(client, bucket, prefix) {
  const rows = [];
  for (let offset = 0; offset < 5000; offset += 1000) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Storage list failed for ${bucket}/${prefix}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function readSmallStorageText(client, bucket, path, maxBytes = 128 * 1024) {
  const { data, error } = await client.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Cannot read required backup file ${bucket}/${path}: ${error?.message ?? "empty response"}`);
  if (data.size > maxBytes) throw new Error(`Refusing unexpectedly large metadata file: ${bucket}/${path}`);
  return await data.text();
}

async function githubRelease(tag) {
  const token = asString(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  const response = await fetch(`${GITHUB_RELEASES_API}/${encodeURIComponent(tag)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ZIKR-Storage-Retention",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GitHub Release lookup failed for ${tag}: HTTP ${response.status}`);
  return await response.json();
}

async function verifyAndroidReleaseCopy(client, version, storageFiles) {
  const release = await githubRelease(version);
  if (release.draft || release.prerelease || release.tag_name !== version) {
    return { ok: false, reason: "GitHub release is not a published stable release." };
  }

  const assets = new Map((release.assets ?? []).map((asset) => [asset.name, asset]));
  for (const name of REQUIRED_ANDROID_ASSETS) {
    if (!assets.has(name)) return { ok: false, reason: `GitHub release missing ${name}.` };
  }

  const stored = new Map(storageFiles.map((item) => [item.name, item]));
  for (const name of REQUIRED_ANDROID_ASSETS) {
    const storedFile = stored.get(name);
    const githubFile = assets.get(name);
    if (!storedFile || Number(storedFile.metadata?.size ?? 0) !== Number(githubFile.size ?? -1)) {
      return { ok: false, reason: `Storage/GitHub size mismatch for ${name}.` };
    }
  }

  const metadataText = await readSmallStorageText(
    client,
    ANDROID_BUCKET,
    `android/${version}/release-metadata.json`,
  );
  const checksumText = await readSmallStorageText(
    client,
    ANDROID_BUCKET,
    `android/${version}/SHA256SUMS`,
  );
  let metadata;
  try {
    metadata = JSON.parse(metadataText);
  } catch {
    return { ok: false, reason: "Stored release-metadata.json is invalid JSON." };
  }

  const apkDigest = assets.get("app-release.apk")?.digest ?? "";
  const aabDigest = assets.get("app-release.aab")?.digest ?? "";
  const expectedApk = `sha256:${asString(metadata.apkSha256).toLowerCase()}`;
  const expectedAab = `sha256:${asString(metadata.aabSha256).toLowerCase()}`;
  if (!/^sha256:[a-f0-9]{64}$/.test(apkDigest) || apkDigest !== expectedApk) {
    return { ok: false, reason: "Stored APK checksum metadata does not match GitHub release digest." };
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(aabDigest) || aabDigest !== expectedAab) {
    return { ok: false, reason: "Stored AAB checksum metadata does not match GitHub release digest." };
  }
  if (!checksumText.includes(apkDigest.slice(7)) || !checksumText.includes(aabDigest.slice(7))) {
    return { ok: false, reason: "Stored SHA256SUMS does not contain both GitHub release digests." };
  }
  if (metadata.tag !== version || metadata.applicationId !== "com.zikr.app") {
    return { ok: false, reason: "Release metadata tag/applicationId mismatch." };
  }
  return { ok: true, reason: "GitHub Release assets and stored checksums match." };
}

async function findUnexpectedVideoReferences(client, path, publicUrl, requestId, queueId) {
  const checks = [
    ["kids_content", "video_url", publicUrl],
    ["videos", "thumbnail_url", publicUrl],
    ["media_assets", "storage_path", path],
    ["media_assets", "url", publicUrl],
    ["social_sync_jobs", "source_media_path", path],
    ["social_sync_jobs", "source_media_url", publicUrl],
    ["quran_audio", "storage_path", path],
    ["site_audio_assets", "storage_path", path],
  ];
  for (const [table, column, value] of checks) {
    const { data, error } = await client.from(table).select("id").eq(column, value).limit(1);
    if (error) throw new Error(`Reference check failed for ${table}.${column}: ${error.message}`);
    if (data?.length) return `${table}.${column}`;
  }

  const { data: otherRequests, error: requestError } = await client
    .from("video_generation_requests")
    .select("id")
    .eq("video_url", publicUrl)
    .neq("id", requestId)
    .limit(1);
  if (requestError) throw new Error(`Video request reference check failed: ${requestError.message}`);
  if (otherRequests?.length) return "another video_generation_requests row";

  const { data: otherQueue, error: queueError } = await client
    .from("social_publish_queue")
    .select("id")
    .eq("video_url", publicUrl)
    .neq("id", queueId)
    .limit(1);
  if (queueError) throw new Error(`Social queue reference check failed: ${queueError.message}`);
  if (otherQueue?.length) return "another social_publish_queue row";
  return null;
}

async function getAndroidPinnedTag(client) {
  const { data, error } = await client
    .from("site_settings")
    .select("value")
    .eq("key", "android_release")
    .maybeSingle();
  if (error) throw new Error(`Cannot read active Android release setting: ${error.message}`);
  const value = asObject(data?.value);
  return asString(value.releaseTag);
}

async function updateVideoRecords(client, candidate, retention) {
  const queueMetadata = {
    ...asObject(candidate.queue.metadata),
    storageRetention: retention,
  };
  const requestContent = {
    ...asObject(candidate.request.content),
    storageRetention: retention,
  };

  const { data: queueUpdated, error: queueError } = await client
    .from("social_publish_queue")
    .update({ video_url: null, metadata: queueMetadata, updated_at: new Date().toISOString() })
    .eq("id", candidate.queue.id)
    .eq("video_url", candidate.queue.video_url)
    .eq("status", "published")
    .select("id");
  if (queueError || queueUpdated?.length !== 1) {
    throw new Error(`Could not safely finalize social queue row ${candidate.queue.id}: ${queueError?.message ?? "row count mismatch"}`);
  }

  const { data: requestUpdated, error: requestError } = await client
    .from("video_generation_requests")
    .update({ video_url: null, content: requestContent, updated_at: new Date().toISOString() })
    .eq("id", candidate.request.id)
    .eq("video_url", candidate.request.video_url)
    .eq("status", "completed")
    .select("id");
  if (requestError || requestUpdated?.length !== 1) {
    throw new Error(`Could not safely finalize video request row ${candidate.request.id}: ${requestError?.message ?? "row count mismatch"}`);
  }
}

async function updateAndroidBucketRows(client, paths) {
  if (!paths.length) return;
  const { error } = await client.storage.from(ANDROID_BUCKET).remove(paths);
  if (error) throw new Error(`Android Storage remove failed: ${error.message}`);
}

async function main() {
  const { supabaseUrl, serviceRoleKey } = assertEnv();
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const apply = process.argv.includes("--apply");
  const now = new Date();
  const cutoff = new Date(now.getTime() - VIDEO_RETENTION_HOURS * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString();

  console.log(`ZIKR Storage retention: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Video retention cutoff: ${cutoffIso}`);

  const [queueResult, requestResult, videoFiles, androidRoot] = await Promise.all([
    client.from("social_publish_queue")
      .select("id,content_id,video_url,target_platforms,status,published_at,metadata")
      .not("video_url", "is", null)
      .range(0, 999),
    client.from("video_generation_requests")
      .select("id,status,video_url,content")
      .not("video_url", "is", null)
      .range(0, 999),
    listDirectory(client, VIDEO_BUCKET, VIDEO_PREFIX),
    listDirectory(client, ANDROID_BUCKET, "android"),
  ]);
  if (queueResult.error) throw new Error(`Cannot read social publish queue: ${queueResult.error.message}`);
  if (requestResult.error) throw new Error(`Cannot read video generation requests: ${requestResult.error.message}`);

  const queueRows = queueResult.data ?? [];
  const requestRows = requestResult.data ?? [];
  const requestById = new Map(requestRows.map((row) => [row.id, row]));
  const filesByPath = new Map(
    videoFiles
      .filter((file) => file.id && file.name?.endsWith(".mp4"))
      .map((file) => [`${VIDEO_PREFIX}/${file.name}`, file]),
  );
  const queueByUrl = new Map();
  for (const row of queueRows) {
    if (!row.video_url) continue;
    queueByUrl.set(row.video_url, (queueByUrl.get(row.video_url) ?? 0) + 1);
  }

  const candidates = [];
  const skipped = [];
  for (const row of queueRows) {
    if (!isEligiblePublishedQueueItem(row, cutoffIso, supabaseUrl)) continue;
    const path = extractManagedVideoPath(row.video_url, supabaseUrl);
    if (queueByUrl.get(row.video_url) !== 1) {
      skipped.push({ id: row.id, reason: "Duplicate social queue URL." });
      continue;
    }
    const request = requestById.get(row.content_id);
    if (!request || request.status !== "completed" || request.video_url !== row.video_url) {
      skipped.push({ id: row.id, reason: "No exact completed video-generation record." });
      continue;
    }
    if (!request.content || typeof request.content !== "object" || Array.isArray(request.content)) {
      skipped.push({ id: row.id, reason: "Video request content is not a JSON object." });
      continue;
    }
    const file = filesByPath.get(path);
    if (!file) {
      skipped.push({ id: row.id, reason: "Storage object already missing; no new deletion attempted." });
      continue;
    }
    const unexpectedReference = await findUnexpectedVideoReferences(
      client, path, row.video_url, request.id, row.id,
    );
    if (unexpectedReference) {
      skipped.push({ id: row.id, reason: `Unexpected live reference: ${unexpectedReference}.` });
      continue;
    }
    candidates.push({
      queue: row,
      request,
      path,
      bytes: Number(file.metadata?.size ?? 0),
      publishedAt: row.published_at,
    });
  }

  const totalVideoBytes = candidates.reduce((sum, item) => sum + item.bytes, 0);
  console.log(
    `Video candidates: ${candidates.length} objects / ${(totalVideoBytes / 1024 / 1024).toFixed(2)} MiB; skipped: ${skipped.length}.`,
  );
  for (const item of skipped.slice(0, 20)) {
    console.log(`SKIP video queue ${item.id}: ${item.reason}`);
  }

  const pinnedTag = await getAndroidPinnedTag(client);
  const androidVersions = androidRoot
    .filter((item) => /^v\\d+\\.\\d+\\.\\d+$/.test(item.name ?? ""))
    .map((item) => item.name)
    .sort((a, b) => compareSemverTags(b, a));
  const protectedTags = selectProtectedAndroidTags(androidVersions, pinnedTag);
  const androidDeletes = [];
  const androidVersionFiles = new Map();

  for (const version of androidVersions) {
    if (protectedTags.has(version)) continue;
    const versionFiles = await listDirectory(client, ANDROID_BUCKET, `android/${version}`);
    androidVersionFiles.set(version, versionFiles);
    const verification = await verifyAndroidReleaseCopy(client, version, versionFiles);
    if (!verification.ok) {
      console.log(`KEEP Android ${version}: ${verification.reason}`);
      continue;
    }
    const paths = versionFiles
      .filter((file) => file.id && REQUIRED_ANDROID_ASSETS.includes(file.name))
      .map((file) => `android/${version}/${file.name}`);
    if (paths.length !== REQUIRED_ANDROID_ASSETS.length) {
      console.log(`KEEP Android ${version}: incomplete Storage folder.`);
      continue;
    }
    androidDeletes.push({ version, paths, verification: verification.reason });
  }

  const androidBytes = androidDeletes.reduce((sum, item) => {
    const files = androidVersionFiles.get(item.version) ?? [];
    return sum + files
      .filter((file) => file.id && REQUIRED_ANDROID_ASSETS.includes(file.name))
      .reduce((versionSum, file) => versionSum + Number(file.metadata?.size ?? 0), 0);
  }, 0);
  console.log(
    `Android copies eligible: ${androidDeletes.map((item) => item.version).join(", ") || "none"}.`,
  );
  console.log(`Active Android tag: ${pinnedTag || "unset"}; protected: ${[...protectedTags].join(", ")}.`);
  console.log(
    `Expected storage reduction: at least ${(totalVideoBytes / 1024 / 1024).toFixed(2)} MiB from videos plus verified Android versions.`,
  );

  if (!apply) {
    console.log("DRY RUN COMPLETE: no Storage objects or database rows were changed.");
    return;
  }

  // Video files are deleted only after every target platform has a confirmed remote ID,
  // the publish time is older than 48 hours, and all relevant database references match.
  for (let offset = 0; offset < candidates.length; offset += 100) {
    const batch = candidates.slice(offset, offset + 100);
    const paths = batch.map((item) => item.path);
    const { error } = await client.storage.from(VIDEO_BUCKET).remove(paths);
    if (error) throw new Error(`Video Storage remove failed for batch ${offset / 100 + 1}: ${error.message}`);

    for (const item of batch) {
      const retention = {
        state: "purged",
        bucket: VIDEO_BUCKET,
        path: item.path,
        purgedAt: new Date().toISOString(),
        publishedAt: item.publishedAt,
        reason: "All targeted social platforms have confirmed remote IDs; local source retained for at least 48 hours.",
        bytes: item.bytes,
        confirmedPlatforms: item.queue.target_platforms.map((platform) => ({
          platform,
          remoteId: asString(asObject(asObject(item.queue.metadata).platformResults)[platform]?.remoteId),
        })),
      };
      await updateVideoRecords(client, item, retention);
    }
    console.log(`Purged and reconciled video batch ${offset / 100 + 1}: ${batch.length} objects.`);
  }

  for (const version of androidDeletes) {
    await updateAndroidBucketRows(client, version.paths);
    console.log(`Purged verified Android Storage duplicate ${version.version}; GitHub Release remains the download backup.`);
  }

  const remainingVideos = await listDirectory(client, VIDEO_BUCKET, VIDEO_PREFIX);
  const remainingAndroidFolders = await listDirectory(client, ANDROID_BUCKET, "android");
  const remainingVideoCount = remainingVideos.filter((file) => file.id && file.name?.endsWith(".mp4")).length;
  console.log(`Post-cleanup verification: ${remainingVideoCount} video objects remain in Storage.`);
  console.log(`Post-cleanup Android release folders: ${remainingAndroidFolders.filter((item) => /^v\\d+\\.\\d+\\.\\d+$/.test(item.name ?? "")).map((item) => item.name).join(", ")}.`);
  console.log("ZIKR Storage retention completed.");
}

main().catch((error) => {
  console.error("[storage-retention] FAILED:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
