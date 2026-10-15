import "server-only";

import { createClient } from "@/lib/supabase/server";

const RELEASES_API_BASE =
  "https://api.github.com/repos/zikrofficial-X/Zikr/releases";
const TAG_RELEASE_API =
  "https://api.github.com/repos/zikrofficial-X/Zikr/releases/tags";
const ASSET_API_BASE =
  "https://api.github.com/repos/zikrofficial-X/Zikr/releases/assets";
const MAX_RELEASE_PAGES = 3;

export type GitHubReleaseAsset = {
  id?: number;
  name?: string;
};

export type GitHubRelease = {
  tag_name?: string;
  name?: string;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string | null;
  assets?: GitHubReleaseAsset[];
};

export type AndroidReleaseSetting = {
  mode?: "auto" | "pinned" | "github-supabase";
  releaseTag?: string | null;
  version?: string | null;
  versionCode?: number | null;
  applicationId?: string | null;
  targetSdk?: number | null;
  releaseUrl?: string | null;
  apkUrl?: string | null;
  aabUrl?: string | null;
  sha256Url?: string | null;
  metadataUrl?: string | null;
  apkSha256?: string | null;
  aabSha256?: string | null;
};

function getGitHubToken() {
  return process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null;
}

function githubHeaders(): HeadersInit {
  const token = getGitHubToken();
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "ZIKR-platform-release",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function compareVersions(a: string, b: string): number {
  const left = a
    .trim()
    .replace(/^v/i, "")
    .split(/[.-]/)
    .map(part => Number.parseInt(part, 10))
    .map(part => (Number.isFinite(part) ? part : 0));
  const right = b
    .trim()
    .replace(/^v/i, "")
    .split(/[.-]/)
    .map(part => Number.parseInt(part, 10))
    .map(part => (Number.isFinite(part) ? part : 0));

  const length = Math.max(left.length, right.length, 3);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function hasApk(release: GitHubRelease) {
  return release.assets?.some(asset =>
    asset.name?.toLowerCase().endsWith(".apk")
  );
}

function hasAab(release: GitHubRelease) {
  return release.assets?.some(asset =>
    asset.name?.toLowerCase().endsWith(".aab")
  );
}

async function fetchReleases(): Promise<GitHubRelease[] | null> {
  const token = getGitHubToken();
  if (!token) return null;

  const releases: GitHubRelease[] = [];
  for (let page = 1; page <= MAX_RELEASE_PAGES; page += 1) {
    const response = await fetch(
      `${RELEASES_API_BASE}?per_page=100&page=${page}`,
      {
        headers: githubHeaders(),
        cache: "no-store",
      }
    );
    if (!response.ok) return null;

    const batch = (await response.json()) as GitHubRelease[];
    if (!Array.isArray(batch) || batch.length === 0) break;

    releases.push(...batch);
    if (batch.length < 100) break;
  }

  return releases;
}

export async function getLatestStableAndroidRelease(): Promise<GitHubRelease | null> {
  const releases = await fetchReleases();
  if (!releases) return null;

  const candidates = releases
    .filter(
      release =>
        !release.draft &&
        !release.prerelease &&
        Boolean(release.tag_name?.trim()) &&
        hasApk(release) &&
        hasAab(release)
    )
    .sort((a, b) => {
      const versionDiff = compareVersions(b.tag_name ?? "", a.tag_name ?? "");
      if (versionDiff !== 0) return versionDiff;

      const aDate = a.published_at ? Date.parse(a.published_at) : 0;
      const bDate = b.published_at ? Date.parse(b.published_at) : 0;
      return bDate - aDate;
    });

  return candidates[0] ?? null;
}

export async function getStableReleaseByTag(
  tag: string
): Promise<GitHubRelease | null> {
  const token = getGitHubToken();
  if (!token || !/^[A-Za-z0-9._-]+$/.test(tag)) return null;

  const response = await fetch(
    `${TAG_RELEASE_API}/${encodeURIComponent(tag)}`,
    {
      headers: githubHeaders(),
      cache: "no-store",
    }
  );
  if (!response.ok) return null;

  const release = (await response.json()) as GitHubRelease;
  if (release.draft || release.prerelease || !hasApk(release) || !hasAab(release)) return null;
  return release;
}

export async function getAndroidReleaseSetting(): Promise<AndroidReleaseSetting> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "android_release")
      .maybeSingle();
    const value = data?.value as AndroidReleaseSetting | null;
    if (
      value &&
      (value.mode === "pinned" || value.mode === "github-supabase")
    ) {
      return value;
    }
  } catch {
    // Optional admin setting unavailable: use latest stable release.
  }

  return { mode: "auto", releaseTag: null };
}
export function selectAndroidRelease(
  latestStable: GitHubRelease | null,
  pinned: GitHubRelease | null
): GitHubRelease | null {
  if (
    pinned &&
    latestStable &&
    compareVersions(pinned.tag_name ?? "", latestStable.tag_name ?? "") >= 0
  ) {
    return pinned;
  }
  return latestStable ?? pinned;
}

export function findApkAsset(
  release: GitHubRelease | null
): GitHubReleaseAsset | null {
  return (
    release?.assets?.find(asset =>
      asset.name?.toLowerCase().endsWith(".apk")
    ) ?? null
  );
}

export function findAabAsset(
  release: GitHubRelease | null
): GitHubReleaseAsset | null {
  return (
    release?.assets?.find(asset =>
      asset.name?.toLowerCase().endsWith(".aab")
    ) ?? null
  );
}

export async function getSignedGitHubAssetUrl(
  assetId: number
): Promise<string | null> {
  const token = getGitHubToken();
  if (!token) return null;

  const response = await fetch(`${ASSET_API_BASE}/${assetId}`, {
    headers: {
      ...githubHeaders(),
      Accept: "application/octet-stream",
    },
    cache: "no-store",
    redirect: "manual",
  });

  if (response.status >= 300 && response.status < 400) {
    return response.headers.get("location");
  }

  return null;
}

export function hasGitHubReleaseAccess(): boolean {
  return Boolean(getGitHubToken());
}
