import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { ServiceError } from "@/lib/types/common";
import type { Story, StoryCategory } from "@/features/stories/types/stories";
import { PRIMARY_STORY_SOURCES, FALLBACK_STORIES } from "@/features/stories/data/fallback";

interface StoryRow {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  category: string;
  mood?: string;
  published?: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

function mapStoryRow(row: StoryRow): Story {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category as StoryCategory,
    metadata: row.metadata,
    primarySources: PRIMARY_STORY_SOURCES[row.slug],
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isStoryRow(item: unknown): item is StoryRow {
  if (!item || typeof item !== "object") return false;
  const row = item as Partial<StoryRow>;
  return Boolean(row.id && row.slug && row.title && row.category);
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const CACHE_TTL = 5 * 60 * 1000;
let cachedStories: { data: Story[]; timestamp: number } | null = null;

export async function getStories(limit = 100): Promise<Story[]> {
  try {
    if (cachedStories && Date.now() - cachedStories.timestamp < CACHE_TTL) {
      return cachedStories.data;
    }

    if (!hasSupabaseConfig()) {
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    let response: StoryRow[] | undefined;
    try {
      response = await supabaseServerAnonRequest<StoryRow[]>(
        `/rest/v1/stories?select=id,slug,title,summary,content,category,mood,metadata,published,created_at,updated_at&published=eq.true&limit=${limit}&order=created_at.desc`,
        { cache: "force-cache", next: { revalidate: 1800 } }
      );
    } catch (summaryError) {
      console.warn("[stories] Summary column may not exist, trying without it", summaryError);
      response = await supabaseServerAnonRequest<StoryRow[]>(
        `/rest/v1/stories?select=id,slug,title,category,published,created_at,updated_at&published=eq.true&limit=${limit}&order=created_at.desc`,
        { cache: "force-cache", next: { revalidate: 1800 } }
      );
    }

    if (!Array.isArray(response)) {
      console.warn("[stories] Invalid response type from Supabase, got:", typeof response);
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    if (response.length === 0) {
      console.warn("[stories] Supabase returned empty array, using fallback");
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    if (!response.every(isStoryRow)) {
      console.warn("[stories] Response validation failed, using fallback");
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    const mapped = response.map(mapStoryRow);
    cachedStories = { data: mapped, timestamp: Date.now() };
    return mapped;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[stories] Failed to fetch from Supabase:", errorMsg);

    if (error instanceof ServiceError) {
      console.error(
        "[stories] Service error code:",
        error.code,
        "Status:",
        error.statusCode
      );
    }

    return FALLBACK_STORIES;
  }
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const stories = await getStories();
  const story = stories.find((s) => s.slug === slug);
  return story || null;
}

export async function getStoriesByCategory(
  category: StoryCategory
): Promise<Story[]> {
  const stories = await getStories();
  return stories.filter((s) => s.category === category);
}

export async function getStoriesByIds(ids: string[]): Promise<Story[]> {
  if (!ids || ids.length === 0) return [];
  const stories = await getStories();
  return stories.filter((s) => ids.includes(s.id));
}

