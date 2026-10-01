import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import {
  supabaseServerAdminCount,
  supabaseServerAdminRequest,
} from "../../src/lib/supabase/admin-rest";

const execFileAsync = promisify(execFile);
const BATCH_SIZE = Math.max(1, Number(process.env.AUTO_VIDEO_BATCH_SIZE ?? 1));
const VIDEO_SECONDS = Math.min(30, Math.max(8, Number(process.env.AUTO_VIDEO_SECONDS ?? 14)));
const ARABIC_TTS_VOICE = process.env.ARABIC_TTS_VOICE ?? "ar-SA-ZariyahNeural";

type QuranRow = {
  surah_id: number;
  ayah_number: number;
  text_ar: string;
  text_uthmani: string | null;
  audio_url: string | null;
};

type HadithRow = {
  id: string;
  hadith_number: string | null;
  text_ar: string;
  grade_ar: string | null;
  ref: string | null;
};

type DuaRow = {
  id: string;
  slug: string;
  title_ar: string;
  text_ar: string;
  occasion_ar: string | null;
  source_ar: string | null;
};

type ExistingRow = { id: string; status: string; automation_key: string | null };
type SocialQueueRow = {
  id: string;
  status: string;
  target_platforms: string[] | null;
  metadata: Record<string, unknown> | null;
};
type GeneratedRequest = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: Record<string, unknown>;
  status: string;
  automation_key: string | null;
  video_url?: string | null;
};

type AiVideoPlan = {
  reflection: string;
  socialCaption: string;
  scene: "calm" | "dawn" | "night" | "gold";
  motion: "fade" | "slow";
};

const DEFAULT_AI_VIDEO_PLAN: AiVideoPlan = {
  reflection: "",
  socialCaption: "",
  scene: "calm",
  motion: "slow",
};

