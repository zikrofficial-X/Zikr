import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/features/admin/services/admin";

const BUCKET = "youtube-facebook-media";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
  "video/webm",
]);

function sanitizeFileName(value: string) {
  const ext = value.includes(".") ? `.${value.split(".").pop()!.toLowerCase()}` : ".mp4";
  const stem = value
    .replace(/\.[^/.]+$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return `${stem || "youtube-video"}${ext}`;
}

function extractYoutubeId(value: string) {
  const direct = value.match(/\b([A-Za-z0-9_-]{11})\b/);
  if (direct) return direct[1];
  return value.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1]
    ?? value.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts|embed)\/)([A-Za-z0-9_-]{11})/)?.[1]
    ?? null;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      filename?: string;
      contentType?: string;
      size?: number;
      youtubeVideoId?: string;
    };

    const filename = String(body.filename ?? "").trim();
    const contentType = String(body.contentType ?? "").trim().toLowerCase();
    const size = Number(body.size ?? 0);
    const youtubeVideoId = extractYoutubeId(String(body.youtubeVideoId ?? ""));

    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "A valid file size is required" }, { status: 400 });
    }
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "This project uses Supabase Free Storage; the maximum file size is 50 MB." },
        { status: 413 },
      );
    }
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Unsupported video type. Use MP4, MOV/M4V, or WebM." },
        { status: 400 },
      );
    }

    const safeName = sanitizeFileName(filename);
    const prefix = youtubeVideoId ?? crypto.randomUUID();
    const path = `imports/${prefix}-${crypto.randomUUID()}-${safeName}`;

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      console.error("[youtube-facebook/upload-url] Failed to create signed upload URL", error);
      return NextResponse.json(
        { error: error?.message ?? "Failed to create upload URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      bucket: BUCKET,
      path,
      token: data.token,
      youtubeVideoId,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
    });
  } catch (error) {
    console.error("[youtube-facebook/upload-url] Unexpected error", error);
    return NextResponse.json({ error: "Unable to prepare upload" }, { status: 500 });
  }
}
