import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  supabaseServerAdminCount,
  supabaseServerAdminRequest,
} from "../../src/lib/supabase/admin-rest";

const execFileAsync = promisify(execFile);
const BATCH_SIZE = Math.max(1, Number(process.env.AUTO_VIDEO_BATCH_SIZE ?? 1));
const TARGET_VIDEO_SECONDS = Math.min(45, Math.max(10, Number(process.env.AUTO_VIDEO_SECONDS ?? 16)));
const MIN_VIDEO_SECONDS = Math.min(TARGET_VIDEO_SECONDS, 10);
const MAX_VIDEO_SECONDS = Math.max(TARGET_VIDEO_SECONDS, 45);
const ARABIC_TTS_VOICE = process.env.ARABIC_TTS_VOICE ?? "ar-SA-ZariyahNeural";
const QURAN_AYAH_AUDIO_BASE_URL =
  process.env.QURAN_AYAH_AUDIO_BASE_URL?.trim() || "https://verses.quran.com/Alafasy/mp3";
const VIDEO_TEMPLATE_VERSION = "2026-10-02-quality-v2";
function getArabicTtsPython() {
  return process.env.ARABIC_TTS_PYTHON?.trim() || "python3";
}

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

function backgroundAsset(scene: AiVideoPlan["scene"]) {
  const map: Record<AiVideoPlan["scene"], string> = {
    calm: "public/video/templates/calm.svg",
    dawn: "public/video/templates/dawn.svg",
    night: "public/video/templates/night.svg",
    gold: "public/video/templates/gold.svg",
  };
  return map[scene] || map.calm;
}

async function renderBackground(temp: string, scene: AiVideoPlan["scene"], width: number, height: number) {
  const source = path.join(process.cwd(), backgroundAsset(scene));
  const output = path.join(temp, "background.png");
  await execFileAsync("rsvg-convert", ["-w", String(width), "-h", String(height), source, "-o", output], { maxBuffer: 2 * 1024 * 1024 });
  return output;
}

async function probeMedia(pathname: string) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries",
    "format=duration:stream=codec_type,codec_name,width,height,bit_rate,sample_rate,channels",
    "-of", "json",
    pathname,
  ], { maxBuffer: 2 * 1024 * 1024 });
  return JSON.parse(stdout) as {
    streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number; bit_rate?: string; sample_rate?: string; channels?: number }>;
    format?: { duration?: string };
  };
}

function resolveRenderDuration(audioDuration: number) {
  if (!Number.isFinite(audioDuration) || audioDuration <= 0) return TARGET_VIDEO_SECONDS;
  const desired = Math.max(MIN_VIDEO_SECONDS, audioDuration + 0.8);
  if (desired > MAX_VIDEO_SECONDS) {
    throw new Error("Narration is too long for an automated short: " + audioDuration.toFixed(1) + "s > " + MAX_VIDEO_SECONDS.toFixed(1) + "s max.");
  }
  return Math.min(MAX_VIDEO_SECONDS, desired);
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
function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    quran: "القرآن الكريم",
    hadith: "الحديث الشريف",
    dua: "دعاء",
    adhkar: "أذكار",
    story: "قصة",
    stories: "قصص",
    other: "رسالة إيمانية",
  };
  return labels[category] || "ذِكر";
}

function paginateArabic(value: string, lineChars: number, linesPerPage: number) {
  const lines = wrapArabic(value, lineChars);
  const pages: string[] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage).join("\\N"));
  }
  return pages.length ? pages : [value.trim()];
}