const AI_SCENE_COLORS: Record<AiVideoPlan["scene"], string> = {
  calm: "0x081D1A",
  dawn: "0x173C34",
  night: "0x0C1528",
  gold: "0x2A2110",
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
function makeAss(text: string, title: string, sourceUrl: string, reflection?: string | null) {
  const textLines = wrapArabic(text, 34);
  const reflectionLines = reflection ? wrapArabic(reflection, 38) : [];
  const sourceLines = wrapArabic(`المصدر: ${sourceUrl}`, 55);
  const events = [
    `Dialogue: 0,0:00:00.00,0:00:${VIDEO_SECONDS.toFixed(2).padStart(5, "0")},Title,,0,0,0,,${assEscape(title)}`,
    `Dialogue: 1,0:00:00.50,0:00:${Math.max(1, VIDEO_SECONDS - 1).toFixed(2).padStart(5, "0")},Verse,,0,0,0,,${textLines.map(assEscape).join("\\N")}`,
    ...(reflectionLines.length > 0 ? [`Dialogue: 4,0:00:${Math.max(0.8, VIDEO_SECONDS - 4).toFixed(2).padStart(5, "0")},0:00:${Math.max(1, VIDEO_SECONDS - 1).toFixed(2).padStart(5, "0")},Reflection,,0,0,0,,${reflectionLines.map(assEscape).join("\\N")}`] : []),
    `Dialogue: 2,0:00:${Math.max(1, VIDEO_SECONDS - 3).toFixed(2).padStart(5, "0")},0:00:${VIDEO_SECONDS.toFixed(2).padStart(5, "0")},Source,,0,0,0,,${sourceLines.map(assEscape).join("\\N")}`,
    `Dialogue: 3,0:00:00.00,0:00:${VIDEO_SECONDS.toFixed(2).padStart(5, "0")},Brand,,0,0,0,,ZIKR • ذِكرٌ`,
  ];
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\nScaledBorderAndShadow: yes\nYCbCr Matrix: TV.709\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Title,Noto Naskh Arabic,60,&H00EFD39A,&H00000000,&H00101513,&H60000000,1,0,0,0,100,100,0,0,1,2,2,8,55,55,120,1\nStyle: Verse,Noto Naskh Arabic,70,&H00FFFFFF,&H00000000,&H00101513,&H80000000,0,0,0,0,100,100,0,0,1,3,2,5,85,85,170,1\nStyle: Source,Noto Sans Arabic,24,&H00D8C8A6,&H00000000,&H00101513,&H60000000,0,0,0,0,100,100,0,0,1,1,1,2,55,55,115,1\nStyle: Reflection,Noto Naskh Arabic,34,&H00EFD39A,&H00000000,&H00101513,&H60000000,0,0,0,0,100,100,0,0,1,2,1,5,80,80,280,1\nStyle: Brand,Noto Sans,26,&H00E1D3B3,&H00000000,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,9,45,45,55,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events.join("\n")}\n`;
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

async function getHadithRow(index: number): Promise<HadithRow> {
  const total = await supabaseServerAdminCount("hadiths");
  if (!total) throw new Error("hadiths is empty; cannot create an automatic hadith video.");
  const offset = index % total;
  const rows = await supabaseServerAdminRequest<HadithRow[]>(
    `/rest/v1/hadiths?select=id,hadith_number,text_ar,grade_ar,ref&published=eq.true&order=created_at.asc&offset=${offset}&limit=1`,
  );
  const row = rows?.[0];
  if (!row) throw new Error(`No published hadith found at offset ${offset}.`);
  return row;
}

async function getDuaRow(index: number): Promise<DuaRow> {
  const total = await supabaseServerAdminCount("duas");
  if (!total) throw new Error("duas is empty; cannot create an automatic dua video.");
  const offset = index % total;
  const rows = await supabaseServerAdminRequest<DuaRow[]>(
    `/rest/v1/duas?select=id,slug,title_ar,text_ar,occasion_ar,source_ar&published=eq.true&order=created_at.asc&offset=${offset}&limit=1`,
  );
  const row = rows?.[0];
  if (!row) throw new Error(`No published dua found at offset ${offset}.`);
  return row;
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
  const baseSlot = slotIndex(now);
  let created = 0;

  for (let i = 0; i < BATCH_SIZE; i += 1) {
    const slot = baseSlot + i;
    const day = dayIndex(now);
    const mode = slot % 4;

    let payload: Record<string, unknown>;
    let key = "";

    if (mode === 0 || mode === 1) {
      key = `quran:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const row = await getQuranRow(day * 4 + slot);
      const surahName = await getSurahName(row.surah_id);
      const sourceUrl = `https://quran.com/${row.surah_id}/${row.ayah_number}`;
      payload = {
        title: `آية اليوم — ${surahName} ${row.surah_id}:${row.ayah_number}`,
        description: `فيديو آلي يعرض آية موثقة من ${surahName} مع تصميم ذِكر ومصدر مباشر.`,
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
          aiMode: "source_locked",
        },
        duration: VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else if (mode === 2) {
      key = `hadith:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const row = await getHadithRow(day * 4 + slot);
      const sourceUrl = "https://sunnah.com";
      payload = {
        title: `حديث اليوم — رقم ${row.hadith_number || "مرجعي"}`,
        description: "فيديو آلي لحديث منشور في مكتبة ذِكر مع نص الحديث ودرجته ومرجع البحث.",
        category: "hadith",
        content: {
          renderer: "template",
          type: "hadith",
          sourceType: "hadith",
          sourceUrl,
          sourceLabel: `السنة النبوية — المرجع ${row.ref || row.hadith_number || "متاح في قاعدة البيانات"}`,
          textAr: row.text_ar,
          gradeAr: row.grade_ar,
          publicPath: "/hadith",
          automationKey: key,
          aiMode: "source_locked",
        },
        duration: VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else {
      key = `dua:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const row = await getDuaRow(day * 4 + slot);
      const sourceUrl = `https://zikrmediaofficial.vercel.app/dua/${row.slug}`;
      payload = {
        title: `دعاء اليوم — ${row.title_ar}`,
        description: row.occasion_ar || "دعاء موثق من مكتبة ذِكر.",
        category: "dua",
        content: {
          renderer: "template",
          type: "dua",
          sourceType: "dua",
          sourceUrl,
          sourceLabel: row.source_ar || "دعاء من مكتبة ذِكر",
          textAr: row.text_ar,
          occasionAr: row.occasion_ar,
          publicPath: `/dua/${row.slug}`,
          automationKey: key,
          aiMode: "source_locked",
        },
        duration: VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    }

    await supabaseServerAdminRequest("/rest/v1/video_generation_requests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload),
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
function aiPlanEnabled() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function normalizeAiVideoPlan(value: unknown): AiVideoPlan {
  if (!value || typeof value !== "object") return { ...DEFAULT_AI_VIDEO_PLAN };
  const candidate = value as Record<string, unknown>;
  const reflection = typeof candidate.reflection === "string" ? candidate.reflection : "";
  const socialCaption = typeof candidate.socialCaption === "string" ? candidate.socialCaption : "";
  const scene =
    candidate.scene === "dawn" ||
    candidate.scene === "night" ||
    candidate.scene === "gold" ||
    candidate.scene === "calm"
      ? candidate.scene
      : "calm";
  const motion = candidate.motion === "fade" || candidate.motion === "slow" ? candidate.motion : "slow";
  return {
    reflection: reflection.replace(/[<>]/g, "").replace(/\s+/g, " ").slice(0, 180),
    socialCaption: socialCaption.replace(/[<>]/g, "").replace(/\s+/g, " ").slice(0, 320),
    scene,
    motion,
  };
}

function parseGeminiJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function generateAiVideoPlan(request: GeneratedRequest): Promise<AiVideoPlan> {
  if (!aiPlanEnabled()) return { ...DEFAULT_AI_VIDEO_PLAN };
  const sourceText = contentText(request).slice(0, 5000);
  if (!sourceText) return { ...DEFAULT_AI_VIDEO_PLAN };

  const configuredModel = (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite").trim();
  const models = [...new Set([configuredModel, "gemini-3.5-flash-lite"])];
  const prompt = [
    "أنت مخطط محتوى بصري لمنصة ذِكر الإسلامية.",
    "المصدر أدناه موثق بالفعل. ممنوع تغيير نص المصدر أو اختراع نص ديني أو حكم شرعي جديد.",
    "صمّم خطة قصيرة لفيديو عمودي يُرندر محليًا بواسطة FFmpeg.",
    "أعد JSON فقط بالمفاتيح الإنجليزية التالية:",
    '{"reflection":"...","socialCaption":"...","scene":"calm|dawn|night|gold","motion":"fade|slow"}',
    "reflection: تأمل عربي قصير جدًا لا يتجاوز 110 أحرف، ولا ينسب قولًا جديدًا للمصدر.",
    "socialCaption: وصف/كابشن عربي قصير للنشر لا يتجاوز 220 حرفًا، بدون معلومات غير موجودة في المصدر.",
    "scene: اختر مشهدًا هادئًا من القائمة فقط.",
    "motion: fade أو slow فقط.",
    `العنوان: ${request.title}`,
    `المصدر: ${contentSourceUrl(request)}`,
    `النص:${sourceText}`,
  ].join("\n");

  let lastStatus = 0;
  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY || "")}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 260 },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.ok) {
      const payload = await response.json();
      const raw = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim() || "";
      console.log(`[template-video] Gemini plan generated with ${model}`);
      return normalizeAiVideoPlan(parseGeminiJson(raw));
    }

    lastStatus = response.status;
    if (![429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(`Gemini HTTP ${response.status} for ${model}`);
    }
    console.warn(`[template-video] Gemini HTTP ${response.status} for ${model}; trying free fallback model.`);
  }
  throw new Error(`Gemini HTTP ${lastStatus || 503} after free-model fallback`);
}

