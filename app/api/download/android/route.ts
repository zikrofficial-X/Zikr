import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RELEASES_API = "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/latest";
const TAG_RELEASE_API = "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/tags";
const RELEASE_DOWNLOAD_BASE = "https://github.com/mohamedalaa7785-cpu/Zikr-Android-Releases/releases/download";

type GitHubRelease = {
  tag_name?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: Array<{ name?: string }>;
};

type AndroidReleaseSetting = {
  mode?: "auto" | "pinned";
  releaseTag?: string | null;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const githubHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ZIKR-platform-download",
};

async function fetchLatestStable(): Promise<GitHubRelease | null> {
  const response = await fetch(RELEASES_API, { headers: githubHeaders, cache: "no-store" });
  if (!response.ok) return null;
  const release = (await response.json()) as GitHubRelease;
  return release.draft || release.prerelease ? null : release;
}

async function fetchTaggedStable(tag: string): Promise<GitHubRelease | null> {
  if (!/^[A-Za-z0-9._-]+$/.test(tag)) return null;
  const response = await fetch(`${TAG_RELEASE_API}/${encodeURIComponent(tag)}`, { headers: githubHeaders, cache: "no-store" });
  if (!response.ok) return null;
  const release = (await response.json()) as GitHubRelease;
  return release.draft || release.prerelease ? null : release;
}

export async function GET() {
  try {
    let setting: AndroidReleaseSetting = { mode: "auto", releaseTag: null };
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("site_settings").select("value").eq("key", "android_release").maybeSingle();
      const value = data?.value as AndroidReleaseSetting | null;
      if (value?.mode === "pinned" && value.releaseTag) setting = { mode: "pinned", releaseTag: value.releaseTag };
    } catch {
      // If the optional admin setting is unavailable, safely fall back to latest.
    }

    const release = setting.mode === "pinned" && setting.releaseTag
      ? await fetchTaggedStable(setting.releaseTag)
      : await fetchLatestStable();
    const tag = release?.tag_name?.trim();
    const apk = release?.assets?.find(asset => asset.name?.toLowerCase().endsWith(".apk"));

    if (!tag || !apk?.name) {
      return NextResponse.json(
        { error: "تعذر العثور على APK صالح للإصدار المحدد حاليًا." },
        { status: 503, headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
      );
    }

    const downloadUrl = `${RELEASE_DOWNLOAD_BASE}/${encodeURIComponent(tag)}/${encodeURIComponent(apk.name)}`;
    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" },
    });
  } catch (error) {
    console.error("[android-download] release lookup failed:", error);
    return NextResponse.json(
      { error: "تعذر الوصول إلى إصدار تطبيق Android حاليًا." },
      { status: 503, headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
    );
  }
}
