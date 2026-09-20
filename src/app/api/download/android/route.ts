import { NextResponse } from "next/server";
import {
  compareVersions,
  findApkAsset,
  getAndroidReleaseSetting,
  getLatestStableAndroidRelease,
  getSignedGitHubAssetUrl,
  getStableReleaseByTag,
  hasGitHubReleaseAccess,
  selectAndroidRelease,
} from "@/features/releases/services/github-android-release";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    if (!hasGitHubReleaseAccess()) {
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

    const [setting, latestStable] = await Promise.all([
      getAndroidReleaseSetting(),
      getLatestStableAndroidRelease(),
    ]);

    const pinnedRelease =
      setting.mode === "pinned" && setting.releaseTag
        ? await getStableReleaseByTag(setting.releaseTag)
        : null;

    const release = selectAndroidRelease(latestStable, pinnedRelease);
    const tag = release?.tag_name?.trim();
    const apk = findApkAsset(release);

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

    const signedUrl = await getSignedGitHubAssetUrl(apk.id);
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
