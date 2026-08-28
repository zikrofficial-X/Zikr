import { NextResponse } from "next/server";

const RELEASES_API_BASE =
  "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr/releases";
const RELEASE_DOWNLOAD_ENDPOINT = "/api/download/android";
const RELEASE_DOWNLOAD_BASE =
  "https://github.com/mohamedalaa7785-cpu/Zikr/releases/download";
const MAX_RELEASE_PAGES = 3;
const githubToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const githubHeaders: HeadersInit = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ZIKR-platform-version-check",
  ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

type ReleaseResponse = {
  tag_name?: string;
  name?: string;
  html_url?: string;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: Array<{ name?: string }>;
};

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

async function getLatestStableReleaseWithApk(): Promise<ReleaseResponse | null> {
  const releases: ReleaseResponse[] = [];

  for (let page = 1; page <= MAX_RELEASE_PAGES; page += 1) {
    const response = await fetch(
      `${RELEASES_API_BASE}?per_page=100&page=${page}`,
      { headers: githubHeaders, cache: "no-store" },
    );

    if (!response.ok) return null;

    const batch = (await response.json()) as ReleaseResponse[];
    if (!Array.isArray(batch) || batch.length === 0) break;

    releases.push(...batch);
    if (batch.length < 100) break;
  }

  const stableWithApk = releases.filter(
    release =>
      !release.draft &&
      !release.prerelease &&
      Boolean(release.tag_name?.trim()) &&
      release.assets?.some(asset =>
        asset.name?.toLowerCase().endsWith(".apk"),
      ),
  );

  stableWithApk.sort((a, b) => {
    const versionDiff = compareVersions(b.tag_name ?? "", a.tag_name ?? "");
    if (versionDiff !== 0) return versionDiff;

    const aDate = a.published_at ? Date.parse(a.published_at) : 0;
    const bDate = b.published_at ? Date.parse(b.published_at) : 0;
    return bDate - aDate;
  });

  return stableWithApk[0] ?? null;
}

export async function GET() {
  try {
    if (!githubToken) {
      console.error("[app-version] GITHUB_TOKEN is missing; private releases cannot be read.");
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

    const release = await getLatestStableReleaseWithApk();
    if (!release) {
      return NextResponse.json(
        { error: "لا يوجد إصدار Android مستقر صالح حاليًا." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
    }

    const tag = release.tag_name?.trim();
    const apk = release.assets?.find(asset =>
      asset.name?.toLowerCase().endsWith(".apk"),
    );

    if (!tag || !apk?.name) {
      return NextResponse.json(
        { error: "لا يوجد APK منشور في أحدث إصدار حاليًا." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        version: tag.replace(/^v/i, ""),
        tag,
        apkUrl: RELEASE_DOWNLOAD_ENDPOINT,
        releaseUrl:
          release.html_url ??
          `${RELEASE_DOWNLOAD_BASE}/${encodeURIComponent(tag)}/${encodeURIComponent(apk.name)}`,
        publishedAt: release.published_at ?? null,
        name: release.name ?? `ZIKR Android ${tag}`,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("[app-version] release lookup failed:", error);
    return NextResponse.json(
      { error: "تعذر التحقق من أحدث إصدار حاليًا." },
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

export function HEAD() {
  return new NextResponse(null, { status: 204 });
}
