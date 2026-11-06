import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ videoId: string }> };
type LikeStatusRow = { like_count?: number | string; viewer_liked?: boolean };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidId() {
  return NextResponse.json({ error: "معرّف الفيديو غير صالح." }, { status: 400 });
}

async function isPublicVideo(supabase: Awaited<ReturnType<typeof createClient>>, videoId: string) {
  const { data, error } = await supabase
    .from("videos")
    .select("id")
    .eq("id", videoId)
    .eq("published", true)
    .maybeSingle();
  return { exists: Boolean(data), error };
}

async function likeStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  videoId: string,
  authenticated: boolean,
) {
  const { data, error } = await supabase.rpc("get_video_like_status", {
    p_video_id: videoId,
  });
  if (error) {
    return NextResponse.json(
      { error: "تعذر تحميل عدد الإعجابات الآن." },
      { status: 503 },
    );
  }
  const row = (Array.isArray(data) ? data[0] : data) as LikeStatusRow | null;
  return NextResponse.json({
    likeCount: Number(row?.like_count ?? 0),
    viewerLiked: row?.viewer_liked === true,
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
