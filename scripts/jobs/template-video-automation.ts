import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import {
  supabaseServerAdminCount,
  supabaseServerAdminRequest,
} from "../../src/lib/supabase/server";

const execFileAsync = promisify(execFile);
const BATCH_SIZE = Math.max(1, Number(process.env.AUTO_VIDEO_BATCH_SIZE ?? 1));
const VIDEO_SECONDS = Math.min(30, Math.max(8, Number(process.env.AUTO_VIDEO_SECONDS ?? 14)));

type QuranRow = {
  surah_id: number;
  ayah_number: number;
  text_ar: string;
  text_uthmani: string | null;
  audio_url: string | null;
};

type ExistingRow = { id: string; status: string; automation_key: string | null };
type GeneratedRequest = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: Record<string, unknown>;
  status: string;
  automation_key: string | null;
};

function siteUrl() {
  return "https://zikrmediaofficial.vercel.app";
}

function dayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}
function slotIndex(date = new Date()) {
  return Math.floor(date.getUTCHours() / 6);
}
function wrapArabic(value: string, max = 30) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 10);
}
function assEscape(value: string) {
  return value.replace(/[{}]/g, "").replace(/\\/g, "\\\\");
}
function makeAss(text: string, title: string, sourceUrl: string) {
  const textLines = wrapArabic(text, 34);
  const sourceLines = wrapArabic(`المصدر: ${sourceUrl}`, 55);
  const events = [
    `Dialogue: 0,0:00:00.00,0:00:${VIDEO_SECONDS.toFixed(2).padStart(5, "0")},Title,,0,0,0,,${assEscape(title)}`,
    `Dialogue: 1,0:00:00.50,0:00:${Math.max(1, VIDEO_SECONDS - 1).toFixed(2).padStart(5, "0")},Verse,,0,0,0,,${textLines.map(assEscape).join("\\N")}`,
    `Dialogue: 2,0:00:${Math.max(1, VIDEO_SECONDS - 3).toFixed(2).padStart(5, "0")},0:00:${VIDEO_SECONDS.toFixed(2).padStart(5, "0")},Source,,0,0,0,,${sourceLines.map(assEscape).join("\\N")}`,
    `Dialogue: 3,0:00:00.00,0:00:${VIDEO_SECONDS.toFixed(2).padStart(5, "0")},Brand,,0,0,0,,ZIKR • ذِكرٌ`,
  ];
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\nScaledBorderAndShadow: yes\nYCbCr Matrix: TV.709\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Title,Noto Naskh Arabic,60,&H00EFD39A,&H00000000,&H00101513,&H60000000,1,0,0,0,100,100,0,0,1,2,2,8,55,55,120,1\nStyle: Verse,Noto Naskh Arabic,70,&H00FFFFFF,&H00000000,&H00101513,&H80000000,0,0,0,0,100,100,0,0,1,3,2,5,85,85,170,1\nStyle: Source,Noto Sans Arabic,24,&H00D8C8A6,&H00000000,&H00101513,&H60000000,0,0,0,0,100,100,0,0,1,1,1,2,55,55,115,1\nStyle: Brand,Noto Sans,26,&H00E1D3B3,&H00000000,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,9,45,45,55,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events.join("\n")}\n`;
}
async function getQuranRow(index: number): Promise<QuranRow> {
  const total = await supabaseServerAdminCount("quran_ayahs");
  if (!total) throw new Error("quran_ayahs is empty; cannot create an automatic video.");
  const offset = index % total;
  const rows = await supabaseServerAdminRequest<QuranRow[]>(
    `/rest/v1/quran_ayahs?select=surah_id,ayah_number,text_ar,text_uthmani,audio_url&order=surah_id.asc,ayah_number.asc&offset=${offset}&limit=1`,
  );
  const row = rows?.[0];
  if (!row) throw new Error(`No Quran ayah found at offset ${offset}.`);
  return row;
}
async function getSurahName(surahId: number) {
  const rows = await supabaseServerAdminRequest<Array<{ name_ar: string }>>(
    `/rest/v1/quran_surahs?id=eq.${surahId}&select=name_ar&limit=1`,
  );
  return rows?.[0]?.name_ar || `السورة ${surahId}`;
}
async function findByAutomationKey(table: string, key: string) {
  const rows = await supabaseServerAdminRequest<ExistingRow[]>(
    `/rest/v1/${table}?automation_key=eq.${encodeURIComponent(key)}&select=id,status,automation_key&limit=1`,
  );
  return rows?.[0] ?? null;
}
export async function seedAutomatedVideoRequests() {
  if (process.env.AUTO_VIDEO_ENABLED?.toLowerCase() === "false") return 0;
  const now = new Date();
  let created = 0;
  for (let i = 0; i < BATCH_SIZE; i += 1) {
    const slot = slotIndex(now) + i;
    const key = `quran:${dayIndex(now)}:${slot}`;
    if (await findByAutomationKey("video_generation_requests", key)) continue;
    const row = await getQuranRow(dayIndex(now) * 4 + slot);
    const surahName = await getSurahName(row.surah_id);
    const sourceUrl = `https://quran.com/${row.surah_id}/${row.ayah_number}`;
    await supabaseServerAdminRequest("/rest/v1/video_generation_requests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        title: `آية اليوم — ${surahName} ${row.surah_id}:${row.ayah_number}`,
        description: `فيديو تعليمي قصير يعرض آية موثقة من ${surahName} مع رابط المصدر.`,
        category: "quran",
        content: {
          renderer: "template",
          type: "quran",
          sourceType: "quran",
          sourceUrl,
          sourceLabel: `القرآن الكريم — ${surahName}، الآية ${row.ayah_number}`,
          surahId: row.surah_id,
          ayahNumber: row.ayah_number,
          textAr: row.text_uthmani || row.text_ar,
          audioUrl: row.audio_url,
          publicPath: `/quran/${row.surah_id}/${row.ayah_number}`,
          automationKey: key,
        },
        duration: VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      }),
    });
    created += 1;
  }
  return created;
}
function contentText(request: GeneratedRequest) {
  const content = request.content || {};
  for (const key of ["textAr", "text", "script", "prompt", "narration"]) {
    const value = content[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (typeof request.description === "string" && request.description.trim()) return request.description.trim();
  return "";
}
function contentSourceUrl(request: GeneratedRequest) {
  const value = request.content?.sourceUrl;
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : "https://zikrmediaofficial.vercel.app";
}
function contentAudioUrl(request: GeneratedRequest) {
  const value = request.content?.audioUrl;
  return typeof value === "string" && /^https:\/\//i.test(value.trim()) ? value.trim() : "";
}
function requestedVideoShape(request: GeneratedRequest) {
  const resolution = request.content?.resolution;
  if (typeof resolution === "string" && /^\d+x\d+$/.test(resolution)) return resolution;
  return request.content?.videoFormat === "horizontal" ? "1920x1080" : "1080x1920";
}
async function renderVideo(request: GeneratedRequest) {
  const text = contentText(request);
  if (!text) throw new Error("Template video requires text/script/narration content.");
  const sourceUrl = contentSourceUrl(request);
  const audioUrl = contentAudioUrl(request);
  const [width, height] = requestedVideoShape(request).split("x").map(Number);
  if (!width || !height) throw new Error("Invalid video resolution.");

  const temp = await mkdtemp(`${tmpdir()}/zikr-template-video-`);
  const assPath = `${temp}/captions.ass`;
  const outputPath = `${temp}/video.mp4`;
  const audioPath = `${temp}/recitation.m4a`;
  try {
    await writeFile(assPath, makeAss(text, request.title, sourceUrl), "utf8");
    const filter = [
      `subtitles=${assPath}:fontsdir=/usr/share/fonts/truetype/noto`,
      "eq=contrast=1.04:saturation=0.92:brightness=0.01",
      "vignette=PI/5",
      "format=yuv420p",
    ].join(",");
    const videoInput = `color=c=0x081D1A:s=${width}x${height}:r=30:d=${VIDEO_SECONDS}`;
    const args = ["-y", "-f", "lavfi", "-i", videoInput];
    if (audioUrl) {
      const response = await fetch(audioUrl, { headers: { Accept: "audio/*" }, signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`Audio download failed (HTTP ${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length < 1024) throw new Error("Audio download was empty or invalid.");
      await writeFile(audioPath, bytes);
      args.push("-i", audioPath);
    }
    args.push(
      "-vf", filter,
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "20",
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-r", "30",
      "-movflags", "+faststart",
      "-metadata:s:v:0", "language=ara",
    );
    if (audioUrl) {
      args.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-shortest", "-metadata:s:a:0", "language=ara");
    } else {
      args.push("-an");
    }
    args.push(outputPath);
    await execFileAsync("ffmpeg", args, { maxBuffer: 4 * 1024 * 1024 });

    const bytes = await readFile(outputPath);
    const storageKey = request.automation_key || request.id;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase storage environment is not configured.");
    const objectPath = `automated/${storageKey}.mp4`;
    const upload = await fetch(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/videos/${objectPath}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "video/mp4", "x-upsert": "true" },
      body: bytes,
      signal: AbortSignal.timeout(60_000),
    });
    if (!upload.ok) throw new Error(`Video storage upload failed (HTTP ${upload.status}): ${(await upload.text()).slice(0, 300)}`);
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/videos/${objectPath}`;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
async function queueSocialItems(request: GeneratedRequest, videoUrl: string) {
  const content = request.content;
  const key = request.automation_key || request.id;
  const publicPath = typeof content.publicPath === "string" && content.publicPath.startsWith("/") ? content.publicPath : "/quran";
  const targets: string[] = [];
  if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET && process.env.YOUTUBE_REFRESH_TOKEN) targets.push("youtube");
  if (process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN) targets.push("facebook_reels");
  if (!targets.length) return;
  const socialKey = `${key}:social-video`;
  if (!(await findByAutomationKey("social_publish_queue", socialKey))) {
    await supabaseServerAdminRequest("/rest/v1/social_publish_queue", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        content_type: `${request.category || "content"}_video`,
        content_id: request.id,
        title: request.title,
        body: `${request.description || ""}\n\nالمصدر: ${contentSourceUrl(request)}\n${siteUrl()}${publicPath}`,
        video_url: videoUrl,
        target_platforms: targets,
        status: "queued",
        metadata: { automationKey: socialKey, publicPath, videoFormat: content.videoFormat === "horizontal" ? "horizontal" : "vertical", sourceUrl: contentSourceUrl(request) },
        automation_key: socialKey,
      }),
    });
  }
}
export async function processTemplateVideoQueue(limit = BATCH_SIZE) {
  const rows = await supabaseServerAdminRequest<GeneratedRequest[]>(
    `/rest/v1/video_generation_requests?status=eq.pending&content->>renderer=eq.template&select=id,title,description,category,content,status,automation_key&order=created_at.asc&limit=${Math.max(1, Math.min(10, limit))}`,
  );
  let succeeded = 0;
  let failed = 0;
  for (const request of rows || []) {
    const claimed = await supabaseServerAdminRequest<GeneratedRequest[]>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}&status=eq.pending`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "processing", error_message: null, error_details: null, updated_at: new Date().toISOString() }) },
    );
    if (!claimed?.[0]) continue;
    try {
      const videoUrl = await renderVideo(request);
      await supabaseServerAdminRequest(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "completed", video_url: videoUrl, updated_at: new Date().toISOString(), error_message: null, error_details: null }),
      });
      await queueSocialItems(request, videoUrl);
      succeeded += 1;
      console.log(`[template-video] Completed ${request.id}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      await supabaseServerAdminRequest(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "failed", error_message: "Template generation failed", error_details: message.slice(0, 2000), updated_at: new Date().toISOString() }),
      });
      console.error(`[template-video] Failed ${request.id}: ${message}`);
    }
  }
  return { processed: (rows || []).length, succeeded, failed };
}