function makeAss(
  text: string,
  title: string,
  sourceUrl: string,
  reflection: string | null | undefined,
  duration: number,
  category: string,
  isVertical: boolean,
) {
  const playResX = isVertical ? 1080 : 1920;
  const playResY = isVertical ? 1920 : 1080;
  const lineChars = isVertical ? 30 : 52;
  const titleSize = isVertical ? 54 : 46;
  const verseSize = isVertical ? 66 : 56;
  const sourceSize = isVertical ? 23 : 20;
  const brandSize = isVertical ? 27 : 23;
  const reflectionSize = isVertical ? 31 : 27;
  const textPages = paginateArabic(text, lineChars, isVertical ? 3 : 2);
  const start = Math.min(1.2, duration * 0.08);
  const end = Math.max(start + 2, duration - 2);
  const totalChars = textPages.reduce((sum, page) => sum + page.replace(/\\N/g, "").length, 0) || 1;
  let cursor = start;
  const textEvents = textPages.map((page, index) => {
    const weight = (page.replace(/\\N/g, "").length || 1) / totalChars;
    const remaining = textPages.length - index - 1;
    const slice = remaining === 0 ? end - cursor : Math.max(2.2, weight * (end - start));
    const pageEnd = index === textPages.length - 1 ? end : Math.min(end, cursor + slice);
    const event = "Dialogue: 1,0:00:" + cursor.toFixed(2).padStart(5, "0") + ",0:00:" + pageEnd.toFixed(2).padStart(5, "0") + ",Verse,,0,0,0,," + assEscape(page);
    cursor = pageEnd;
    return event;
  });
  const badge = assEscape(categoryLabel(category));
  const source = assEscape("المصدر: " + sourceUrl);
  const reflectionText = reflection ? assEscape(reflection) : "";
  const events = [
    "Dialogue: 5,0:00:00.00,0:00:" + duration.toFixed(2).padStart(5, "0") + ",Badge,,0,0,0,," + badge,
    "Dialogue: 0,0:00:00.20,0:00:" + duration.toFixed(2).padStart(5, "0") + ",Title,,0,0,0,," + assEscape(title),
    "Dialogue: 3,0:00:00.00,0:00:" + duration.toFixed(2).padStart(5, "0") + ",Brand,,0,0,0,,ZIKR • ذِكرٌ",
    ...textEvents,
    "Dialogue: 2,0:00:" + Math.max(0.6, duration - 3).toFixed(2).padStart(5, "0") + ",0:00:" + duration.toFixed(2).padStart(5, "0") + ",Source,,0,0,0,," + source,
  ];
  if (reflectionText) {
    events.push("Dialogue: 4,0:00:" + Math.max(0.9, duration - 4.5).toFixed(2).padStart(5, "0") + ",0:00:" + Math.max(1.4, duration - 1.8).toFixed(2).padStart(5, "0") + ",Reflection,,0,0,0,," + reflectionText);
  }
  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: " + playResX,
    "PlayResY: " + playResY,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "YCbCr Matrix: TV.709",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Badge,Noto Sans Arabic,24,&H00F4D78A,&H00000000,&H00101513,&H9807110E,1,0,0,0,100,100,0,0,1,2,2,8,60,60,120,1",
    "Style: Title,Noto Naskh Arabic," + titleSize + ",&H00EFD39A,&H00000000,&H00101513,&H7007110E,1,0,0,0,100,100,0,0,1,2,2,8,70,70,215,1",
    "Style: Verse,Noto Naskh Arabic," + verseSize + ",&H00FFFFFF,&H00000000,&H00101513,&H9A07110E,0,0,0,0,100,100,0,0,1,3,3,5,100,100,190,1",
    "Style: Source,Noto Sans Arabic," + sourceSize + ",&H00D8C8A6,&H00000000,&H00101513,&H7007110E,0,0,0,0,100,100,0,0,1,1,1,2,70,70,105,1",
    "Style: Reflection,Noto Naskh Arabic," + reflectionSize + ",&H00EFD39A,&H00000000,&H00101513,&H7407110E,0,0,0,0,100,100,0,0,1,2,1,5,85,85,300,1",
    "Style: Brand,Noto Naskh Arabic," + brandSize + ",&H00E8D8B4,&H00000000,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,9,55,55,60,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...events,
    "",
  ].join("\n");
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
        duration: TARGET_VIDEO_SECONDS,
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
        duration: TARGET_VIDEO_SECONDS,
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
        duration: TARGET_VIDEO_SECONDS,
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

function validateSourceContent(request: GeneratedRequest) {
  const content = request.content || {};
  const text = contentText(request);
  if (!text) throw new Error("Template video requires text/script/narration content.");
  if (request.category === "quran") {
    const sourceType = typeof content.sourceType === "string" ? content.sourceType : "";
    const surahId = Number(content.surahId);
    const ayahNumber = Number(content.ayahNumber);
    const sourceUrl = typeof content.sourceUrl === "string" ? content.sourceUrl : "";
    if (sourceType !== "quran" || !Number.isInteger(surahId) || surahId < 1 || surahId > 114 || !Number.isInteger(ayahNumber) || ayahNumber < 1 || !sourceUrl) {
      throw new Error("Quran video rejected: verified surah, ayah, and source URL are required. Generic placeholder scripts are not publishable as Quran content.");
    }
  }
  if (request.category === "hadith" && text.length < 12) throw new Error("Hadith video rejected: source text is too short.");
  if (request.category === "dua" && text.length < 8) throw new Error("Dua video rejected: source text is too short.");
}

