import { NextResponse } from "next/server";
import { getKidsGeneratedVideos } from "@/features/videos/services/videos";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

export const dynamic = "force-dynamic";

const SOCIAL_PLATFORMS = new Set(["youtube", "facebook", "facebook_reels"]);

type SocialQueueRow = {
  content_id: string | null;
  content_type: string;
  body: string | null;
  target_platforms: string[] | null;
  status: string;
  published_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function confirmedSocialPlatforms(row: SocialQueueRow): string[] {
  const results = asRecord(row.metadata?.platformResults);
  const delivered = Object.entries(results)
    .filter(([platform, value]) => {
      if (!SOCIAL_PLATFORMS.has(platform)) return false;
      const result = asRecord(value);
      return result.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0;
    })
    .map(([platform]) => platform);
  if (delivered.length > 0) return delivered;
  return row.status === "published"
    ? (row.target_platforms ?? []).filter((platform) => SOCIAL_PLATFORMS.has(platform))
    : [];
}

function publicSocialPublication(row: SocialQueueRow | null, stored: unknown) {
  const storedRecord = asRecord(stored);
  const storedPlatforms = Array.isArray(storedRecord.platforms)
    ? storedRecord.platforms.filter((platform): platform is string =>
        typeof platform === "string" && SOCIAL_PLATFORMS.has(platform))
    : [];
  const platforms = storedPlatforms.length > 0 ? storedPlatforms : row ? confirmedSocialPlatforms(row) : [];
  if (platforms.length === 0) return null;
  return {
    status: storedRecord.status === "published" || row?.status === "published"
      ? "published"
      : "partial",
    platforms,
    publishedAt: typeof storedRecord.publishedAt === "string"
      ? storedRecord.publishedAt
      : row?.published_at ?? null,
  };
}

export async function GET() {
  try {
    // This service enforces published=true, audience=kids, the Kids generator marker,
    // a passed Kids-specific automated QA snapshot, and playable media.
    const videos = await getKidsGeneratedVideos(60);
    const requestIds = [...new Set(videos
      .map((video) => video.metadata?.videoGenerationRequestId)
      .filter((id): id is string => typeof id === "string" && id.length > 0))];

    let requestContentById = new Map<string, Record<string, unknown>>();
    const socialQueueByRequestId = new Map<string, SocialQueueRow>();
    if (requestIds.length > 0) {
      const filter = requestIds.map(encodeURIComponent).join(",");
      const [requests, socialRows] = await Promise.all([
        supabaseServerAdminRequest<Array<{ id: string; content: unknown }>>(
          "/rest/v1/video_generation_requests?id=in.(" + filter + ")&select=id,content",
        ).catch((error) => {
          console.warn("[api/kids/videos] Could not load linked story text:", error);
          return [];
        }),
        supabaseServerAdminRequest<SocialQueueRow[]>(
          "/rest/v1/social_publish_queue?content_id=in.(" + filter +
            ")&select=content_id,content_type,body,target_platforms,status,published_at,created_at,metadata&order=created_at.desc&limit=300",
        ).catch((error) => {
          console.warn("[api/kids/videos] Could not load linked social posts:", error);
          return [];
        }),
      ]);

      requestContentById = new Map<string, Record<string, unknown>>();
      for (const row of requests ?? []) requestContentById.set(row.id, asRecord(row.content));
      for (const row of socialRows ?? []) {
        if (
          !row.content_id ||
          !row.content_type.endsWith("_video") ||
          socialQueueByRequestId.has(row.content_id)
        ) continue;
        socialQueueByRequestId.set(row.content_id, row);
      }
    }

    const feed = videos.map((video) => {
      const metadata = video.metadata ?? {};
      const requestId = typeof metadata.videoGenerationRequestId === "string"
        ? metadata.videoGenerationRequestId
        : "";
      const requestContent = requestContentById.get(requestId) ?? {};
      const socialQueue = socialQueueByRequestId.get(requestId) ?? null;
      const storyText = typeof metadata.storyText === "string"
        ? metadata.storyText
        : [requestContent.textAr, requestContent.script, requestContent.text]
            .find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? null;
      const socialCaption = typeof metadata.socialCaption === "string" && metadata.socialCaption.trim()
        ? metadata.socialCaption
        : typeof socialQueue?.body === "string" && socialQueue.body.trim()
          ? socialQueue.body
          : null;

      return {
        id: video.id,
        title: video.title,
        slug: video.slug,
        description: video.description ?? null,
        thumbnailUrl: video.thumbnailUrl ?? null,
        createdAt: video.createdAt,
        storyText: storyText?.slice(0, 3000) ?? null,
        socialCaption: socialCaption?.slice(0, 4500) ?? null,
        seriesTitle: typeof metadata.seriesTitle === "string"
          ? metadata.seriesTitle
          : typeof requestContent.seriesTitle === "string" ? requestContent.seriesTitle : null,
        seasonNumber: Number.isInteger(metadata.seasonNumber)
          ? metadata.seasonNumber
          : Number.isInteger(requestContent.seasonNumber) ? requestContent.seasonNumber as number : null,
        episodeNumber: Number.isInteger(metadata.episodeNumber)
          ? metadata.episodeNumber
          : Number.isInteger(requestContent.episodeNumber) ? requestContent.episodeNumber as number : null,
        learningObjective: typeof metadata.learningObjective === "string"
          ? metadata.learningObjective
          : typeof requestContent.learningObjective === "string" ? requestContent.learningObjective : null,
        socialPublication: publicSocialPublication(socialQueue, metadata.socialPublication),
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
