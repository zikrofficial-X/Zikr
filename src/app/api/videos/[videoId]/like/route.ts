import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ videoId: string }> };
async function likeStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  videoId: string,
  authenticated: boolean,
) {
  const countQuery = supabase
    .from("video_like_counts")
    .select("like_count")
    .eq("video_id", videoId)
    .maybeSingle();

  const viewerQuery = authenticated
    ? supabase
        .from("video_likes")
        .select("video_id")
        .eq("video_id", videoId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [countResult, viewerResult] = await Promise.all([countQuery, viewerQuery]);
  if (countResult.error || viewerResult.error) {
    return NextResponse.json(
      { error: "تعذر تحميل عدد الإعجابات الآن." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    likeCount: Number(countResult.data?.like_count ?? 0),
    viewerLiked: Boolean(viewerResult.data),
    authenticated,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { videoId } = await context.params;
  if (!UUID_PATTERN.test(videoId)) return invalidId();

  const supabase = await createClient();
  const [{ data: { user } }, video] = await Promise.all([
    supabase.auth.getUser(),
    isPublicVideo(supabase, videoId),
  ]);
  if (video.error) {
    return NextResponse.json({ error: "تعذر التحقق من الفيديو." }, { status: 503 });
  }
  if (!video.exists) {
    return NextResponse.json({ error: "الفيديو غير موجود أو غير منشور." }, { status: 404 });
  }
  return likeStatus(supabase, videoId, Boolean(user));
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const { videoId } = await context.params;
  if (!UUID_PATTERN.test(videoId)) return invalidId();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "سجّل الدخول أولًا لتسجيل إعجابك." }, { status: 401 });
  }

  const video = await isPublicVideo(supabase, videoId);
  if (video.error) {
    return NextResponse.json({ error: "تعذر التحقق من الفيديو." }, { status: 503 });
  }
  if (!video.exists) {
    return NextResponse.json({ error: "الفيديو غير موجود أو غير منشور." }, { status: 404 });
  }

  const { error } = await supabase.from("video_likes").insert({
    video_id: videoId,
    user_id: user.id,
  });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "تعذر تسجيل الإعجاب الآن." }, { status: 503 });
  }
  return likeStatus(supabase, videoId, true);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { videoId } = await context.params;
  if (!UUID_PATTERN.test(videoId)) return invalidId();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "سجّل الدخول أولًا لإزالة إعجابك." }, { status: 401 });
  }

  const { error } = await supabase
    .from("video_likes")
    .delete()
    .eq("video_id", videoId)
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: "تعذر إزالة الإعجاب الآن." }, { status: 503 });
  }
  return likeStatus(supabase, videoId, true);
}
