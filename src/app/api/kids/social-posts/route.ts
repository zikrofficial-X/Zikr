import { NextResponse } from "next/server";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

export const dynamic = "force-dynamic";

type KidsWrittenPostRow = {
  id: string;
  title: string;
  body: string | null;
  target_platforms: string[] | null;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function GET() {
  try {
    const rows = await supabaseServerAdminRequest<KidsWrittenPostRow[]>(
      "/rest/v1/social_publish_queue?content_type=eq.written_post&status=eq.published&metadata->>audience=eq.kids&select=id,title,body,target_platforms,published_at,metadata&order=published_at.desc&limit=12",
    );

    const items = (rows ?? []).flatMap((row) => {
      const metadata = asRecord(row.metadata);
      const source = asRecord(metadata.source);
      const ageGroup = typeof metadata.ageGroup === "string" ? metadata.ageGroup : null;
      const rawPath = typeof metadata.publicPath === "string" ? metadata.publicPath : "";
      const publicPath = /^\/kids\/[a-z0-9-]+$/i.test(rawPath) ? rawPath : null;
      const platforms = (row.target_platforms ?? []).filter((platform) =>
        platform === "facebook" || platform === "facebook_reels" || platform === "youtube",
      );
      if (!row.title?.trim() || !row.body?.trim() || !row.published_at || !publicPath) return [];
      return [{
        id: row.id,
        title: row.title,
        body: row.body.slice(0, 4500),
        publishedAt: row.published_at,
        ageGroup,
        publicPath,
        sourceTitle: typeof source.title === "string" ? source.title : null,
        platforms,
      }];
    });

    return NextResponse.json(items, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[api/kids/social-posts] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch Kids social posts" }, { status: 503 });
  }
}
