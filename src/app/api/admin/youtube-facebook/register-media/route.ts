import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/features/admin/services/admin";

const BUCKET = "youtube-facebook-media";
const PUBLIC_URL_PREFIX = "/storage/v1/object/public/";
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreFilename(filename: string, title: string) {
  const stem = normalize(filename.replace(/\.[^/.]+$/, ""));
  const target = normalize(title);
  if (!stem || !target) return 0;
  if (stem === target) return 1;
  const targetTokens = [...new Set(target.split(" ").filter((token) => token.length > 2))];
  if (!targetTokens.length) return 0;
  let matched = 0;
  for (const token of targetTokens) if (stem.includes(token)) matched += 1;
  return matched / targetTokens.length;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      sourceVideoId?: string;
      path?: string;
      publicUrl?: string;
      filename?: string;
      mimeType?: string;
      size?: number;
      matchMethod?: string;
      matchScore?: number;
    };

    const sourceVideoId = String(body.sourceVideoId ?? "").trim();
    const path = String(body.path ?? "").trim();
    const publicUrl = String(body.publicUrl ?? "").trim();
    const filename = String(body.filename ?? "").trim();
    const mimeType = String(body.mimeType ?? "").trim().toLowerCase();
    const size = Number(body.size ?? 0);

    if (!VIDEO_ID_RE.test(sourceVideoId)) {
      return NextResponse.json({ error: "sourceVideoId must be an 11-character YouTube ID" }, { status: 400 });
    }
    if (!path.startsWith(`imports/${sourceVideoId}-`)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }
    if (!path.endsWith(filename) || path.includes("..")) {
      return NextResponse.json({ error: "Invalid uploaded filename/path" }, { status: 400 });
    }
    if (!publicUrl.includes(PUBLIC_URL_PREFIX + BUCKET + "/")) {
      return NextResponse.json({ error: "Invalid public media URL" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: job, error: lookupError } = await supabase
      .from("social_sync_jobs")
      .select("id,source_video_id,title,status,facebook_post_id")
      .eq("source_video_id", sourceVideoId)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!job) {
      return NextResponse.json({ error: "YouTube video is not present in the synchronization queue" }, { status: 404 });
    }
    if (job.facebook_post_id || job.status === "published") {
      return NextResponse.json({ error: "This video is already published and cannot be replaced" }, { status: 409 });
    }

    const method = String(body.matchMethod ?? "manual").slice(0, 32);
    const rawScore = Number(body.matchScore ?? scoreFilename(filename, job.title));
    const matchScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(1, rawScore)) : 0;

    const { error: updateError } = await supabase
      .from("social_sync_jobs")
      .update({
        source_media_path: path,
        source_media_url: publicUrl,
        source_media_mime: mimeType || null,
        source_media_size: Number.isFinite(size) ? size : null,
        source_media_uploaded_at: new Date().toISOString(),
        source_media_match_method: method,
        source_media_match_score: matchScore,
        status: "pending",
        attempts: 0,
        last_error: null,
        retryable: true,
        next_attempt_at: new Date().toISOString(),
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .is("facebook_post_id", null)
      .in("status", ["waiting_media", "failed", "pending"]);

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      sourceVideoId,
      jobId: job.id,
      status: "pending",
      matchMethod: method,
      matchScore,
    });
  } catch (error) {
    console.error("[youtube-facebook/register-media] Unexpected error", error);
    return NextResponse.json({ error: "Unable to register uploaded media" }, { status: 500 });
  }
}