async function getVerifiedQuranAyahAudioUrl(surahId: number, ayahNumber: number) {
  const url = QURAN_AYAH_AUDIO_BASE_URL.replace(/\/$/, "") + "/" + String(surahId).padStart(3, "0") + String(ayahNumber).padStart(3, "0") + ".mp3";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1023", Accept: "audio/mpeg" },
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok || response.status === 206) return url;
  } catch {}
  return null;
}

async function assertPlayableOutput(outputPath: string, expectedWidth: number, expectedHeight: number) {
  const probe = await probeMedia(outputPath);
  const streams = probe.streams ?? [];
  const video = streams.find((stream) => stream.codec_type === "video");
  const audio = streams.find((stream) => stream.codec_type === "audio");
  if (!video) throw new Error("Rendered output has no video stream.");
  if (!audio) throw new Error("Rendered output has no narration/audio stream.");
  const duration = Number(probe.format?.duration ?? 0);
  if (!Number.isFinite(duration) || duration < 1) throw new Error("Rendered output has an invalid duration.");
  if ((video.width ?? 0) !== expectedWidth || (video.height ?? 0) !== expectedHeight) {
    throw new Error("Rendered output resolution mismatch: expected " + expectedWidth + "x" + expectedHeight + ", got " + (video.width || 0) + "x" + (video.height || 0) + ".");
  }
  if (video.codec_name !== "h264") throw new Error("Unexpected video codec: " + (video.codec_name || "unknown"));
  if (audio.codec_name !== "aac") throw new Error("Unexpected audio codec: " + (audio.codec_name || "unknown"));
  const bitrate = Number(video.bit_rate ?? 0);
  if (Number.isFinite(bitrate) && bitrate > 0 && bitrate < 350_000) throw new Error("Rendered output video bitrate is too low: " + bitrate + "bps.");
}

function requestedVideoShape(request: GeneratedRequest) {
  const resolution = request.content?.resolution;
  if (typeof resolution === "string" && /^\d+x\d+$/.test(resolution)) return resolution;
  return request.content?.videoFormat === "horizontal" ? "1920x1080" : "1080x1920";
}

