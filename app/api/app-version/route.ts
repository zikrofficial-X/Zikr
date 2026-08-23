import { NextResponse } from "next/server";

const RELEASES_API =
  "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/latest";
const RELEASE_DOWNLOAD_BASE =
  "https://github.com/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/download";

export const revalidate = 300;

type ReleaseResponse = {
  tag_name?: string;
  name?: string;
  html_url?: string;
  published_at?: string;
  assets?: Array<{ name?: string }>;
};

export async function GET() {
  const response = await fetch(RELEASES_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ZIKR-platform-version-check",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "تعذر التحقق من أحدث إصدار حاليًا." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const release = (await response.json()) as ReleaseResponse;
  const tag = release.tag_name?.trim();
  const apk = release.assets?.find(asset =>
    asset.name?.toLowerCase().endsWith(".apk")
  );

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
      apkUrl: `${RELEASE_DOWNLOAD_BASE}/${encodeURIComponent(tag)}/${encodeURIComponent(apk.name)}`,
      releaseUrl:
        release.html_url ??
        `https://github.com/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/tag/${encodeURIComponent(tag)}`,
      publishedAt: release.published_at ?? null,
      name: release.name ?? `ZIKR Android ${tag}`,
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}

export function HEAD() {
  return new NextResponse(null, { status: 204 });
}

export const dynamic = "force-static";

void RELEASES_API;
void RELEASE_DOWNLOAD_BASE;
