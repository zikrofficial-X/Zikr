import { NextResponse } from "next/server";
import {
  findAabAsset,
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
        { status: 503, headers: { "Cache-Control": "no-store" } },
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
    const aab = findAabAsset(release);

    if (!tag || !aab?.name || !aab.id) {
      return NextResponse.json(
        { error: "تعذر العثور على AAB صالح للإصدار المحدد حاليًا." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const signedUrl = await getSignedGitHubAssetUrl(aab.id);
    if (!signedUrl) {
      return NextResponse.json(
        { error: "تعذر إنشاء رابط تنزيل آمن للـAAB حاليًا." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("[android-aab-download] release lookup failed:", error);
    return NextResponse.json(
      { error: "تعذر الوصول إلى حزمة Android AAB حاليًا." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
