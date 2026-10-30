import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
    if (parsed.protocol !== "https:" || parsed.origin !== base.origin) return null;
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
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(value ?? ""));
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

export function selectProtectedAndroidTags(availableTags, pinnedTag, referencedTags = []) {
  const valid = [...new Set(availableTags.filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag)))];
  valid.sort((a, b) => compareSemverTags(b, a));
  const protectedTags = new Set(valid.slice(0, 2));
  if (pinnedTag) protectedTags.add(pinnedTag);
  for (const tag of referencedTags) {
    if (/^v\d+\.\d+\.\d+$/.test(tag)) protectedTags.add(tag);
  }
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
  const parsedUrl = new URL(supabaseUrl);
  if (parsedUrl.protocol !== "https:") throw new Error("SUPABASE_URL must use HTTPS.");
  return { supabaseUrl: supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl, serviceRoleKey };
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

  // Verify the actual Supabase APK/AAB bytes, not just metadata and file size.
  // GitHub's published release remains the independent, externally retained copy.
  for (const [name, expectedDigest] of [
    ["app-release.apk", apkDigest],
    ["app-release.aab", aabDigest],
  ]) {
    const { data: binary, error: binaryError } = await client.storage
      .from(ANDROID_BUCKET)
      .download(`android/${version}/${name}`);
    if (binaryError || !binary) {
      return { ok: false, reason: `Cannot download Supabase backup ${name}: ${binaryError?.message ?? "empty response"}.` };
    }
    const actualDigest = `sha256:${createHash("sha256").update(Buffer.from(await binary.arrayBuffer())).digest("hex")}`;
    if (actualDigest !== expectedDigest) {
      return { ok: false, reason: `Actual Supabase binary SHA256 does not match the published GitHub ${name}.` };
    }
  }
  return { ok: true, reason: "GitHub Release assets, stored checksums, and actual Supabase APK/AAB bytes match." };
}

