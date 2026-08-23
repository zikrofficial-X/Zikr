import { NextResponse } from "next/server";

const RELEASES_API =
  "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/latest";
const RELEASE_DOWNLOAD_BASE =
  "https://github.com/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/download";

export const revalidate = 300;

export async function GET() {
  const response = await fetch(RELEASES_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ZIKR-platform-download",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "تعذر العثور على أحدث إصدار من تطبيق Android حاليًا." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const release = (await response.json()) as {
    tag_name?: string;
    assets?: Array<{ name?: string; browser_download_url?: string }>;
  };
  const tag = release.tag_name?.trim();
  const apk = release.assets?.find(asset =>
    asset.name?.toLowerCase().endsWith(".apk")
  );

  if (!tag || !apk?.name) {
    return NextResponse.json(
      { error: "لا يوجد ملف APK منشور في أحدث إصدار حاليًا." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const downloadUrl = `${RELEASE_DOWNLOAD_BASE}/${encodeURIComponent(tag)}/${encodeURIComponent(apk.name)}`;
  return NextResponse.redirect(downloadUrl, 302);
}
