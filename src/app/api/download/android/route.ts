import { NextResponse } from "next/server";
import {
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

export async function GET() {
  try {
    const setting = await getAndroidReleaseSetting();
    const supabaseApkUrl = verifiedSupabaseUrl(setting.apkUrl);
    if (supabaseApkUrl) {
      return NextResponse.redirect(supabaseApkUrl, {
        status: 302,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      });
    }

    if (!hasGitHubReleaseAccess()) {
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

    const latestStable = await getLatestStableAndroidRelease();

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
        }
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
        }
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
      }
    );
  }
}
