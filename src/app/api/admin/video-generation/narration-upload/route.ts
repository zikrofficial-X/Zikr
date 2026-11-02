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

function hasValidAudioSignature(bytes: Uint8Array, contentType: string) {
  if (bytes.byteLength < 12) return false;
  const ascii = new TextDecoder().decode(bytes.slice(0, 12));

  if (contentType === "audio/mpeg" || contentType === "audio/mp3") {
    const id3 = ascii.startsWith("ID3");
    const frameSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    return id3 || frameSync;
  }

  if (contentType === "audio/mp4" || contentType === "audio/x-m4a") {
    return ascii.slice(4, 8) === "ftyp";
  }

  if (contentType === "audio/wav" || contentType === "audio/x-wav") {
    return ascii.slice(0, 4) === "RIFF" && ascii.slice(8, 12) === "WAVE";
  }

  if (contentType === "audio/ogg") {
    return ascii.slice(0, 4) === "OggS";
  }

  if (contentType === "audio/webm") {
    return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }

  return false;
}

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

    if (!hasValidAudioSignature(bytes, contentType)) {
      return NextResponse.json(
        { error: "محتوى الملف لا يطابق صيغة الصوت المعلنة." },
        { status: 415 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "تخزين التسجيلات غير مهيأ على الخادم." },
        { status: 503 }
      );
    }

    // Audio is uploaded directly to Cloudinary; it must not use the Supabase
    // videos bucket, which is reserved for no persistent generated-media files.
    const publicId = `audio-human-${randomUUID()}`;
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: contentType }), `${publicId}.${extension}`);
    form.append("public_id", publicId);
    form.append("overwrite", "false");
    form.append("invalidate", "true");
    const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
    const upload = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/video/upload`,
      {
        method: "POST",
        headers: { Authorization: authorization },
        body: form,
        signal: AbortSignal.timeout(30_000),
      }
    );
    const result = await upload.json().catch(() => ({})) as {
      secure_url?: string;
      public_id?: string;
      error?: { message?: string };
    };
    if (!upload.ok || !result.secure_url || result.public_id !== publicId) {
      console.error("[api/admin/video-generation/narration-upload] Cloudinary HTTP", upload.status, result.error?.message ?? "invalid upload response");
      return NextResponse.json(
        { error: "تعذر حفظ التسجيل في التخزين الخارجي." },
        { status: 502 }
      );
    }
    const audioUrl = new URL(result.secure_url);
    if (audioUrl.protocol !== "https:" || audioUrl.hostname !== "res.cloudinary.com" ||
        !audioUrl.pathname.includes(`/${cloudName}/video/upload/`)) {
      return NextResponse.json({ error: "رابط التخزين الناتج غير صالح." }, { status: 502 });
    }

    return NextResponse.json(
      { audioUrl: result.secure_url, audioSource: "human_recording" },
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
