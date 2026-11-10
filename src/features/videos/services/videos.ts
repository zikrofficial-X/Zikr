import "server-only";

import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";

import type { VideoCategory, Video } from "@/features/videos/types/videos";
import { FALLBACK_VIDEO_CATEGORIES, FALLBACK_VIDEOS } from "@/features/videos/data/fallback";
import { defaultOgImage } from "@/lib/site";
import { resolveVideoMediaUrl, resolveVideoThumbnail, resolveVideoYoutubeId } from "./video-media-contract";

function isPubliclyRenderableVideo(row: Record<string, unknown>): boolean {
  return Boolean(resolveVideoMediaUrl(row));
}

// Videos
export async function getVideoCategories(): Promise<VideoCategory[]> {
  if (!isSupabaseConfigured()) return FALLBACK_VIDEO_CATEGORIES;
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/video_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&slug=neq.kids-stories&order=name_ar.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch video categories:", error);
    return [];
  });

  if (rows.length === 0) return FALLBACK_VIDEO_CATEGORIES;

  return rows.map(r => ({
    id: r.id as string,
    nameAr: r.name_ar as string,
    nameEn: r.name_en as string,
    slug: r.slug as string,
    icon: r.icon as string | undefined,
  }));
}

export async function getVideos(
  categoryId?: string,
  limit = 20
): Promise<Video[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const fallback = categoryId && categoryId !== "all"
    ? FALLBACK_VIDEOS.filter((video) => video.categoryId === categoryId)
    : FALLBACK_VIDEOS;

  if (!isSupabaseConfigured()) return fallback.slice(0, safeLimit);
  // The general video catalog must never mix child-directed media into the
  // public feed. Kids content is served only by the dedicated Kids experience.
  let query =
    "/rest/v1/videos?select=id,title,slug,description,youtube_id,thumbnail_url,duration,views,published,category_id,metadata,created_at&published=eq.true&or=(metadata->>audience.is.null,metadata->>audience.neq.kids)&order=created_at.desc";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
  }

  query += `&limit=${Math.min(100, safeLimit * 2)}`;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    query
  ).catch(error => {
    console.error("[content] Failed to fetch videos:", error);
    return [];
  });

  if (rows.length === 0) return fallback.slice(0, safeLimit);
  const renderableRows = rows.filter(isPubliclyRenderableVideo);
  if (renderableRows.length === 0) return fallback.slice(0, safeLimit);

  return renderableRows.slice(0, safeLimit).map(r => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    description: r.description as string | undefined,
    youtubeId: resolveVideoYoutubeId(r) ?? undefined,
    thumbnailUrl: resolveVideoThumbnail(r, defaultOgImage),
    duration: (r.duration as number) || undefined,
    views: (r.views as number) || 0,
    published: r.published as boolean,
    categoryId: r.category_id as string | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  }));
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const safeSlug = encodeURIComponent(slug?.trim() ?? '');
  if (!safeSlug) return null;
  if (!isSupabaseConfigured()) return FALLBACK_VIDEOS.find((video) => video.slug === slug.trim()) ?? null;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/videos?select=*&slug=eq.${safeSlug}&published=eq.true&or=(metadata->>audience.is.null,metadata->>audience.neq.kids)&limit=1`,
    { timeoutMs: 8000, retries: 1, cache: "force-cache", next: { revalidate: 900 } },
  ).catch(error => {
    console.error("[content] Failed to fetch video by slug:", error);
    return [];
  });

  if (!rows.length || !isPubliclyRenderableVideo(rows[0])) {
    return FALLBACK_VIDEOS.find((video) => video.slug === slug.trim()) ?? null;
  }
  const r = rows[0];

  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    description: r.description as string | undefined,
    youtubeId: resolveVideoYoutubeId(r) ?? undefined,
    thumbnailUrl: resolveVideoThumbnail(r, defaultOgImage),
    duration: (r.duration as number) || undefined,
    views: (r.views as number) || 0,
    published: r.published as boolean,
    categoryId: r.category_id as string | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  };
}


function hasPassedKidsVideoQa(metadata: Record<string, unknown>): boolean {
  const qa = metadata.automatedVideoQa && typeof metadata.automatedVideoQa === "object" && !Array.isArray(metadata.automatedVideoQa)
    ? metadata.automatedVideoQa as Record<string, unknown>
    : {};
  return metadata.audience === "kids" &&
    metadata.kidsVideoQaStatus === "passed" &&
    qa.status === "passed";
}

export async function getKidsGeneratedVideos(limit = 60): Promise<Video[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  if (!isSupabaseConfigured()) return [];

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/videos?select=id,title,slug,description,youtube_id,thumbnail_url,duration,views,published,category_id,metadata,created_at&published=eq.true&metadata->>audience=eq.kids&order=created_at.desc&limit=" + safeLimit,
  ).catch(() => []);

  return (rows ?? [])
    .filter((row) => {
      const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? row.metadata as Record<string, unknown>
        : {};
      return hasPassedKidsVideoQa(metadata) &&
        metadata.generator === "zikr_internal_video_factory" &&
        isPubliclyRenderableVideo(row);
    })
    .slice(0, safeLimit)
    .map((row) => ({
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      description: row.description as string | undefined,
      youtubeId: resolveVideoYoutubeId(row) ?? undefined,
      thumbnailUrl: resolveVideoThumbnail(row, defaultOgImage),
      duration: (row.duration as number) || undefined,
      views: (row.views as number) || 0,
      published: row.published as boolean,
      categoryId: row.category_id as string | undefined,
      metadata: row.metadata as Record<string, unknown> | undefined,
      createdAt: row.created_at as string,
    }));
}

export async function getKidsGeneratedVideoBySlug(slug: string): Promise<Video | null> {
  const safeSlug = encodeURIComponent(slug?.trim() ?? "");
  if (!safeSlug || !isSupabaseConfigured()) return null;
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/videos?select=id,title,slug,description,youtube_id,thumbnail_url,duration,views,published,category_id,metadata,created_at&slug=eq." +
      safeSlug + "&published=eq.true&metadata->>audience=eq.kids&limit=1",
    { timeoutMs: 8000, retries: 1, cache: "no-store" },
  ).catch(() => []);
  const row = rows?.[0];
  const metadata = row?.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {};
  if (!row || !hasPassedKidsVideoQa(metadata) ||
      metadata.generator !== "zikr_internal_video_factory" ||
      !isPubliclyRenderableVideo(row)) return null;
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string | undefined,
    youtubeId: resolveVideoYoutubeId(row) ?? undefined,
    thumbnailUrl: resolveVideoThumbnail(row, defaultOgImage),
    duration: (row.duration as number) || undefined,
    views: (row.views as number) || 0,
    published: row.published as boolean,
    categoryId: row.category_id as string | undefined,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at as string,
  };
}

export async function getInternalGeneratedVideos(limit = 24): Promise<Video[]> {
  const rows = await getVideos(undefined, Math.max(1, Math.min(100, Math.trunc(limit))));
  return rows.filter((video) => {
    const metadata = video.metadata ?? {};
    return metadata.generator === "zikr_internal_video_factory" &&
      (typeof metadata.generatedVideoUrl === "string" ||
        typeof metadata.sourceVideoUrl === "string" ||
        Boolean(video.youtubeId));
  });
}
