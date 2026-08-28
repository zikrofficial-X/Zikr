import { NextResponse } from "next/server";

const RELEASES_API =
  "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/latest";
const RELEASE_DOWNLOAD_BASE =
  "https://github.com/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/download";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Resolve the release at request time so this button always follows the
    // newest published stable GitHub Release. Do not cache the metadata lookup.
    const response = await fetch(RELEASES_API, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ZIKR-platform-download",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "تعذر العثور على أحدث إصدار من تطبيق Android حاليًا." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    const release = (await response.json()) as {
      tag_name?: string;
      draft?: boolean;
      prerelease?: boolean;
      assets?: Array<{
        name?: string;
        browser_download_url?: string;
      }>;
    };

    // /releases/latest already targets the latest non-draft, non-prerelease
    // release, but keep explicit guards for defensive correctness.
    const tag = release.tag_name?.trim();
    const apk = release.assets?.find(asset =>
      asset.name?.toLowerCase().endsWith(".apk")
    );

    if (release.draft || release.prerelease || !tag || !apk?.name) {
      return NextResponse.json(
        { error: "لا يوجد ملف APK منشور في أحدث إصدار مستقر حاليًا." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    const downloadUrl = `${RELEASE_DOWNLOAD_BASE}/${encodeURIComponent(tag)}/${encodeURIComponent(apk.name)}`;

    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: {
        // Prevent the browser/CDN from keeping an old release redirect.
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("[android-download] latest release lookup failed:", error);
    return NextResponse.json(
      { error: "تعذر الوصول إلى أحدث إصدار من تطبيق Android حاليًا." },
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
