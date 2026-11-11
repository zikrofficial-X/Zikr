import { NextResponse } from "next/server";
import { getKidsGeneratedVideos } from "@/features/videos/services/videos";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { getConfirmedPublicKidsVideoSocialPlatforms, isPublicKidsVideoSocialQueueRow } from "@/features/social/services/kids-video-social-visibility";

export const dynamic = "force-dynamic";

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
  return getConfirmedPublicKidsVideoSocialPlatforms(row);
}

function publicSocialPublication(row: SocialQueueRow | null, stored: unknown) {
  const storedRecord = asRecord(stored);
  const storedPlatforms = Array.isArray(storedRecord.platforms)
    ? storedRecord.platforms.filter((platform): platform is string =>
        typeof platform === "string" &&
        (platform === "youtube" || platform === "facebook" || platform === "facebook_reels"))
    : [];
  // When a queue row exists it is the live source of truth. In particular, a
  // confirmed remote deletion must not be overridden by stale catalog metadata.
  const platforms = row ? confirmedSocialPlatforms(row) : storedPlatforms;
  if (platforms.length === 0) return null;
  const status: "published" | "partial" = row
    ? row.status === "published" ? "published" : "partial"
    : storedRecord.status === "published" ? "published" : "partial";
  let publishedAt: string | null = null;
  if (row) publishedAt = row.published_at;
  else if (typeof storedRecord.publishedAt === "string") publishedAt = storedRecord.publishedAt;

  return { status, platforms, publishedAt };
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
            ")&status=in.(published,partial)&published_at=not.is.null&metadata->>audience=eq.kids&select=content_id,content_type,body,target_platforms,status,published_at,created_at,metadata&order=created_at.desc&limit=300",
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
          !isPublicKidsVideoSocialQueueRow(row) ||
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
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[api/kids/videos] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch Kids videos" }, { status: 500 });
  }
}