async function renderVideo(request: GeneratedRequest) {
  validateSourceContent(request);
  const text = contentText(request);
  const sourceUrl = contentSourceUrl(request);
  const [width, height] = requestedVideoShape(request).split("x").map(Number);
  if (!width || !height) throw new Error("Invalid video resolution.");

  const temp = await mkdtemp(tmpdir() + "/zikr-template-video-");
  const assPath = temp + "/captions.ass";
  const outputPath = temp + "/video.mp4";
  const audioPath = temp + "/narration.mp3";
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
      console.warn("[template-video] Gemini plan skipped for " + request.id + ": " + (error instanceof Error ? error.message : String(error)));
    }

    const persistedAi = request.content?.ai && typeof request.content.ai === "object"
      ? (request.content.ai as Partial<AiVideoPlan> & { scene?: AiVideoPlan["scene"]; motion?: AiVideoPlan["motion"] })
      : null;
    const scene = persistedAi?.scene === "dawn" || persistedAi?.scene === "night" || persistedAi?.scene === "gold" || persistedAi?.scene === "calm" ? persistedAi.scene : "calm";
    const motion = persistedAi?.motion === "fade" ? "fade" : "slow";
    const isVertical = height >= width;

    let audioUrl = contentAudioUrl(request);
    if (request.category === "quran" && !audioUrl) {
      const verifiedAyahAudio = await getVerifiedQuranAyahAudioUrl(Number(request.content?.surahId), Number(request.content?.ayahNumber));
      if (verifiedAyahAudio) {
        audioUrl = verifiedAyahAudio;
        request.content = { ...request.content, audioUrl: verifiedAyahAudio, audioSource: "quran-ayah-cdn" };
      }
    }

    const backgroundPath = await renderBackground(temp, scene, width, height);
    let audioKind = contentAudioKind(request, audioUrl);
    if (audioUrl) {
      const response = await fetch(audioUrl, { headers: { Accept: "audio/*" }, signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error("Audio download failed (HTTP " + response.status + ").");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length < 1024) throw new Error("Audio download was empty or invalid.");
      await writeFile(audioPath, bytes);
    } else {
      try {
        await execFileAsync(getArabicTtsPython(), ["scripts/generate-arabic-voice.py", "--text", text, "--output", audioPath, "--voice", ARABIC_TTS_VOICE], { maxBuffer: 4 * 1024 * 1024 });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error("Arabic TTS failed (python=" + getArabicTtsPython() + ", voice=" + ARABIC_TTS_VOICE + "): " + message);
      }
      audioKind = "arabic_tts_narration";
    }

    const audioProbe = await probeMedia(audioPath);
    const audioDuration = Number(audioProbe.format?.duration ?? 0);
    const duration = resolveRenderDuration(audioDuration);
    await writeFile(assPath, makeAss(text, request.title, sourceUrl, aiPlan.reflection || null, duration, request.category, isVertical), "utf8");

    const fadeOutStart = Math.max(0, duration - 0.8);
    const motionFilters = motion === "fade"
      ? ["fade=t=in:st=0:d=0.7", "fade=t=out:st=" + fadeOutStart.toFixed(2) + ":d=0.8"]
      : ["fade=t=in:st=0:d=0.5"];
    const cardX = Math.round(width * 0.07);
    const cardY = Math.round(height * 0.245);
    const cardW = width - cardX * 2;
    const cardH = Math.round(height * 0.46);
    const filter = [
      "drawbox=x=" + cardX + ":y=" + cardY + ":w=" + cardW + ":h=" + cardH + ":color=0x06110D@0.58:t=fill",
      "drawbox=x=" + cardX + ":y=" + cardY + ":w=" + cardW + ":h=" + cardH + ":color=0xEFD39A@0.18:t=2",
      "eq=contrast=1.05:saturation=0.94:brightness=0.00",
      "vignette=PI/5",
      ...motionFilters,
      "subtitles=" + assPath + ":fontsdir=/usr/share/fonts/truetype/noto",
      "format=yuv420p",
    ].join(",");

    const args = [
      "-y", "-loop", "1", "-framerate", "30", "-i", backgroundPath, "-i", audioPath,
      "-t", duration.toFixed(2),
      "-vf", filter,
      "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-profile:v", "high",
      "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart",
      "-metadata:s:v:0", "language=ara",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
      "-af", `loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur=${duration.toFixed(2)}s`,
      "-metadata:s:a:0", "language=ara",
      "-metadata", "title=" + request.title.slice(0, 180),
      "-metadata", "comment=ZIKR template " + VIDEO_TEMPLATE_VERSION,
      outputPath,
    ];
    await execFileAsync("ffmpeg", args, { maxBuffer: 4 * 1024 * 1024 });
    await assertPlayableOutput(outputPath, width, height);

    const bytes = await readFile(outputPath);
    const storageKey = request.automation_key || request.id;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase storage environment is not configured.");
    const objectPath = "automated/" + storageKey + ".mp4";
    const upload = await fetch(
      supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/videos/" + objectPath,
      {
        method: "POST",
        headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "video/mp4", "x-upsert": "true" },
        body: bytes,
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!upload.ok) throw new Error("Video storage upload failed (HTTP " + upload.status + "): " + (await upload.text()).slice(0, 300));
    request.content = {
      ...request.content,
      audio: {
        kind: audioKind,
        voice: audioKind === "arabic_tts_narration" ? ARABIC_TTS_VOICE : null,
        sourceUrl: audioUrl || null,
        generatedAt: new Date().toISOString(),
      },
      render: {
        templateVersion: VIDEO_TEMPLATE_VERSION,
        resolution: width + "x" + height,
        durationSeconds: duration,
        scene,
        motion,
        sourceLocked: request.category === "quran" || request.category === "hadith" || request.category === "dua",
        generatedAt: new Date().toISOString(),
      },
    };
    return supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/public/videos/" + objectPath;
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
    targets.push(content.videoFormat === "horizontal" ? "facebook" : "facebook_reels");
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
  const staleBefore = new Date(Date.now() - 30 * 60_000).toISOString();
  const stale = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/video_generation_requests?status=eq.processing&updated_at=lt.${encodeURIComponent(staleBefore)}&video_url=is.null&select=id&limit=50`,
  );
  for (const request of stale ?? []) {
    await supabaseServerAdminRequest(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}&status=eq.processing&video_url=is.null`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "pending",
          error_message: "تمت استعادة عملية عالقة تلقائيًا.",
          error_details: null,
          updated_at: new Date().toISOString(),
        }),
      },
    );
  }
  const rows = await supabaseServerAdminRequest<GeneratedRequest[]>(
    `/rest/v1/video_generation_requests?status=eq.pending&select=id,title,description,category,content,status,automation_key&order=created_at.asc&limit=${Math.max(1, Math.min(10, limit))}`,
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
