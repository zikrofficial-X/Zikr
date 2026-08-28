import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RELEASES_API_BASE =
  "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr/releases";
const TAG_RELEASE_API =
  "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr/releases/tags";
const ASSET_API_BASE =
  "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr/releases/assets";
const MAX_RELEASE_PAGES = 3;
const githubToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

const githubHeaders: HeadersInit = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ZIKR-platform-download",
  ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
};

type GitHubReleaseAsset = {
  id?: number;
  name?: string;
};

type GitHubRelease = {
  tag_name?: string;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string | null;
  assets?: GitHubReleaseAsset[];
};

type AndroidReleaseSetting = {
  mode?: "auto" | "pinned";
  releaseTag?: string | null;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function versionParts(value: string) {
  return value
    .trim()
    .replace(/^v/i, "")
    .split(/[.-]/)
    .map(part => Number.parseInt(part, 10))
    .map(part => (Number.isFinite(part) ? part : 0));
}

function compareVersions(a: string, b: string) {
  const left = versionParts(a);
  const right = versionParts(b);
  const length = Math.max(left.length, right.length, 3);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function fetchLatestStable(): Promise<GitHubRelease | null> {
  if (!githubToken) return null;

  const releases: GitHubRelease[] = [];
  for (let page = 1; page <= MAX_RELEASE_PAGES; page += 1) {
    const response = await fetch(
      `${RELEASES_API_BASE}?per_page=100&page=${page}`,
      { headers: githubHeaders, cache: "no-store" },
    );

    if (!response.ok) return null;

    const batch = (await response.json()) as GitHubRelease[];
    if (!Array.isArray(batch) || batch.length === 0) break;

    releases.push(...batch);
    if (batch.length < 100) break;
  }

  const candidates = releases.filter(
    release =>
      !release.draft &&
      !release.prerelease &&
      Boolean(release.tag_name?.trim()) &&
      release.assets?.some(asset =>
        asset.name?.toLowerCase().endsWith(".apk"),
      ),
  );

  candidates.sort((a, b) => {
    const versionDiff = compareVersions(b.tag_name ?? "", a.tag_name ?? "");
    if (versionDiff !== 0) return versionDiff;

    const aDate = a.published_at ? Date.parse(a.published_at) : 0;
    const bDate = b.published_at ? Date.parse(b.published_at) : 0;
    return bDate - aDate;
  });

  return candidates[0] ?? null;
}

async function fetchTaggedStable(tag: string): Promise<GitHubRelease | null> {
  if (!githubToken || !/^[A-Za-z0-9._-]+$/.test(tag)) return null;
  const response = await fetch(`${TAG_RELEASE_API}/${encodeURIComponent(tag)}`, {
    headers: githubHeaders,
    cache: "no-store",
  });
  if (!response.ok) return null;
  const release = (await response.json()) as GitHubRelease;
  return release.draft || release.prerelease ? null : release;
}

async function getSignedAssetUrl(assetId: number): Promise<string | null> {
  if (!githubToken) return null;

  const response = await fetch(`${ASSET_API_BASE}/${assetId}`, {
    headers: {
      ...githubHeaders,
      Accept: "application/octet-stream",
    },
    cache: "no-store",
    redirect: "manual",
  });

  if (response.status >= 300 && response.status < 400) {
    return response.headers.get("location");
  }

  if (!response.ok) return null;

  // GitHub may return the asset bytes directly instead of a redirect.
  // Do not proxy a large APK through the Vercel function; treat this as a failure.
  return null;
}

export async function GET() {
  try {
    if (!githubToken) {
      return NextResponse.json(
        { error: "إعداد الوصول إلى إصدارات Android غير مكتمل." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
    }

    let setting: AndroidReleaseSetting = { mode: "auto", releaseTag: null };
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "android_release")
        .maybeSingle();
      const value = data?.value as AndroidReleaseSetting | null;
      if (value?.mode === "pinned" && value.releaseTag) {
        setting = { mode: "pinned", releaseTag: value.releaseTag };
      }
    } catch {
      // If the optional admin setting is unavailable, safely fall back to latest.
    }

    const release =
      setting.mode === "pinned" && setting.releaseTag
        ? await fetchTaggedStable(setting.releaseTag)
        : await fetchLatestStable();
    const tag = release?.tag_name?.trim();
    const apk = release?.assets?.find(asset =>
      asset.name?.toLowerCase().endsWith(".apk"),
    );

    if (!tag || !apk?.name || !apk.id) {
      return NextResponse.json(
        { error: "تعذر العثور على APK صالح للإصدار المحدد حاليًا." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
    }

    const signedUrl = await getSignedAssetUrl(apk.id);
    if (!signedUrl) {
      return NextResponse.json(
        { error: "تعذر إنشاء رابط تنزيل آمن للـAPK حاليًا." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
    }

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("[android-download] release lookup failed:", error);
    return NextResponse.json(
      { error: "تعذر الوصول إلى إصدار تطبيق Android حاليًا." },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  }
}
