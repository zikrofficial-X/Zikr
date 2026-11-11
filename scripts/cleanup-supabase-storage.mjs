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
const SUPPORTED_RETENTION_PLATFORMS = new Set(["facebook", "facebook_reels", "youtube"]);
const MAX_CLOUDINARY_PROBES = 1000;

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function assertExpectedSupabaseProject(supabaseUrl, expectedProjectRef) {
  const expected = asString(expectedProjectRef).toLowerCase();
  if (!/^[a-z0-9]{20}$/.test(expected)) {
    throw new Error("EXPECTED_PROJECT_REF must be the canonical 20-character Supabase project ref.");
  }
  const parsed = new URL(supabaseUrl);
  if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== `${expected}.supabase.co`) {
    throw new Error(`Refusing Storage retention for an unexpected Supabase project; expected https://${expected}.supabase.co.`);
  }
  return expected;
}

export function assertRetentionApplyConfirmation(apply, confirmation) {
  if (apply && asString(confirmation) !== "DELETE_STAGING_COPIES") {
    throw new Error("Refusing destructive Storage retention without RETENTION_CONFIRMATION=DELETE_STAGING_COPIES.");
  }
}

export async function collectPaginatedRows(
  fetchPage,
  label,
  pageSize = 1000,
  maxRows = 5000,
) {
  if (!Number.isInteger(pageSize) || pageSize < 1 ||
      !Number.isInteger(maxRows) || maxRows < pageSize) {
    throw new Error("Invalid pagination safety limits.");
  }

  const rows = [];
  const maxPages = Math.ceil(maxRows / pageSize);
  for (let page = 0; page <= maxPages; page += 1) {
    const offset = page * pageSize;
    const pageRows = await fetchPage(offset, offset + pageSize - 1);
    if (!Array.isArray(pageRows)) {
      throw new Error(`Pagination returned invalid data for ${label}; refusing cleanup.`);
    }
    if (rows.length + pageRows.length > maxRows) {
      throw new Error(`${label} exceeded the safe scan limit; refusing cleanup.`);
    }
    rows.push(...pageRows);
    if (pageRows.length < pageSize) return rows;
  }

  throw new Error(`${label} exceeded the safe scan limit; refusing cleanup.`);
}

export function matchesSha256Digest(bytes, expectedDigest) {
  const expected = asString(expectedDigest).toLowerCase();
  if (!/^sha256:[a-f0-9]{64}$/.test(expected)) return false;
  const actual = "sha256:" + createHash("sha256").update(bytes).digest("hex");
  return actual === expected;
}

export function hasConfirmedPlatformResults(targetPlatforms, metadata) {
  if (!Array.isArray(targetPlatforms) || targetPlatforms.length === 0) return false;
  const results = asObject(asObject(metadata).platformResults);
  return targetPlatforms.every((platform) => {
    if (typeof platform !== "string" || !SUPPORTED_RETENTION_PLATFORMS.has(platform)) return false;
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
    if (!path.startsWith("automated/") || path.includes("\0")) return null;
    if (path.split("/").some((part) => part === "." || part === "..")) return null;
    return path;
  } catch {
    return null;
  }
}

export function findManagedVideoReferences(value, candidatePaths, supabaseUrl) {
  const candidates = candidatePaths instanceof Set ? candidatePaths : new Set(candidatePaths);
  const references = new Set();

  const visit = (entry) => {
    if (entry === null || entry === undefined) return;
    if (Array.isArray(entry)) {
      for (const item of entry) visit(item);
      return;
    }
    if (typeof entry === "object") {
      for (const item of Object.values(entry)) visit(item);
      return;
    }

    const clean = asString(entry);
    if (!clean) return;
    if (candidates.has(clean)) {
      references.add(clean);
      return;
    }

    const managedPath = extractManagedVideoPath(clean, supabaseUrl);
    if (managedPath && candidates.has(managedPath)) {
      references.add(managedPath);
      return;
    }

    for (const path of candidates) {
      const segmentEncodedPath = path.split("/").map(encodeURIComponent).join("/");
      const fullyEncodedPath = encodeURIComponent(path);
      if (clean.includes(path) || clean.includes(segmentEncodedPath) || clean.includes(fullyEncodedPath)) {
        references.add(path);
      }
    }
  };

  visit(value);
  return references;
}

export function extractCloudinaryVideoPublicId(value, cloudName) {
  try {
    if (!cloudName) return null;
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== "video" || parts[2] !== "upload") return null;
    const publicParts = parts.slice(3);
    const version = publicParts[0] ?? "";
    if (version.startsWith("v") && version.slice(1).length > 0 && [...version.slice(1)].every((character) => character >= "0" && character <= "9")) {
      publicParts.shift();
    }
    const fileName = publicParts.pop() ?? "";
    const extension = fileName.lastIndexOf(".");
    const publicId = [...publicParts, extension > 0 ? fileName.slice(0, extension) : fileName].filter(Boolean).join("/");
    // Only delete generated ZIKR video assets. Audio, artwork, samples, and other
    // Cloudinary content must never be treated as disposable publishing files.
    if (!/^auto-[A-Za-z0-9._/-]+$/.test(publicId)) return null;
    if (publicId.split("/").some((part) => !part || part === "." || part === "..")) return null;
    return publicId;
  } catch {
    return null;
  }
}

