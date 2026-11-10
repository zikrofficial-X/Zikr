import { NextResponse } from "next/server";
import { getKidsGeneratedVideos } from "@/features/videos/services/videos";

export const dynamic = "force-dynamic";

const SOCIAL_PLATFORMS = new Set(["youtube", "facebook", "facebook_reels"]);

function publicSocialPublication(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const platforms = Array.isArray(row.platforms)
    ? row.platforms.filter((platform): platform is string =>
        typeof platform === "string" && SOCIAL_PLATFORMS.has(platform))
    : [];
  if (platforms.length === 0) return null;
  return {
    status: row.status === "published" || row.status === "partial" ? row.status : null,
    platforms,
    publishedAt: typeof row.publishedAt === "string" ? row.publishedAt : null,
  };
}

export async function GET() {
  try {
    // getKidsGeneratedVideos enforces published=true, audience=kids,
    // the dedicated Kids generator marker, passed Kids QA, and playable media.
    const videos = await getKidsGeneratedVideos(60);
    const feed = videos.map((video) => {
      const metadata = video.metadata ?? {};
      return {
        id: video.id,
        title: video.title,
        slug: video.slug,
        description: video.description ?? null,
        thumbnailUrl: video.thumbnailUrl ?? null,
        createdAt: video.createdAt,
        storyText: typeof metadata.storyText === "string" ? metadata.storyText.slice(0, 3000) : null,
        socialCaption: typeof metadata.socialCaption === "string" ? metadata.socialCaption.slice(0, 4500) : null,
        seriesTitle: typeof metadata.seriesTitle === "string" ? metadata.seriesTitle : null,
        seasonNumber: Number.isInteger(metadata.seasonNumber) ? metadata.seasonNumber : null,
        episodeNumber: Number.isInteger(metadata.episodeNumber) ? metadata.episodeNumber : null,
        learningObjective: typeof metadata.learningObjective === "string" ? metadata.learningObjective : null,
        socialPublication: publicSocialPublication(metadata.socialPublication),
      };
    });

    return NextResponse.json(feed, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[api/kids/videos] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch Kids videos" }, { status: 500 });
  }
}
