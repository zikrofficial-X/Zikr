import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";

import type { VideoCategory, Video } from "@/features/videos/types/videos";
import { FALLBACK_VIDEO_CATEGORIES, FALLBACK_VIDEOS } from "@/features/videos/data/fallback";

// Videos
export async function getVideoCategories(): Promise<VideoCategory[]> {
  if (!isSupabaseConfigured()) return FALLBACK_VIDEO_CATEGORIES;
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/video_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&order=name_ar.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch video categories:", error);
    return FALLBACK_VIDEO_CATEGORIES;
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
  let query =
    "/rest/v1/videos?select=id,title,slug,description,youtube_id,thumbnail_url,duration,views,published,category_id,metadata,created_at&published=eq.true&order=created_at.desc";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
  }

  query += `&limit=${safeLimit}`;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    query
  ).catch(error => {
    console.error("[content] Failed to fetch videos:", error);
    return [];
  });

  if (rows.length === 0) return fallback.slice(0, safeLimit);

  return rows.map(r => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    description: r.description as string | undefined,
    youtubeId: r.youtube_id as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
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
    `/rest/v1/videos?select=*&slug=eq.${safeSlug}&published=eq.true&limit=1`
  ).catch(error => {
    console.error("[content] Failed to fetch video by slug:", error);
    return [];
  });

  if (!rows.length) return FALLBACK_VIDEOS.find((video) => video.slug === slug.trim()) ?? null;
  const r = rows[0];

  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    description: r.description as string | undefined,
    youtubeId: r.youtube_id as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    duration: (r.duration as number) || undefined,
    views: (r.views as number) || 0,
    published: r.published as boolean,
    categoryId: r.category_id as string | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  };
}