export async function probeCloudinaryPlayback(value, cloudName, fetchImpl = fetch) {
  if (!extractCloudinaryVideoPublicId(value, cloudName)) {
    return { status: "unknown", httpStatus: null, contentType: null, reason: "unverified_cloudinary_url" };
  }
  const probe = (method) => fetchImpl(value, {
    method,
    ...(method === "GET" ? { headers: { Range: "bytes=0-0" } } : {}),
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  try {
    let response = await probe("HEAD");
    if (response.status === 405 || response.status === 501) {
      response = await probe("GET");
      await response.body?.cancel();
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? null;
    const isVideo = Boolean(contentType && (
      contentType.startsWith("video/") || contentType.includes("application/octet-stream")
    ));
    if ((response.ok || response.status === 206) && isVideo) {
      return { status: "available", httpStatus: response.status, contentType };
    }
    if (response.status === 404 || response.status === 410) {
      return { status: "missing", httpStatus: response.status, contentType, reason: "asset_not_found" };
    }
    if (response.ok || response.status === 206) {
      return { status: "unknown", httpStatus: response.status, contentType, reason: "unexpected_content_type" };
    }
    if (response.status === 401 || response.status === 403) {
      return { status: "unknown", httpStatus: response.status, contentType, reason: "asset_access_restricted" };
    }
    return { status: "unknown", httpStatus: response.status, contentType, reason: "transient_or_unclassified_http_status" };
  } catch (error) {
    return {
      status: "unknown",
      httpStatus: null,
      contentType: null,
      reason: error instanceof Error ? error.name : "network_error",
    };
  }
}

function getSupabaseBackupUrl(queue, request, supabaseUrl) {
  return asString(asObject(queue?.metadata).supabaseOriginalVideoUrl)
    || asString(asObject(request?.content).supabaseOriginalVideoUrl)
    || (extractManagedVideoPath(queue?.video_url, supabaseUrl) ? asString(queue?.video_url) : "");
}

export function indexManagedBackupReferences(rows, candidatePaths, getValue, getId, supabaseUrl) {
  const references = new Map();
  const candidates = new Set(candidatePaths);
  const addReference = (path, id) => {
    if (!candidates.has(path)) return;
    const ids = references.get(path) ?? new Set();
    ids.add(id);
    references.set(path, ids);
  };
  const collectStrings = (value, output = []) => {
    if (typeof value === "string") output.push(value);
    else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
    else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, output));
    return output;
  };
  for (const row of rows ?? []) {
    const value = getValue(row) ?? {};
    const id = String(getId(row) ?? "");
    const serialized = JSON.stringify(value);
    for (const path of candidates) {
      if (serialized.includes(path)) addReference(path, id);
    }
    if (supabaseUrl) {
      for (const candidate of collectStrings(value)) {
        const managedPath = extractManagedVideoPath(candidate, supabaseUrl);
        if (managedPath) addReference(managedPath, id);
      }
    }
  }
  return references;
}

export function isEligiblePublishedQueueItem(item, cutoffIso, supabaseUrl, cloudName = asString(process.env.CLOUDINARY_CLOUD_NAME), cloudinaryProbeStatus = "unknown") {
  if (!item || item.status !== "published" || cloudinaryProbeStatus !== "available") return false;
  if (!item.published_at || !(Date.parse(item.published_at) < Date.parse(cutoffIso))) return false;
  if (!hasConfirmedPlatformResults(item.target_platforms, item.metadata)) return false;
  const backupUrl = asString(asObject(item.metadata).supabaseOriginalVideoUrl);
  // Only the redundant Supabase staging object is eligible. The public Cloudinary
  // master remains the durable playback source and is never deleted by retention.
  return Boolean(
    extractCloudinaryVideoPublicId(item.video_url, cloudName) &&
    extractManagedVideoPath(backupUrl, supabaseUrl)
  );
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
  assertExpectedSupabaseProject(supabaseUrl, process.env.EXPECTED_PROJECT_REF);
  return { supabaseUrl: supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl, serviceRoleKey };
}

async function listDirectory(client, bucket, prefix) {
  return collectPaginatedRows(async (offset, end) => {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: end - offset + 1,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Storage list failed for ${bucket}/${prefix}: ${error.message}`);
    return data ?? [];
  }, `Storage inventory ${bucket}/${prefix}`);
}

async function readSmallStorageBytes(client, bucket, path, maxBytes = 128 * 1024) {
  const { data, error } = await client.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Cannot read required backup file ${bucket}/${path}: ${error?.message ?? "empty response"}`);
  if (data.size > maxBytes) throw new Error(`Refusing unexpectedly large metadata file: ${bucket}/${path}`);
  return Buffer.from(await data.arrayBuffer());
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

  const metadataBytes = await readSmallStorageBytes(
    client,
    ANDROID_BUCKET,
    `android/${version}/release-metadata.json`,
  );
  const checksumBytes = await readSmallStorageBytes(
    client,
    ANDROID_BUCKET,
    `android/${version}/SHA256SUMS`,
  );
  const metadataText = metadataBytes.toString("utf8");
  const checksumText = checksumBytes.toString("utf8");
  if (!matchesSha256Digest(metadataBytes, assets.get("release-metadata.json")?.digest)) {
    return { ok: false, reason: "Stored release-metadata.json does not match the GitHub Release asset digest." };
  }
  if (!matchesSha256Digest(checksumBytes, assets.get("SHA256SUMS")?.digest)) {
    return { ok: false, reason: "Stored SHA256SUMS does not match the GitHub Release asset digest." };
  }
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
    const actualBytes = Buffer.from(await binary.arrayBuffer());
    if (!matchesSha256Digest(actualBytes, expectedDigest)) {
      return { ok: false, reason: `Actual Supabase binary SHA256 does not match the published GitHub ${name}.` };
    }
  }
  return { ok: true, reason: "GitHub Release assets, stored checksums, and actual Supabase APK/AAB bytes match." };
}

const REFERENCE_ORDER_COLUMNS = Object.freeze({
  kids_content: "id",
  media_assets: "id",
  social_sync_jobs: "id",
  quran_audio: "id",
  site_audio_assets: "id",
  video_generation_requests: "id",
  videos: "id",
  youtube_feed_cache: "video_id",
  content_agent_queue: "id",
  content_sources: "id",
  social_publish_queue: "id",
  content_library: "id",
  articles: "id",
  battles: "id",
  companions: "id",
  conquests: "id",
  prophets: "id",
  kids_games: "id",
  profiles: "id",
  quran_ayahs: "id",
  quran_reciters: "id",
  scholars: "id",
  social_platform_profiles: "platform",
  tawasheeh: "id",
});

export function getReferenceOrderColumn(table) {
  if (!Object.hasOwn(REFERENCE_ORDER_COLUMNS, table)) {
    throw new Error(`No deterministic primary-key order is configured for Storage reference table ${table}.`);
  }
  return REFERENCE_ORDER_COLUMNS[table];
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
      column: "video_url",
      filter: (query) => query.ilike("video_url", "%/storage/v1/object/public/videos/automated/%"),
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
      table: "videos",
      column: "metadata",
      filter: (query) => query.not("metadata", "is", null),
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
      column: "video_url",
      filter: (query) => query.ilike("video_url", "%/storage/v1/object/public/videos/automated/%"),
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
  function recordReference(value) {
    for (const path of findManagedVideoReferences(value, candidateSet, supabaseUrl)) {
      referenceSet.add(path);
    }
  }

  const results = await Promise.all(patterns.map(async (pattern) => {
    const rows = [];
    for (let offset = 0; offset < 5000; offset += 1000) {
      const orderColumn = getReferenceOrderColumn(pattern.table);
      let query = client.from(pattern.table).select(pattern.column);
      query = pattern.filter(query).order(orderColumn, { ascending: true });
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
      .order("id", { ascending: true })
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
  const apply = process.argv.includes("--apply");
  assertRetentionApplyConfirmation(apply, process.env.RETENTION_CONFIRMATION);
  const { supabaseUrl, serviceRoleKey } = assertEnv();
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const videosOnly = process.argv.includes("--videos-only");
  const now = new Date();
  const cutoff = new Date(now.getTime() - VIDEO_RETENTION_HOURS * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString();

  console.log(`ZIKR Storage retention: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Video retention cutoff: ${cutoffIso}`);

  const [queueRows, requestRows, videoFiles, androidRoot] = await Promise.all([
    collectPaginatedRows(async (offset, end) => {
      const { data, error } = await client.from("social_publish_queue")
        .select("id,content_id,video_url,target_platforms,status,published_at,metadata")
        .order("id", { ascending: true })
        .range(offset, end);
      if (error) throw new Error(`Cannot read social publish queue: ${error.message}`);
      return data ?? [];
    }, "social_publish_queue.video_url"),
    collectPaginatedRows(async (offset, end) => {
      const { data, error } = await client.from("video_generation_requests")
        .select("id,status,video_url,content")
        .order("id", { ascending: true })
        .range(offset, end);
      if (error) throw new Error(`Cannot read video generation requests: ${error.message}`);
      return data ?? [];
    }, "video_generation_requests.video_url"),
    listDirectory(client, VIDEO_BUCKET, VIDEO_PREFIX),
    listDirectory(client, ANDROID_BUCKET, "android"),
  ]);
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

  const candidateBackupPaths = new Set(filesByPath.keys());
  for (const row of queueRows) {
    const request = requestById.get(row.content_id);
    if (!request || row.status !== "published" || !row.published_at ||
        !(Date.parse(row.published_at) < Date.parse(cutoffIso)) ||
        !hasConfirmedPlatformResults(row.target_platforms, row.metadata)) continue;
    const backupUrl = getSupabaseBackupUrl(row, request, supabaseUrl);
    const path = extractManagedVideoPath(backupUrl, supabaseUrl);
    if (path) candidateBackupPaths.add(path);
  }

  const candidatePaths = [...candidateBackupPaths];
  const unexpectedReferences = await loadUnexpectedVideoReferences(client, candidatePaths, supabaseUrl);
  const queueBackupReferences = indexManagedBackupReferences(
    queueRows,
    candidatePaths,
    (row) => ({ metadata: row.metadata, video_url: row.video_url }),
    (row) => row.id,
    supabaseUrl,
  );
  const requestBackupReferences = indexManagedBackupReferences(
    requestRows,
    candidatePaths,
    (row) => ({ content: row.content, video_url: row.video_url }),
    (row) => row.id,
    supabaseUrl,
  );

  const cloudinaryCloudName = asString(process.env.CLOUDINARY_CLOUD_NAME);
  const candidateQueue = [];
  const skipped = [];
  for (const row of queueRows) {
    if (!row.video_url || row.status !== "published" || !row.published_at ||
        !(Date.parse(row.published_at) < Date.parse(cutoffIso)) ||
        !hasConfirmedPlatformResults(row.target_platforms, row.metadata)) continue;

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

    const backupUrl = getSupabaseBackupUrl(row, request, supabaseUrl);
    const path = extractManagedVideoPath(backupUrl, supabaseUrl);
    const cloudinaryPublicId = extractCloudinaryVideoPublicId(row.video_url, cloudinaryCloudName);
    const directSupabasePath = extractManagedVideoPath(row.video_url, supabaseUrl);
    if (!path) {
      skipped.push({ id: row.id, reason: "No verified managed Supabase backup path." });
      continue;
    }
    if (directSupabasePath || !cloudinaryPublicId) {
      skipped.push({ id: row.id, reason: directSupabasePath
        ? "Queue URL is the primary Supabase playback asset; retaining it to protect the public catalog."
        : "No verified Cloudinary playback master; refusing to purge the only known video asset." });
      continue;
    }
    const queueReferences = queueBackupReferences.get(path);
    const requestReferences = requestBackupReferences.get(path);
    if (
      (!queueReferences && !requestReferences) ||
      (queueReferences && (queueReferences.size !== 1 || !queueReferences.has(row.id))) ||
      (requestReferences && (requestReferences.size !== 1 || !requestReferences.has(request.id)))
    ) {
      skipped.push({ id: row.id, reason: "Supabase backup path is shared or its queue/request ownership cannot be proven." });
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
    candidateQueue.push({
      queue: row,
      request,
      path,
      backupUrl,
      cloudinaryPublicId,
      fileMissing: !file,
      bytes: Number(file?.metadata?.size ?? queueRetention.bytes ?? requestRetention.bytes ?? 0),
      publishedAt: row.published_at,
    });
  }

  if (candidateQueue.length > MAX_CLOUDINARY_PROBES) {
    throw new Error(`Cloudinary playback verification exceeded the safe limit of ${MAX_CLOUDINARY_PROBES}; refusing cleanup.`);
  }
  const candidates = [];
  let probeCursor = 0;
  const probeConcurrency = Math.min(10, candidateQueue.length);
  await Promise.all(Array.from({ length: probeConcurrency }, async () => {
    while (true) {
      const index = probeCursor++;
      if (index >= candidateQueue.length) return;
      const candidate = candidateQueue[index];
      const probe = await probeCloudinaryPlayback(candidate.queue.video_url, cloudinaryCloudName);
      if (probe.status !== "available") {
        skipped.push({
          id: candidate.queue.id,
          reason: `Cloudinary playback master is not confirmed available (${probe.status}${probe.reason ? `: ${probe.reason}` : ""}).`,
        });
        continue;
      }
      candidates.push(candidate);
    }
  }));

  const totalVideoBytes = candidates.reduce((sum, item) => sum + item.bytes, 0);
  console.log(
    `Video candidates: ${candidates.length} objects / ${(totalVideoBytes / 1024 / 1024).toFixed(2)} MiB; skipped: ${skipped.length}.`,
  );
  for (const item of skipped.slice(0, 20)) {
    console.log(`SKIP video queue ${item.id}: ${item.reason}`);
  }

  const androidSettings = videosOnly
    ? { pinnedTag: "", referencedTags: [] }
    : await getAndroidReleaseReferences(client);
  const pinnedTag = androidSettings.pinnedTag;
  const androidVersions = androidRoot
    .filter((item) => /^v\d+\.\d+\.\d+$/.test(item.name ?? ""))
    .map((item) => item.name)
    .sort((a, b) => compareSemverTags(b, a));
  const protectedTags = selectProtectedAndroidTags(androidVersions, pinnedTag, androidSettings.referencedTags);
  const androidDeletes = [];
  const androidVersionFiles = new Map();

  for (const version of (videosOnly ? [] : androidVersions)) {
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

  console.log(`Cloudinary playback masters retained: ${candidates.filter((item) => item.cloudinaryPublicId).length}.`);
  console.log(videosOnly ? "Android release files: untouched (videos-only run)." : `Android copies eligible: ${androidDeletes.map((item) => item.version).join(", ") || "none"}.`);
  console.log(`Active Android tag: ${pinnedTag || "unset"}; protected: ${[...protectedTags].join(", ")}.`);
  console.log(
    `Expected storage reduction: at least ${(totalVideoBytes / 1024 / 1024).toFixed(2)} MiB from videos plus verified Android versions.`,
  );

  if (!apply) {
    console.log("DRY RUN COMPLETE: no Cloudinary assets, Storage objects, or database rows were changed.");
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
        reason: "Every target platform confirmed publication; waiting for Supabase staging-copy removal. The Cloudinary playback master is retained.",
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

    // The Cloudinary URL is the permanent playback master referenced by public.videos.
    // Never destroy it here. Only the verified Supabase staging backup is disposable.

    // One database function updates queue + generation rows in a single transaction.
    // If this step fails, both rows remain marked purge_pending and the next daily
    // run can finalize them even when the binary is already absent.
    for (const item of batch) {
      const pending = pendingRecords.get(item);
      await updateVideoRecords(client, item, {
        ...pending,
        state: "purged",
        purgedAt: new Date().toISOString(),
        reason: "All target platforms confirmed publication; only the redundant Supabase staging copy was removed after the 48-hour grace period. The public playback master remains intact.",
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
