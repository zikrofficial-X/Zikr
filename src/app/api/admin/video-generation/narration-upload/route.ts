import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
};

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi("video.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const extension = AUDIO_TYPES[contentType];
  if (!extension)
    return NextResponse.json(
      { error: "الصيغ المدعومة: MP3 أو M4A أو WAV أو OGG أو WebM." },
      { status: 415 }
    );

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_AUDIO_BYTES)
    return NextResponse.json(
      { error: "حجم التسجيل يجب ألا يتجاوز 15 ميغابايت." },
      { status: 413 }
    );

  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (!bytes.byteLength)
      return NextResponse.json({ error: "ملف الصوت فارغ." }, { status: 400 });
    if (bytes.byteLength > MAX_AUDIO_BYTES)
      return NextResponse.json(
        { error: "حجم التسجيل يجب ألا يتجاوز 15 ميغابايت." },
        { status: 413 }
      );

    const supabaseUrl = (
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      ""
    ).replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "تخزين الملفات غير مهيأ على الخادم." },
        { status: 503 }
      );
    }

    const objectPath = `human-narration/${randomUUID()}.${extension}`;
    const upload = await fetch(
      `${supabaseUrl}/storage/v1/object/videos/${objectPath}`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": contentType,
          "x-upsert": "false",
        },
        body: bytes,
        signal: AbortSignal.timeout(30_000),
      }
    );
    if (!upload.ok) {
      console.error(
        "[api/admin/video-generation/narration-upload] Storage HTTP",
        upload.status,
        (await upload.text()).slice(0, 300)
      );
      return NextResponse.json(
        { error: "تعذر حفظ التسجيل في التخزين. تحقق من إعدادات حاوية videos." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        audioUrl: `${supabaseUrl}/storage/v1/object/public/videos/${objectPath}`,
        audioSource: "human_recording",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api/admin/video-generation/narration-upload] POST:", error);
    return NextResponse.json(
      { error: "تعذر رفع التسجيل الصوتي." },
      { status: 500 }
    );
  }
}