async function loadUnexpectedVideoReferences(client, candidatePaths, supabaseUrl) {
  const patterns = [
    {
      table: "kids_content",
      column: "video_url",
      filter: (query) => query.ilike("video_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "kids_content",
      column: "featured_image_url",
      filter: (query) => query.ilike("featured_image_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "media_assets",
      column: "storage_path",
      filter: (query) => query.like("storage_path", "automated/%"),
    },
    {
      table: "media_assets",
      column: "url",
      filter: (query) => query.ilike("url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "social_sync_jobs",
      column: "source_media_path",
      filter: (query) => query.like("source_media_path", "automated/%"),
    },
    {
      table: "social_sync_jobs",
      column: "source_media_url",
      filter: (query) => query.ilike("source_media_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "quran_audio",
      column: "storage_path",
      filter: (query) => query.like("storage_path", "automated/%"),
    },
    {
      table: "site_audio_assets",
      column: "storage_path",
      filter: (query) => query.like("storage_path", "automated/%"),
    },
    {
      table: "video_generation_requests",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "videos",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "social_sync_jobs",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "youtube_feed_cache",
      column: "video_url",
      filter: (query) => query.ilike("video_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "youtube_feed_cache",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "content_agent_queue",
      column: "source_url",
      filter: (query) => query.ilike("source_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "content_sources",
      column: "url",
      filter: (query) => query.ilike("url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "social_publish_queue",
      column: "image_url",
      filter: (query) => query.ilike("image_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "content_library",
      column: "cover_url",
      filter: (query) => query.ilike("cover_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "articles",
      column: "featured_image_url",
      filter: (query) => query.ilike("featured_image_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "battles",
      column: "featured_image_url",
      filter: (query) => query.ilike("featured_image_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "battles",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "companions",
      column: "featured_image_url",
      filter: (query) => query.ilike("featured_image_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "companions",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "conquests",
      column: "featured_image_url",
      filter: (query) => query.ilike("featured_image_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "conquests",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "prophets",
      column: "featured_image_url",
      filter: (query) => query.ilike("featured_image_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "prophets",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "kids_games",
      column: "cover_url",
      filter: (query) => query.ilike("cover_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "kids_games",
      column: "icon_url",
      filter: (query) => query.ilike("icon_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "profiles",
      column: "avatar_url",
      filter: (query) => query.ilike("avatar_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "quran_audio",
      column: "audio_url",
      filter: (query) => query.ilike("audio_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "quran_audio",
      column: "storage_url",
      filter: (query) => query.ilike("storage_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "quran_ayahs",
      column: "audio_url",
      filter: (query) => query.ilike("audio_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "quran_reciters",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "quran_reciters",
      column: "base_url_template",
      filter: (query) => query.ilike("base_url_template", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "scholars",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "scholars",
      column: "website_url",
      filter: (query) => query.ilike("website_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "scholars",
      column: "youtube_url",
      filter: (query) => query.ilike("youtube_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "social_platform_profiles",
      column: "avatar_url",
      filter: (query) => query.ilike("avatar_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "social_platform_profiles",
      column: "cover_url",
      filter: (query) => query.ilike("cover_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "social_platform_profiles",
      column: "page_url",
      filter: (query) => query.ilike("page_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "tawasheeh",
      column: "audio_url",
      filter: (query) => query.ilike("audio_url", "%/storage/v1/object/public/videos/automated/%"),
    },
    {
      table: "tawasheeh",
      column: "thumbnail_url",
      filter: (query) => query.ilike("thumbnail_url", "%/storage/v1/object/public/videos/automated/%"),
    },
  ];

  const referenceSet = new Set();
  const candidateSet = new Set(candidatePaths);
  const canonicalUrlPrefix = `${supabaseUrl}/storage/v1/object/public/videos/`;

  function recordReference(value) {
    const clean = asString(value);
    if (!clean) return;
    if (candidateSet.has(clean)) {
      referenceSet.add(clean);
      return;
    }

    if (clean.startsWith(canonicalUrlPrefix)) {
      try {
        const parsed = new URL(clean);
        const prefix = "/storage/v1/object/public/videos/";
        const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
        if (candidateSet.has(path)) referenceSet.add(path);
      } catch {
        // Malformed references are ignored here; exact matching has already failed.
      }
    }
  }

  const results = await Promise.all(patterns.map(async (pattern) => {
    const rows = [];
    for (let offset = 0; offset < 5000; offset += 1000) {
      let query = client.from(pattern.table).select(pattern.column);
      query = pattern.filter(query);
      const { data, error } = await query.range(offset, offset + 999);
      if (error) {
        throw new Error(`Reference inventory failed for ${pattern.table}.${pattern.column}: ${error.message}`);
      }
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) return { pattern, rows };
    }
    throw new Error(`Reference inventory exceeded the safe scan limit for ${pattern.table}.${pattern.column}; refusing cleanup.`);
  }));

  for (const { pattern, rows } of results) {
    for (const row of rows) recordReference(row[pattern.column]);
  }

  const libraryRows = [];
  for (let offset = 0; offset < 5000; offset += 1000) {
    const { data, error } = await client
      .from("content_library")
      .select("media")
      .not("media", "is", null)
      .range(offset, offset + 999);
    if (error) throw new Error(`Reference inventory failed for content_library.media: ${error.message}`);
    libraryRows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  if (libraryRows.length >= 5000) {
    throw new Error("content_library.media exceeded the safe scan limit; refusing cleanup.");
  }
  for (const row of libraryRows) {
    const serialized = JSON.stringify(row.media ?? {});
    for (const path of candidatePaths) {
      if (serialized.includes(path)) referenceSet.add(path);
    }
  }
  return referenceSet;
}

async function getAndroidReleaseReferences(client) {
  const { data, error } = await client
    .from("site_settings")
    .select("key,value")
    .range(0, 999);
  if (error) throw new Error(`Cannot read Android release settings: ${error.message}`);
  const rows = data ?? [];
  if (rows.length >= 1000) {
    throw new Error("Site settings exceeded the safe scan limit; refusing Android release cleanup.");
  }

  const releaseRow = rows.find((row) => row.key === "android_release");
  const releaseValue = asObject(releaseRow?.value);
  const pinnedTag = asString(releaseValue.releaseTag);
  const referencedTags = new Set();

  for (const row of rows) {
    const serialized = JSON.stringify(row.value ?? {});
    for (const match of serialized.matchAll(/android-releases\/android\/(v\d+\.\d+\.\d+)\//g)) {
      referencedTags.add(match[1]);
    }
  }
  return { pinnedTag, referencedTags: [...referencedTags] };
}

async function updateVideoRecords(client, candidate, retention, finalize) {
  const { error } = await client.rpc("update_video_storage_retention", {
    p_queue_id: candidate.queue.id,
    p_request_id: candidate.request.id,
    p_expected_url: candidate.queue.video_url,
    p_retention: retention,
    p_finalize: finalize,
  });
  if (error) {
    throw new Error(`Atomic retention bookkeeping failed for queue row ${candidate.queue.id}: ${error.message}`);
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
  const unexpectedReferences = await loadUnexpectedVideoReferences(client, [...filesByPath.keys()], supabaseUrl);
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
    const queueRetention = asObject(asObject(row.metadata).storageRetention);
    const requestRetention = asObject(asObject(request.content).storageRetention);
    const pendingRecovery =
      queueRetention.state === "purge_pending" &&
      requestRetention.state === "purge_pending";
    if (!file && !pendingRecovery) {
      skipped.push({ id: row.id, reason: "Storage object is missing without a matching pending-retention record." });
      continue;
    }
    if (unexpectedReferences.has(path)) {
      skipped.push({ id: row.id, reason: "Another public content table still references this video path." });
      continue;
    }
    candidates.push({
      queue: row,
      request,
      path,
      fileMissing: !file,
      bytes: Number(file?.metadata?.size ?? queueRetention.bytes ?? requestRetention.bytes ?? 0),
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

  const androidSettings = await getAndroidReleaseReferences(client);
  const pinnedTag = androidSettings.pinnedTag;
  const androidVersions = androidRoot
    .filter((item) => /^v\d+\.\d+\.\d+$/.test(item.name ?? ""))
    .map((item) => item.name)
    .sort((a, b) => compareSemverTags(b, a));
  const protectedTags = selectProtectedAndroidTags(androidVersions, pinnedTag, androidSettings.referencedTags);
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
    const pendingRecords = new Map();

    // First persist both sides of the relationship atomically. If Storage removal
    // fails, the next run sees the pending marker and safely retries.
    for (const item of batch) {
      const pending = {
        state: "purge_pending",
        bucket: VIDEO_BUCKET,
        path: item.path,
        pendingSince: new Date().toISOString(),
        publishedAt: item.publishedAt,
        reason: "Every target platform confirmed publication; waiting for Storage object removal.",
        bytes: item.bytes,
        confirmedPlatforms: item.queue.target_platforms.map((platform) => ({
          platform,
          remoteId: asString(asObject(asObject(item.queue.metadata).platformResults)[platform]?.remoteId),
        })),
      };
      await updateVideoRecords(client, item, pending, false);
      pendingRecords.set(item, pending);
    }

    const pathsToRemove = batch.filter((item) => !item.fileMissing).map((item) => item.path);
    if (pathsToRemove.length > 0) {
      const { error } = await client.storage.from(VIDEO_BUCKET).remove(pathsToRemove);
      if (error) throw new Error(`Video Storage remove failed for batch ${offset / 100 + 1}: ${error.message}`);
    }

    // One database function updates queue + generation rows in a single transaction.
    // If this step fails, both rows remain marked purge_pending and the next daily
    // run can finalize them even when the binary is already absent.
    for (const item of batch) {
      const pending = pendingRecords.get(item);
      await updateVideoRecords(client, item, {
        ...pending,
        state: "purged",
        purgedAt: new Date().toISOString(),
        reason: "All target platforms confirmed publication; local Storage copy removed after the 48-hour grace period.",
      }, true);
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
  console.log(`Post-cleanup Android release folders: ${remainingAndroidFolders.filter((item) => /^v\d+\.\d+\.\d+$/.test(item.name ?? "")).map((item) => item.name).join(", ")}.`);
  console.log("ZIKR Storage retention completed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("[storage-retention] FAILED:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
