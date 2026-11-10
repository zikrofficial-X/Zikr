import { NextResponse } from "next/server";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { getServerEnv } from "@/lib/env";
import {
  buildPublicKidsWrittenPost,
  type CurrentKidsStory,
  type KidsWrittenQueueRow,
} from "@/features/social/services/written-content";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export async function GET() {
  // Preview and Development intentionally omit the production service-role key.
  // This is an optional public feed: return an empty list instead of a 503 or noisy error.
  if (!getServerEnv().SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  }

  try {
    const rows = await supabaseServerAdminRequest<KidsWrittenQueueRow[]>(
      "/rest/v1/social_publish_queue?content_type=eq.written_post&status=eq.published&metadata->>audience=eq.kids&select=id,content_type,content_id,title,body,target_platforms,status,published_at,metadata&order=published_at.desc&limit=12",
    );
    const candidateIds = [...new Set(
      (rows ?? [])
        .map((row) => row.content_id)
        .filter((id): id is string => typeof id === "string" && UUID_PATTERN.test(id)),
    )];
    if (candidateIds.length === 0) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
      });
    }

    // A post can remain in the social queue after its source story is unpublished.
    // Re-check the live source state so removed or no-longer-age-appropriate stories
    // cannot continue appearing in the public Kids feed.
    const sources = await supabaseServerAdminRequest<CurrentKidsStory[]>(
      "/rest/v1/kids_content?id=in.(" + candidateIds.join(",") + ")&type=eq.story&published=eq.true&is_active=eq.true&metadata->>age_appropriate=eq.true&select=id,slug,title_ar,age_group,type,published,is_active,metadata",
    );
    const sourceById = new Map((sources ?? []).map((source) => [source.id, source]));
    const items = (rows ?? []).flatMap((row) => {
      const source = row.content_id ? sourceById.get(row.content_id) : undefined;
      if (!source) return [];
      const item = buildPublicKidsWrittenPost(row, source);
      return item ? [item] : [];
    });

    return NextResponse.json(items, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("[api/kids/social-posts] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch Kids social posts" }, { status: 503 });
  }
}
