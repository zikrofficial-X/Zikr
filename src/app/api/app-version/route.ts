import { NextResponse } from "next/server";
import {
  findApkAsset,
  getAndroidReleaseSetting,
  findAabAsset,
  getLatestStableAndroidRelease,
  hasGitHubReleaseAccess,
} from "@/features/releases/services/github-android-release";

const RELEASE_DOWNLOAD_ENDPOINT = "/api/download/android";
const RELEASE_DOWNLOAD_BASE =
  "https://github.com/zikrofficial-X/Zikr/releases/download";

function verifiedSupabaseUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co")
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await getAndroidReleaseSetting();
    const apkUrl = verifiedSupabaseUrl(setting.apkUrl);
    const aabUrl = verifiedSupabaseUrl(setting.aabUrl);
    if (apkUrl && aabUrl && setting.releaseTag) {
      const tag = setting.releaseTag;
      return NextResponse.json(
        {
          version: setting.version ?? tag.replace(/^v/i, ""),
          tag,
          apkUrl: RELEASE_DOWNLOAD_ENDPOINT,
          aabUrl: "/api/download/android/aab",
          aabName: "app-release.aab",
          releaseUrl: verifiedSupabaseUrl(setting.releaseUrl) ?? apkUrl,
          publishedAt: null,
          name: `ZIKR Android ${tag}`,
        },
        {
          headers: {
            "Cache-Control": "private, no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    if (!hasGitHubReleaseAccess()) {
      console.error(
        "[app-version] GITHUB_TOKEN is missing; private releases cannot be read."
      );
      return NextResponse.json(
        { error: "إعداد الوصول إلى إصدارات Android غير مكتمل." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    const release = await getLatestStableAndroidRelease();
    if (!release) {
      return NextResponse.json(
        { error: "لا يوجد إصدار Android متاح حاليًا." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    const tag = release.tag_name?.trim();
    const apk = findApkAsset(release);
    const aab = findAabAsset(release);

    if (!tag || !apk?.name) {
      return NextResponse.json(
        { error: "لا يوجد APK منشور في أحدث إصدار حاليًا." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        version: tag.replace(/^v/i, ""),
        tag,
        apkUrl: RELEASE_DOWNLOAD_ENDPOINT,
        aabUrl: "/api/download/android/aab",
        aabName: aab?.name ?? null,
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
      }
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
      }
    );
  }
}

export function HEAD() {
  return new NextResponse(null, { status: 204 });
}