function contentAudioUrl(request: GeneratedRequest) {
  const value = request.content?.audioUrl;
  return typeof value === "string" && /^https:\/\//i.test(value.trim()) ? value.trim() : "";
}
function contentAudioKind(request: GeneratedRequest, audioUrl: string) {
  if (audioUrl) return request.category === "quran" ? "verified_quran_recitation" : "source_audio";
  return "arabic_tts_narration";
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
  const audioPath = `${temp}/narration.mp3`;
  try {
    let aiPlan: AiVideoPlan = { ...DEFAULT_AI_VIDEO_PLAN };
    try {
      aiPlan = await generateAiVideoPlan(request);
      request.content = {
        ...request.content,
        ai: {
          provider: "google-gemini",
          model: (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite").trim(),
          reflection: aiPlan.reflection || null,
          socialCaption: aiPlan.socialCaption || null,
          scene: aiPlan.scene,
          motion: aiPlan.motion,
          generatedAt: new Date().toISOString(),
          sourceLocked: true,
        },
      };
    } catch (error) {
      console.warn(`[template-video] Gemini plan skipped for ${request.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await writeFile(assPath, makeAss(text, request.title, sourceUrl, aiPlan.reflection || null), "utf8");
    const persistedAi = request.content?.ai && typeof request.content.ai === "object"
      ? (request.content.ai as Partial<AiVideoPlan> & { scene?: AiVideoPlan["scene"]; motion?: AiVideoPlan["motion"] })
      : null;
    const scene =
      persistedAi?.scene === "dawn" ||
      persistedAi?.scene === "night" ||
      persistedAi?.scene === "gold" ||
      persistedAi?.scene === "calm"
        ? persistedAi.scene
        : "calm";
    const motion = persistedAi?.motion === "fade" ? "fade" : "slow";
    const fadeOutStart = Math.max(0, VIDEO_SECONDS - 0.8);
    const motionFilters = motion === "fade"
      ? [`fade=t=in:st=0:d=0.7`, `fade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.8`]
      : [`fade=t=in:st=0:d=0.5`];
    const filter = [
      `subtitles=${assPath}:fontsdir=/usr/share/fonts/truetype/noto`,
      "eq=contrast=1.04:saturation=0.92:brightness=0.01",
      "vignette=PI/5",
      ...motionFilters,
      "format=yuv420p",
    ].join(",");
    const videoInput = `color=c=${AI_SCENE_COLORS[scene]}:s=${width}x${height}:r=30:d=${VIDEO_SECONDS}`;
    const args = ["-y", "-f", "lavfi", "-i", videoInput];
    let audioKind = contentAudioKind(request, audioUrl);
    if (audioUrl) {
      const response = await fetch(audioUrl, { headers: { Accept: "audio/*" }, signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`Audio download failed (HTTP ${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length < 1024) throw new Error("Audio download was empty or invalid.");
      await writeFile(audioPath, bytes);
      args.push("-i", audioPath);
    } else {
      await execFileAsync("python3", [
        "scripts/generate-arabic-voice.py",
        "--text", text,
        "--output", audioPath,
        "--voice", ARABIC_TTS_VOICE,
      ], { maxBuffer: 4 * 1024 * 1024 });
      audioKind = "arabic_tts_narration";
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
    if (audioUrl || audioKind === "arabic_tts_narration") {
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
    request.content = {
      ...request.content,
      audio: {
        kind: audioKind,
        voice: audioKind === "arabic_tts_narration" ? ARABIC_TTS_VOICE : null,
        sourceUrl: audioUrl || null,
        generatedAt: new Date().toISOString(),
      },
    };
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/videos/${objectPath}`;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
async function findSocialQueueByAutomationKey(key: string): Promise<SocialQueueRow | null> {
  const rows = await supabaseServerAdminRequest<SocialQueueRow[]>(
    `/rest/v1/social_publish_queue?automation_key=eq.${encodeURIComponent(key)}&select=id,status,target_platforms,metadata&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function queueSocialItems(request: GeneratedRequest, videoUrl: string) {
  const content = request.content;
  if (content.skipSocialPublish === true) {
    console.log(`[template-video] Social publishing skipped for test request ${request.id}`);
    return;
  }
  const key = request.automation_key || request.id;
  const publicPath =
    typeof content.publicPath === "string" && content.publicPath.startsWith("/")
      ? content.publicPath
      : "/quran";
  const targets: string[] = [];
  if (
    process.env.YOUTUBE_CLIENT_ID &&
    process.env.YOUTUBE_CLIENT_SECRET &&
    process.env.YOUTUBE_REFRESH_TOKEN
  ) {
    targets.push("youtube");
  }
  if (process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    targets.push("facebook_reels");
  }
  if (!targets.length) return;

  const socialKey = `${key}:social-video`;
  const existing = await findSocialQueueByAutomationKey(socialKey);

  if (!existing) {
    await supabaseServerAdminRequest("/rest/v1/social_publish_queue", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        content_type: `${request.category || "content"}_video`,
        content_id: request.id,
        title: request.title,
        body: [
          request.description || "",
          typeof content.ai === "object" && content.ai && typeof (content.ai as Record<string, unknown>).socialCaption === "string"
            ? String((content.ai as Record<string, unknown>).socialCaption)
            : "",
          `المصدر: ${contentSourceUrl(request)}`,
          `${siteUrl()}${publicPath}`,
        ].filter(Boolean).join("\n\n"),
        video_url: videoUrl,
        target_platforms: targets,
        status: "queued",
        metadata: {
          automationKey: socialKey,
          publicPath,
          videoFormat: content.videoFormat === "horizontal" ? "horizontal" : "vertical",
          sourceUrl: contentSourceUrl(request),
          authBlocked: false,
          attempts: 0,
          maxAttempts: 5,
          nextRetryAt: null,
          ai: content.ai && typeof content.ai === "object" ? content.ai : null,
        },
        automation_key: socialKey,
      }),
    });
    return;
  }

  const existingTargets = Array.isArray(existing.target_platforms)
    ? existing.target_platforms.filter(Boolean)
    : [];
  const desiredTargets = [...new Set([...existingTargets, ...targets])];
  const platformResults =
    existing.metadata?.platformResults && typeof existing.metadata.platformResults === "object"
      ? (existing.metadata.platformResults as Record<string, unknown>)
      : {};

  const newlyEnabledTargets = desiredTargets.filter(
    target =>
      targets.includes(target) &&
      !existingTargets.includes(target) &&
      !(
        platformResults[target] &&
        typeof platformResults[target] === "object" &&
        (platformResults[target] as { ok?: unknown }).ok === true
      ),
  );

  if (desiredTargets.length !== existingTargets.length || newlyEnabledTargets.length > 0) {
    await supabaseServerAdminRequest(
      `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(existing.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          video_url: videoUrl,
          target_platforms: desiredTargets,
          status: "queued",
          scheduled_at: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString(),
          metadata: {
            ...(existing.metadata ?? {}),
            authBlocked: false,
            nextRetryAt: null,
          },
        }),
      },
    );
  }
}

export async function reconcileCompletedVideoSocialQueue(limit = 100) {
  const rows = await supabaseServerAdminRequest<GeneratedRequest[]>(
    `/rest/v1/video_generation_requests?status=eq.completed&video_url=not.is.null&select=id,title,description,category,content,status,automation_key,video_url&order=updated_at.desc&limit=${Math.max(1, Math.min(500, limit))}`,
  );
  let reconciled = 0;
  for (const request of rows || []) {
    if (!request.video_url) continue;
    try {
      await queueSocialItems(request, request.video_url);
      reconciled += 1;
    } catch (error) {
      console.error(
        `[template-video] Failed to reconcile social queue for ${request.id}: `,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  return reconciled;
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
        body: JSON.stringify({
          status: "completed",
          video_url: videoUrl,
          content: request.content,
          updated_at: new Date().toISOString(),
          error_message: null,
          error_details: null,
        }),
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
