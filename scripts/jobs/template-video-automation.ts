import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  supabaseServerAdminCount,
  supabaseServerAdminRequest,
} from "../../src/lib/supabase/admin-rest";
import { listVideoSources, resolveVideoSource } from "../../src/features/videos/services/video-sources";
import { listCuratedVideoSources, resolveCuratedVideoSource } from "../../src/features/videos/data/curated-content";
import { buildKidsSeriesEpisode, validateCanonicalKidsEpisodeSnapshot, validateGeneratedKidsEpisode } from "../../src/features/videos/data/kids-story-factory";
import { videoContentHash, sourceHash } from "../../src/features/videos/providers/content-hash";
import { getVideoEngineConfig } from "../../src/features/videos/providers/types";
import { getServerEnv } from "../../src/lib/env";
import { isVideoTemplateAssetAllowedForAudience, parseVideoTemplateConfig, videoTemplateAssetPath, videoTemplateScene, type VideoTemplateAudience } from "../../src/features/videos/services/template-config";
import { CURRENT_VIDEO_RENDERER_VERSION, versionedTemplateLabel } from "../../src/features/videos/services/video-template-version";
import { AI_VISUAL_POLICY_VERSION, aiVisualPolicyPromptLine } from "../../src/features/videos/providers/ai-visual-policy";
import { createVideoProviderRouter } from "../../src/features/videos/providers/provider-router";
import { getDefaultVideoVoiceProfile, getVideoVoiceProfile } from "../../src/features/videos/services/voice-profiles";
import { evaluateArabicNarrationText } from "../../src/features/videos/services/narration-quality";
import { resolveDeterministicVideoHook, resolveDeterministicVideoMotion, resolveDeterministicVideoScene } from "../../src/features/videos/services/video-creative-variation";
import { paginateCaptionText, planCaptionTimings, resolveVideoComposition, type VideoCompositionProfile } from "../../src/features/videos/services/video-composition";
import { resolveRenderDuration } from "../../src/features/videos/services/render-duration";
import { AUTOMATED_VIDEO_QA_ENGINE, AUTOMATED_VIDEO_QA_VERSION, REQUIRED_VIDEO_APPROVAL_CHECKS, createAutomatedVideoQaApproval, type VideoApprovalChecklist } from "../../src/features/videos/services/video-publish-approval";

const execFileAsync = promisify(execFile);
const BATCH_SIZE = Math.max(1, Number(process.env.AUTO_VIDEO_BATCH_SIZE ?? process.env.DAILY_VIDEO_TARGET ?? 10));
const TARGET_VIDEO_SECONDS = Math.min(45, Math.max(10, Number(process.env.AUTO_VIDEO_SECONDS ?? 18)));
const VIDEO_DEFAULT_TTS_PROFILE = process.env.ARABIC_TTS_PROFILE?.trim() || "hadith_male_msa";
const QURAN_AYAH_AUDIO_BASE_URL =
  process.env.QURAN_AYAH_AUDIO_BASE_URL?.trim() || "https://verses.quran.com/Alafasy/mp3";
const VIDEO_TEMPLATE_VERSION = CURRENT_VIDEO_RENDERER_VERSION;
const VIDEO_OUTPUT_CRF = Math.min(23, Math.max(16, Number(process.env.VIDEO_OUTPUT_CRF ?? 18) || 18));
const VIDEO_AUDIO_BITRATE = process.env.VIDEO_AUDIO_BITRATE?.trim() || "192k";
const engineConfig = () => getVideoEngineConfig();

async function isVideoGenerationPaused(): Promise<boolean> {
  try {
    const rows = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
      "/rest/v1/admin_settings?key=in.(video_automation_enabled,video_purge_in_progress)&select=key,value",
    );
    const settings = Object.fromEntries((rows ?? []).map(row => [row.key, row.value]));
    return settings.video_purge_in_progress === true || settings.video_automation_enabled === false;
  } catch (error) {
    console.error("[video-worker] Could not verify the production video-generation lock:", error);
    return true;
  }
}

/**
 * Upload completed MP4 bytes directly from the GitHub worker to Cloudinary.
 * Supabase remains the database/queue only; generated public videos are never
 * staged in Supabase Storage where Cloudinary and Meta reads consume Egress.
 */
async function uploadGeneratedVideoToCloudinary(bytes: Uint8Array, storageKey: string) {
  if (await isVideoGenerationPaused()) throw new Error("Video generation is paused by the administrator; upload was blocked before storage.");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary video upload is not configured; refusing to use Supabase Storage as a fallback.");
  }
  if (bytes.byteLength <= 0 || bytes.byteLength > 50 * 1024 * 1024) {
    throw new Error("Generated MP4 must be between 1 byte and 50 MiB before Cloudinary upload.");
  }
  const safeKey = storageKey.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "video";
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const publicId = "auto-" + safeKey + "-" + digest;
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: "video/mp4" }), publicId + ".mp4");
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("unique_filename", "false");
  form.append("invalidate", "true");
  form.append("tags", "zikr-generated,automated");
  const authorization = "Basic " + Buffer.from(apiKey + ":" + apiSecret).toString("base64");
  const response = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloudName) + "/video/upload", {
    method: "POST",
    headers: { Authorization: authorization },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json().catch(() => ({})) as {
    secure_url?: string;
    public_id?: string;
    bytes?: number;
    error?: { message?: string };
  };
  if (!response.ok || !payload.secure_url || payload.public_id !== publicId) {
    throw new Error(payload.error?.message || "Cloudinary MP4 upload failed (HTTP " + response.status + ").");
  }
  const delivery = new URL(payload.secure_url);
  if (delivery.protocol !== "https:" || delivery.hostname !== "res.cloudinary.com" ||
      !delivery.pathname.includes("/" + cloudName + "/video/upload/")) {
    throw new Error("Cloudinary returned an unexpected generated-video delivery URL.");
  }
  return { secureUrl: payload.secure_url, publicId, bytes: payload.bytes ?? bytes.byteLength };
}
const AI_ATTEMPTS_PER_RUN = Math.max(0, Math.min(4, Number(process.env.VIDEO_AI_ATTEMPTS_PER_RUN ?? 3) || 3));
let aiAttemptsUsed = 0;

function videoRetryDelayMinutes(attempt: number, requestId: string) {
  const seed = [...requestId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return Math.min(240, 2 ** Math.min(Math.max(0, attempt - 1), 7) * 5 + (seed % 7));
}

function getArabicTtsPython() {
  return process.env.ARABIC_TTS_PYTHON?.trim() || "python3";
}

function narrationProfileForRequest(request: GeneratedRequest) {
  const configured =
    typeof request.content?.voiceProfile === "string"
      ? request.content.voiceProfile
      : VIDEO_DEFAULT_TTS_PROFILE;
  const profile = getVideoVoiceProfile(configured);
  if (request.category === "quran") return getDefaultVideoVoiceProfile("quran");
  if (request.content?.audience === "kids" || request.category === "kids") return getDefaultVideoVoiceProfile("kids");
  return profile;
}

type QuranRow = {
  surah_id: number;
  ayah_number: number;
  text_ar: string;
  text_uthmani: string | null;
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
type GeneratedRequest = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: Record<string, unknown>;
  status: string;
  automation_key: string | null;
  video_url?: string | null;
  generation_attempts?: number | null;
  next_retry_at?: string | null;
  duration?: number | null;
};

type AiVideoPlan = {
  reflection: string;
  socialCaption: string;
  scene: "calm" | "dawn" | "night" | "gold" | "emerald" | "paper" | "rose";
  motion: "fade" | "slow";
};

const DEFAULT_AI_VIDEO_PLAN: AiVideoPlan = {
  reflection: "",
  socialCaption: "",
  scene: "calm",
  motion: "slow",
};

function siteUrl() {
  return getServerEnv().NEXT_PUBLIC_SITE_URL;
}

type BoundTemplateVersion = {
  label: string;
  config: NonNullable<ReturnType<typeof parseVideoTemplateConfig>>;
  audience: VideoTemplateAudience;
};

async function bindTemplateVersion(request: GeneratedRequest): Promise<BoundTemplateVersion | null> {
  const versionId = request.content?.templateVersionId;
  if (typeof versionId !== "string" || !versionId.trim()) return null;

  const preview = request.content.templatePreview === true;
  if (preview && request.content.skipSocialPublish !== true) {
    throw new Error("Template previews must remain excluded from public social publishing.");
  }

  const versions = await supabaseServerAdminRequest<Array<{
    id: string; template_id: string; version: number; config: unknown; status: string;
  }>>(
    `/rest/v1/video_template_versions?id=eq.${encodeURIComponent(versionId)}&select=id,template_id,version,config,status&limit=1`,
  );
  const version = versions?.[0];
  if (!version) throw new Error("Pinned video template version was not found.");
  if (!preview && version.status !== "active" && version.status !== "retired") {
    throw new Error("Video generation can only use an active or previously pinned approved template version.");
  }

  const templates = await supabaseServerAdminRequest<Array<{
    id: string; slug: string; audience: VideoTemplateAudience;
  }>>(
    `/rest/v1/video_templates?id=eq.${encodeURIComponent(version.template_id)}&select=id,slug,audience&limit=1`,
  );
  const template = templates?.[0];
  if (!template) throw new Error("Pinned video template definition was not found.");

  const config = parseVideoTemplateConfig(version.config);
  if (!config || !isVideoTemplateAssetAllowedForAudience(config.assetKey, template.audience)) {
    throw new Error("Pinned video template configuration failed renderer validation.");
  }

  const label = versionedTemplateLabel(template.slug, version.version);
  const requestedLabel = request.content.templateVersion;
  const templateIdentity = `${template.slug}@${version.version}`;
  if (
    typeof requestedLabel === "string" &&
    requestedLabel.trim() &&
    requestedLabel !== templateIdentity &&
    !requestedLabel.startsWith(templateIdentity + "+renderer:")
  ) {
    throw new Error("Pinned template version label does not match the immutable database version.");
  }

  request.content = {
    ...request.content,
    templateVersion: label,
    templateAssetKey: config.assetKey,
    templateAudience: template.audience,
    templateMotion: config.motion,
    templateConfigSnapshot: config,
    videoFormat: config.defaultFormat,
    resolution: config.defaultFormat === "vertical" ? "1080x1920" : "1920x1080",
  };

  return { label, config, audience: template.audience };
}

function backgroundAsset(scene: AiVideoPlan["scene"], content?: Record<string, unknown>) {
  const pinnedConfig = parseVideoTemplateConfig(content?.templateConfigSnapshot);
  const pinnedAudience: VideoTemplateAudience | null =
    content?.templateAudience === "kids" ? "kids" :
    content?.templateAudience === "general" ? "general" : null;
  if (pinnedConfig && pinnedAudience && isVideoTemplateAssetAllowedForAudience(pinnedConfig.assetKey, pinnedAudience)) {
    const assetPath = videoTemplateAssetPath(pinnedConfig.assetKey, pinnedAudience);
    if (assetPath) return assetPath;
  }
  if (content?.audience === "kids") {
    const kidThemes: Record<string, string> = {
      "kids-garden": "public/video/templates/kids-garden.svg",
      "kids-neighborhood": "public/video/templates/kids-neighborhood.svg",
      "kids-workshop": "public/video/templates/kids-workshop.svg",
      "kids-nature": "public/video/templates/kids-nature.svg",
    };
    const theme = typeof content.visualTheme === "string" ? content.visualTheme : "";
    if (kidThemes[theme]) return kidThemes[theme];
  }
  const map: Record<AiVideoPlan["scene"], string> = {
    calm: "public/video/templates/calm.svg",
    dawn: "public/video/templates/dawn.svg",
    night: "public/video/templates/night.svg",
    gold: "public/video/templates/gold.svg",
    emerald: "public/video/templates/emerald.svg",
    paper: "public/video/templates/paper.svg",
    rose: "public/video/templates/rose.svg",
  };
  return map[scene] || map.calm;
}

async function renderBackground(temp: string, scene: AiVideoPlan["scene"], width: number, height: number, content?: Record<string, unknown>) {
  const source = path.join(process.cwd(), backgroundAsset(scene, content));
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

function dayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}
const RLM = "\u200F";

/** Cleans spacing/punctuation so on-screen Arabic is tidy and shapes correctly in libass. */
function normalizeArabicText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u200B-\u200E\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/\u0640+/g, "")
    .replace(/\s*([،؛؟!:.])\s*/g, "$1 ")
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ") ")
    .replace(/\s+/g, " ")
    .trim();
}

function displaySource(label: string) {
  const trimmed = label.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return "\u200E" + new URL(trimmed).hostname.replace(/^www\./, "") + "\u200E";
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function assEscape(value: string) {
  // Keep the ASS line breaks created by the caption paginator, but strip user-supplied overrides.
  return value.split("\\N").map((part) => part.replace(/[{}\\]/g, "")).join("\\N");
}
function categoryLabel(category: string, audience?: unknown) {
  if (audience === "kids") return "قصص أطفال";
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
function audienceHook(category: string, audience?: unknown, seed = "") {
  return resolveDeterministicVideoHook({ id: seed, category, audience });
}
function audienceCta(category: string, audience?: unknown) {
  if (audience === "kids") return "اكتشفوا الحلقة القادمة معًا • تابعوا ذِكر";
  const labels: Record<string, string> = {
    quran: "تدبّر الآية واحفظها وشاركها",
    hadith: "تأمّل الحديث وطبّقه اليوم",
    dua: "احفظ الدعاء وكرّره",
    adhkar: "اجعل الذكر جزءًا من يومك",
    story: "تعلّم من القصة وشارك العبرة",
    stories: "تعلّم من القصة وشارك العبرة",
    other: "احفظ الرسالة وشاركها",
  };
  return (labels[category] ?? labels.other) + " • تابع ذِكر للمزيد";
}
function deterministicScene(request: GeneratedRequest): AiVideoPlan["scene"] {
  return resolveDeterministicVideoScene({
    id: request.id,
    category: request.category,
    audience: request.content?.audience,
  });
}

function paginateArabic(value: string, lineChars: number, linesPerPage: number) {
  return paginateCaptionText(normalizeArabicText(value), lineChars, linesPerPage);
}

function assTimestamp(seconds: number) {
  const totalCentiseconds = Math.max(0, Math.round(seconds * 100));
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const wholeSeconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return hours + ":" + String(minutes).padStart(2, "0") + ":" +
    String(wholeSeconds).padStart(2, "0") + "." + String(centiseconds).padStart(2, "0");
}

function makeAss(
  text: string,
  title: string,
  sourceUrl: string,
  reflection: string | null | undefined,
  duration: number,
  audioDuration: number,
  composition: VideoCompositionProfile,
  category: string,
  audience?: unknown,
  openingSeed = "",
) {
  const { width, height } = composition;
  const playResX = width;
  const playResY = height;
  const titleSize = composition.titleFontSize;
  const verseSize = composition.bodyFontSize;
  const sourceSize = composition.sourceCardStyle === "compact"
    ? (composition.isVertical ? 18 : 16)
    : (composition.isVertical ? 23 : 20);
  const brandSize = composition.isVertical ? 27 : 23;
  const reflectionSize = composition.isVertical ? 31 : 27;
  const baseFont = composition.fontFamily;
  const captionBorderStyle = composition.captionStyle === "boxed" ? 3 : 1;
  const captionOutline = composition.captionStyle === "minimal" ? 1 : 3;
  const captionShadow = composition.captionStyle === "minimal" ? 1 : 2;
  const captionBack = composition.captionStyle === "boxed" ? "&H9007110E" : "&H9A07110E";
  const sourceBorderStyle = composition.sourceCardStyle === "standard" ? 3 : 1;
  const sourceOutline = composition.sourceCardStyle === "standard" ? 8 : 1;
  const sourceOutlineColour = composition.sourceCardStyle === "standard" ? "&H7007110E" : "&H00101513";
  const sourceShadow = composition.sourceCardStyle === "standard" ? 0 : 1;
  const textPages = paginateArabic(text, composition.lineChars, composition.linesPerPage);
  const captionCues = planCaptionTimings(textPages, audioDuration);
  const bodyFont = composition.fontFamily;
  const textEvents = captionCues.map((cue) =>
    "Dialogue: 1," + assTimestamp(cue.start) + "," + assTimestamp(cue.end) +
    ",Verse,,0,0,0,,{\\fad(180,180)\\an5\\pos(" +
    composition.bodyX + "," + composition.bodyAnchorY + ")}" + assEscape(cue.text),
  );
  const badge = assEscape(categoryLabel(category, audience));
  const source = assEscape(RLM + "المصدر: " + displaySource(sourceUrl));
  const reflectionText = reflection ? assEscape(RLM + normalizeArabicText(reflection)) : "";
  const normalizedTitle = normalizeArabicText(title);
  const hookEnd = Math.min(2.4, Math.max(0.8, duration * 0.16));
  const events = [
    "Dialogue: 5,0:00:00.00," + assTimestamp(duration) + ",Badge,,0,0,0,," + badge,
    "Dialogue: 6,0:00:00.20," + assTimestamp(hookEnd) + ",Hook,,0,0,0,,{\\fad(180,260)}" + assEscape(audienceHook(category, audience, openingSeed)),
    "Dialogue: 0,0:00:00.12," + assTimestamp(duration) + ",Title,,0,0,0,,{\\fad(220,420)\\an8\\pos(" + composition.bodyX + "," + composition.titleY + ")}" + assEscape(normalizedTitle),
    "Dialogue: 3,0:00:00.00," + assTimestamp(duration) + ",Brand,,0,0,0,,ZIKR • ذِكرٌ",
    ...textEvents,
    "Dialogue: 2," + assTimestamp(Math.max(0.6, duration - 3)) + "," + assTimestamp(duration) + ",Source,,0,0,0,,{\\an2\\pos(" + composition.bodyX + "," + Math.round(height * 0.84) + ")}" + source,
  ];
  if (reflectionText) {
    events.push(
      "Dialogue: 4," + assTimestamp(Math.max(0.9, duration - 4.5)) + "," +
      assTimestamp(Math.max(1.4, duration - 1.8)) +
      ",Reflection,,0,0,0,,{\\an5\\pos(" + composition.bodyX + "," + Math.round(height * 0.77) + ")}" + reflectionText,
    );
  }
  events.push(
    "Dialogue: 7," + assTimestamp(Math.max(0.8, duration - 3.2)) + "," + assTimestamp(duration) +
    ",CTA,,0,0,0,,{\\fad(220,300)\\an2\\pos(" + composition.bodyX + "," + Math.round(height * 0.92) + ")}" + assEscape(audienceCta(category, audience)),
  );
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
    "Style: Badge," + baseFont + ",24," + composition.accentAss + ",&H00000000,&H00101513,&H9807110E,1,0,0,0,100,100,0,0,1,2,2,8,60,60,120,1",
    "Style: Hook," + baseFont + "," + (composition.isVertical ? 29 : 24) + ",&H00FFFFFF,&H00000000,&H00101513,&H6A07110E,1,0,0,0,100,100,0,0,1,1,1,8,70,70,165,1",
    "Style: Title," + baseFont + "," + titleSize + "," + composition.accentAss + ",&H00000000,&H00101513,&H7007110E,1,0,0,0,100,100,0,0,1,2,2,8,70,70,215,1",
    "Style: Verse," + bodyFont + "," + verseSize + ",&H00FFFFFF,&H00000000,&H00101513," + captionBack + ",0,0,0,0,100,100,0,0," + captionBorderStyle + "," + captionOutline + "," + captionShadow + ",5,100,100,190,1",
    "Style: Source," + baseFont + "," + sourceSize + ",&H00D8C8A6,&H00000000," + sourceOutlineColour + ",&H00000000,0,0,0,0,100,100,0,0," + sourceBorderStyle + "," + sourceOutline + "," + sourceShadow + ",2,70,70,105,1",
    "Style: Reflection," + baseFont + "," + reflectionSize + "," + composition.accentAss + ",&H00000000,&H00101513,&H7407110E,0,0,0,0,100,100,0,0,1,2,1,5,85,85,300,1",
    "Style: Brand," + baseFont + "," + brandSize + ",&H00E8D8B4,&H00000000,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,9,55,55,60,1",
    "Style: CTA," + baseFont + "," + (composition.isVertical ? 27 : 22) + "," + composition.accentAss + ",&H00000000,&H00101513,&H7A07110E,1,0,0,0,100,100,0,0,1,2,1,2,70,70,95,1",
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
  for (let attempt = 0; attempt < Math.min(total, 40); attempt += 1) {
    const offset = (index + attempt * 97) % total;
    const rows = await supabaseServerAdminRequest<QuranRow[]>(
      `/rest/v1/quran_ayahs?select=surah_id,ayah_number,text_ar,text_uthmani&order=surah_id.asc,ayah_number.asc&offset=${offset}&limit=1`,
    );
    const row = rows?.[0];
    if (row && (row.text_uthmani || row.text_ar).length <= 300) return row;
  }
  throw new Error("No short Quran ayah is available for an automated social video.");
}
async function getSurahName(surahId: number) {
  const rows = await supabaseServerAdminRequest<Array<{ name_ar: string }>>(
    `/rest/v1/quran_surahs?id=eq.${surahId}&select=name_ar&limit=1`,
  );
  return rows?.[0]?.name_ar || `السورة ${surahId}`;
}

async function getHadithRow(index: number): Promise<HadithRow> {
  const rows = await supabaseServerAdminRequest<HadithRow[]>(
    "/rest/v1/hadiths?select=id,hadith_number,text_ar,grade_ar,ref&published=eq.true&grade_ar=not.is.null&order=created_at.asc&limit=500",
  );
  const eligible = (rows ?? []).filter((row) => row.text_ar.trim().length >= 12 && row.text_ar.length <= 360 && row.grade_ar?.trim());
  if (!eligible.length) throw new Error("No short published hadith with a recorded grade is available.");
  return eligible[index % eligible.length];
}

async function getDuaRow(index: number): Promise<DuaRow> {
  const rows = await supabaseServerAdminRequest<DuaRow[]>(
    "/rest/v1/duas?select=id,slug,title_ar,text_ar,occasion_ar,source_ar&published=eq.true&source_ar=not.is.null&order=created_at.asc&limit=500",
  );
  const eligible = (rows ?? []).filter((row) => row.text_ar.trim().length >= 8 && row.text_ar.length <= 360 && row.source_ar?.trim());
  if (!eligible.length) throw new Error("No short published dua with a recorded source is available.");
  return eligible[index % eligible.length];
}

async function findByAutomationKey(table: string, key: string) {
  const rows = await supabaseServerAdminRequest<ExistingRow[]>(
    `/rest/v1/${table}?automation_key=eq.${encodeURIComponent(key)}&select=id,status,automation_key&limit=1`,
  );
  return rows?.[0] ?? null;
}
export const KIDS_SERIES_START_DAY_INDEX = dayIndex(new Date("2026-10-21T00:00:00.000Z"));

export async function seedAutomatedVideoRequests(batchSize = BATCH_SIZE) {
  if (process.env.AUTO_VIDEO_ENABLED?.toLowerCase() === "false") return 0;
  if (await isVideoGenerationPaused()) return 0;
  const now = new Date();
  const day = dayIndex(now);
  let created = 0;

  // Daily quota: keys are unique per UTC day (kind:day:counter) so every run can create new
  // videos, and the DAILY_VIDEO_TARGET is spread evenly across the day instead of bursting.
  // Urgent admin "Run Now" requests bypass the pacing and use the requested batch size.
  const todaysRows = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/video_generation_requests?automation_key=like.*:${day}:*&select=id&limit=1000`,
  );
  const alreadySeededToday = todaysRows?.length ?? 0;
  const dailyTarget = Math.max(1, Math.min(24, Number(process.env.DAILY_VIDEO_TARGET ?? 12) || 12));
  // The workflow runs in four six-hour UTC windows; release a quarter of the daily target per window.
  const scheduleWindow = Math.min(4, Math.max(1, Math.floor(now.getUTCHours() / 6) + 1));
  const dueByNow = Math.ceil((dailyTarget * scheduleWindow) / 4);
  const urgent = process.env.AUTO_VIDEO_URGENT?.toLowerCase() === "true";
  const allowed = urgent ? Math.min(10, batchSize) : Math.min(10, batchSize, Math.max(0, dueByNow - alreadySeededToday));

  for (let i = 0; i < allowed; i += 1) {
    if (await isVideoGenerationPaused()) break;
    const slot = alreadySeededToday + i;
    const mode = slot % 7;

    let payload: Record<string, unknown>;
    let key = "";

    const aiProviderHint =
      slot % 2 === 0 ? ("hf_ltx_fast" as const) : ("hf_wan" as const);

    if (mode === 0) {
      key = `quran:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const row = await getQuranRow(day * 16 + slot);
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
          sourceId: `quran:${row.surah_id}:${row.ayah_number}`,
          sourceUrl,
          sourceLabel: `القرآن الكريم — سورة ${surahName}، الآية ${row.ayah_number}`,
          surahId: row.surah_id,
          ayahNumber: row.ayah_number,
          textAr: row.text_uthmani || row.text_ar,
          audioUrl: null,
          publicPath: `/quran/${row.surah_id}/${row.ayah_number}`,
          automationKey: key,
          aiMode: "source_locked",
          aiProviderHint,
          voiceProfile: "quran_reciter",
        },
        duration: TARGET_VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else if (mode === 1) {
      key = `hadith:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const row = await getHadithRow(day * 16 + slot);
      const sourceUrl = row.ref ? `https://sunnah.com/${encodeURIComponent(row.ref)}` : "https://sunnah.com";
      payload = {
        title: `حديث اليوم — رقم ${row.hadith_number || "مرجعي"}`,
        description: "فيديو آلي لحديث منشور في مكتبة ذِكر مع نص الحديث ودرجته ومرجع البحث.",
        category: "hadith",
        content: {
          renderer: "template",
          type: "hadith",
          sourceType: "hadith",
          sourceId: row.id,
          sourceUrl,
          sourceLabel: `السنة النبوية — المرجع ${row.ref || row.hadith_number || "متاح في قاعدة البيانات"}`,
          textAr: row.text_ar,
          gradeAr: row.grade_ar,
          publicPath: "/hadith",
          automationKey: key,
          aiMode: "source_locked",
          aiProviderHint,
          voiceProfile: "hadith_male_msa",
        },
        duration: TARGET_VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else if (mode === 2) {
      key = `dua:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const row = await getDuaRow(day * 16 + slot);
      const sourceUrl = `${siteUrl()}/dua/${row.slug}`;
      payload = {
        title: `دعاء اليوم — ${row.title_ar}`,
        description: row.occasion_ar || "دعاء موثق من مكتبة ذِكر.",
        category: "dua",
        content: {
          renderer: "template",
          type: "dua",
          sourceType: "dua",
          sourceId: row.id,
          sourceUrl,
          sourceLabel: row.source_ar || "دعاء من مكتبة ذِكر",
          textAr: row.text_ar,
          occasionAr: row.occasion_ar,
          publicPath: `/dua/${row.slug}`,
          automationKey: key,
          aiMode: "source_locked",
          aiProviderHint,
          voiceProfile: "documentary_male_msa",
        },
        duration: TARGET_VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else if (mode === 3) {
      key = `adhkar:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const sources = await listVideoSources("adhkar");
      const pool = sources.length ? sources : listCuratedVideoSources("adhkar");
      if (!pool.length) throw new Error("No verified adhkar sources are available.");
      const row = pool[(day * 16 + slot) % pool.length];
      payload = {
        title: row.title,
        description: "فيديو آلي لذكر مأثور مع المصدر والدرجة المسجلة في مكتبة ذِكر.",
        category: "adhkar",
        content: {
          renderer: "template",
          type: "adhkar",
          sourceType: "hadith",
          ...(typeof row.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id)
            ? { sourceId: row.id }
            : { curatedSourceId: row.id }),
          sourceUrl: row.sourceUrl,
          sourceLabel: row.sourceLabel,
          textAr: row.text,
          gradeAr: row.grade,
          additionalSources: row.additionalSources ?? [],
          publicPath: "/adhkar",
          automationKey: key,
          aiMode: "source_locked",
          aiProviderHint,
          voiceProfile: "hadith_male_msa",
        },
        duration: TARGET_VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else if (mode === 4) {
      key = `story:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const sources = await listVideoSources("story");
      const pool = sources.length ? sources : listCuratedVideoSources("story");
      if (!pool.length) throw new Error("No verified story sources are available.");
      const row = pool[(day * 16 + slot) % pool.length];
      payload = {
        title: row.title,
        description: "قصة موثقة في مكتبة ذِكر مع إحالة إلى مصدرها الأساسي.",
        category: "story",
        content: {
          renderer: "template",
          type: "story",
          sourceType: "story",
          ...(typeof row.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id)
            ? { sourceId: row.id }
            : { curatedSourceId: row.id }),
          sourceUrl: row.sourceUrl,
          sourceLabel: row.sourceLabel,
          additionalSources: row.additionalSources ?? [],
          textAr: row.text,
          publicPath: "/stories",
          automationKey: key,
          aiMode: "source_locked",
          aiProviderHint,
          voiceProfile: "documentary_male_msa",
        },
        duration: TARGET_VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else if (mode === 5) {
      key = `kids-series:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const kidsSlotsPerDay = Math.max(1, Math.ceil(Math.max(1, dailyTarget - 5) / 7));
      const daysSinceFactoryLaunch = Math.max(0, day - KIDS_SERIES_START_DAY_INDEX);
      const episodeSequence = daysSinceFactoryLaunch * kidsSlotsPerDay + Math.floor(slot / 7) + 1;
      const episode = buildKidsSeriesEpisode(episodeSequence);
      const episodeValidation = validateGeneratedKidsEpisode(episode);
      if (!episodeValidation.ok) {
        throw new Error("Generated kids story failed editorial contract: " + episodeValidation.errors.join(" | "));
      }
      payload = {
        title: episode.title,
        description: episode.description,
        category: "other",
        content: {
          renderer: "template",
          type: "kids_story_episode",
          sourceType: "original_kids_fiction",
          sourceId: episode.sourceId,
          factorySequence: episodeSequence,
          sourceUrl: `${siteUrl()}/kids`,
          sourceLabel: "قصة تربوية خيالية أصلية من ذِكر — ليست آية أو حديثًا أو واقعة تاريخية.",
          textAr: episode.text,
          text: episode.text,
          script: episode.text,
          audience: "kids",
          contentFormat: "series_episode",
          seriesId: episode.seriesId,
          seriesTitle: episode.seriesTitle,
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          episodeTitle: episode.episodeTitle,
          ageGroup: episode.ageGroup,
          learningObjective: episode.learningObjective,
          visualTheme: episode.visualTheme,
          style: episode.visualTheme,
          generationMode: episode.generationMode,
          voiceProfile: "kids_friendly",
          publicPath: "/kids",
          automationKey: key,
          aiMode: "original_kids_story",
          aiProviderHint,
        },
        duration: TARGET_VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    } else {
      const reminders = [
        "اجعل التقنية خادمة للعبادة: اختر وقتًا هادئًا للقراءة والذكر وأغلق ما يشتت قلبك.",
        "القليل الثابت يبني عادة أقوى من قائمة طويلة لا تستمر عليها؛ اختر وردًا تستطيع المحافظة عليه.",
        "قبل مشاركة أي معلومة دينية، ابحث عن مصدرها واقرأ النص كاملًا ولا تعتمد على صورة متداولة وحدها.",
        "خذ دقيقة هادئة في منتصف يومك، ابتعد عن الضوضاء، وراجع ما تريد أن تحمله معك لبقية اليوم.",
        "اجعل هاتفك أداة تساعدك على الخير: قلل الإشعارات، واحفظ وقتك للمهم، واستخدم التقنية بوعي.",
        "ابدأ بخطوة صغيرة اليوم، ثم كررها غدًا؛ الاستمرارية في العادات النافعة تصنع فرقًا كبيرًا.",
      ];
      key = `other:${day}:${slot}`;
      if (await findByAutomationKey("video_generation_requests", key)) continue;
      const textAr = reminders[(day * 16 + slot) % reminders.length];
      payload = {
        title: "رسالة اليوم — خطوة صغيرة ثابتة",
        description: "رسالة تحريرية أصلية من ذِكر، غير منسوبة إلى آية أو حديث.",
        category: "other",
        content: {
          renderer: "template",
          type: "general_reminder",
          sourceType: "editorial",
          sourceLabel: "محتوى تحريري أصلي من منصة ذِكر",
          textAr,
          publicPath: "/articles",
          automationKey: key,
          aiMode: "general_reminder",
          aiProviderHint,
          voiceProfile: "documentary_male_msa",
        },
        duration: TARGET_VIDEO_SECONDS,
        status: "pending",
        automation_key: key,
      };
    }

    const content = payload.content as Record<string, unknown>;
    const text = typeof content.textAr === "string" ? content.textAr : "";
    const format = content.videoFormat === "horizontal" ? "horizontal" : engineConfig().defaultFormat;
    const contentHash = videoContentHash({ category: String(payload.category), sourceId: String(content.sourceId ?? ""), text, format, templateVersion: VIDEO_TEMPLATE_VERSION, language: "ar", style: String(content.style ?? "default") });
    const sourceHashValue = sourceHash({ sourceId: String(content.sourceId ?? ""), sourceUrl: String(content.sourceUrl ?? ""), text });
    payload.content = { ...content, videoFormat: format, templateVersion: VIDEO_TEMPLATE_VERSION, contentHash, sourceHash: sourceHashValue };
    if (engineConfig().dryRun) {
      console.log(`[template-video] dry-run planned ${key} (${contentHash.slice(0, 12)})`);
      created += 1;
      continue;
    }
    try {
      await supabaseServerAdminRequest("/rest/v1/video_generation_requests", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          ...payload,
          content_hash: contentHash,
          source_hash: sourceHashValue,
          provider: "template",
          template_version: VIDEO_TEMPLATE_VERSION,
        }),
      });
      created += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isContentHashConflict =
        message.includes("video_generation_requests_content_hash_unique") ||
        message.includes("duplicate key value violates unique constraint") &&
          message.includes("content_hash");
      if (!isContentHashConflict) throw error;
      console.warn(
        `[template-video] Skipping duplicate content hash for ${key} (${contentHash.slice(0, 12)}); an equivalent video request already exists.`,
      );
    }
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
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : siteUrl();
}
function aiPlanEnabled() {
  return process.env.VIDEO_FREE_ONLY?.toLowerCase() === "false" && Boolean(process.env.GEMINI_API_KEY?.trim());
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
    candidate.scene === "calm" ||
    candidate.scene === "emerald" ||
    candidate.scene === "paper" ||
    candidate.scene === "rose"
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

function hasSuspiciousReligiousAttribution(value: string) {
  return /(قال الله|قال رسول الله|رسول الله|قال النبي|عن النبي|حديث قدسي|حديث نبوي|رضي الله عنه)\b/u.test(value);
}

function validateAiEditorialPlan(plan: AiVideoPlan, request: GeneratedRequest) {
  const source = comparableSourceText(contentText(request)).replace(/\s+/g, " ").trim();
  const reflection = comparableSourceText(plan.reflection).replace(/\s+/g, " ").trim();
  const caption = comparableSourceText(plan.socialCaption).replace(/\s+/g, " ").trim();
  if (reflection.length > 110) throw new Error("AI reflection exceeds the Arabic editorial length limit.");
  if (caption.length > 220) throw new Error("AI social caption exceeds the Arabic editorial length limit.");
  if (/https?:\/\//i.test(reflection) || /https?:\/\//i.test(caption)) throw new Error("AI editorial text contains a URL.");
  if (hasSuspiciousReligiousAttribution(reflection) || hasSuspiciousReligiousAttribution(caption)) throw new Error("AI editorial text contains an unapproved religious attribution.");
  if (["quran", "hadith", "adhkar", "dua", "story"].includes(request.category) && source.length >= 40) {
    for (const candidate of [reflection, caption]) {
      if (!candidate || candidate.length < 24) continue;
      for (let index = 0; index <= candidate.length - 24; index += 4) {
        if (source.includes(candidate.slice(index, index + 24))) throw new Error("AI editorial layer repeated source-locked religious text.");
      }
    }
  }
  const combined = reflection + " " + caption;
  const arabicChars = [...combined].filter((char) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(char)).length;
  const letterChars = [...combined].filter((char) => /\p{L}/u.test(char)).length;
  if (letterChars > 0 && arabicChars / letterChars < 0.6) throw new Error("AI editorial layer is not sufficiently Arabic.");
  return plan;
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
  if (request.category === "other" && request.content?.audience !== "kids") return { ...DEFAULT_AI_VIDEO_PLAN };
  if (!aiPlanEnabled()) return { ...DEFAULT_AI_VIDEO_PLAN };
  const sourceText = contentText(request).slice(0, 5000);
  if (!sourceText) return { ...DEFAULT_AI_VIDEO_PLAN };

  const model = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();
  const prompt = [
    "أنت مخطط محتوى بصري لمنصة ذِكر الإسلامية.",
    "المصدر أدناه موثق بالفعل. النص الديني source-locked ولا يجوز تغييره أو إعادة صياغته أو تكرار أجزاء واضحة منه داخل التأمل أو الكابشن.",
    "ممنوع اختراع حكم شرعي أو درجة حديث أو نسبة قول إلى الله أو النبي أو الصحابي أو العالم.",
    "اكتب التأمل والكابشن كتعليق تحريري أصلي فقط، دون علامات اقتباس ودون ألفاظ الإسناد.",
    aiVisualPolicyPromptLine(),
    "صمّم خطة قصيرة لفيديو عمودي يُرندر محليًا بواسطة FFmpeg.",
    "أعد JSON فقط بالمفاتيح الإنجليزية التالية:",
    '{"reflection":"...","socialCaption":"...","scene":"calm|dawn|night|gold|emerald|paper|rose","motion":"fade|slow"}',
    "reflection: تأمل عربي أصلي <= 110 أحرف، عام وغير منسوب لمصدر ديني.",
    "socialCaption: كابشن عربي أصلي <= 220 حرفًا، يصف الفيديو دون إضافة معلومة غير موجودة في المصدر.",
    "لا تكرر الجملة الأصلية ولا أي جزء واضح منها.",
    "scene: اختر نمطًا بصريًا من القائمة فقط، ووزّع الاختيارات بين الهادئ والورقي والزمردي والليلي.",
    "motion: fade أو slow فقط.",
    `العنوان: ${request.title}`,
    `المصدر: ${contentSourceUrl(request)}`,
    `النص:${sourceText}`,
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY || "")}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.12, maxOutputTokens: 260 },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status} for ${model}`);

  const payload = await response.json();
  const raw = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim() || "";
  console.log(`[template-video] Gemini plan generated with ${model}`);
  const plan = normalizeAiVideoPlan(parseGeminiJson(raw));
  try { return validateAiEditorialPlan(plan, request); } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[template-video] Gemini editorial plan rejected; using deterministic fallback: " + message);
    return { ...DEFAULT_AI_VIDEO_PLAN };
  }
}

function comparableSourceText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\uFEFF\u200B-\u200D\u200E\u200F\u2060\u2066-\u2069\u202A-\u202E]/g, "");
}

function assertKidsStoryContract(request: GeneratedRequest) {
  if (request.content?.templatePreview === true || request.content?.audience !== "kids") return;
  const content = request.content;
  const text = contentText(request);
  const episodeNumber = Number(content.episodeNumber);
  const seasonNumber = Number(content.seasonNumber);
  if (!String(content.seriesId ?? "").trim() || !String(content.seriesTitle ?? "").trim()) {
    throw new Error("Child-directed video requires canonical series metadata.");
  }
  if (!Number.isInteger(episodeNumber) || episodeNumber < 1 || !Number.isInteger(seasonNumber) || seasonNumber < 1) {
    throw new Error("Child-directed video requires positive season and episode numbers.");
  }
  if (!String(content.learningObjective ?? "").trim()) {
    throw new Error("Child-directed video requires a defined learning objective.");
  }
  const normalizedText = text.normalize("NFC").trim();
  if (normalizedText.length < 180 || normalizedText.length > 1500 || !normalizedText.includes("؟")) {
    throw new Error("Child-directed narration must be a short complete story ending with a question.");
  }
  if (normalizedText.includes("http://") || normalizedText.includes("https://") || /قال الله|قال رسول الله|حديث قدسي|حديث نبوي/u.test(normalizedText)) {
    throw new Error("Child-directed fiction must not contain raw URLs or unsupported religious attributions.");
  }
  if (String(content.sourceType ?? "") === "original_kids_fiction" && !String(content.sourceLabel ?? "").includes("آية أو حديث")) {
    throw new Error("Original kids fiction must carry a clear non-religious attribution label.");
  }
  if (content.generationMode === "free_deterministic_story_factory") {
    const validation = validateCanonicalKidsEpisodeSnapshot({
      factorySequence: content.factorySequence,
      sourceId: content.sourceId,
      text: normalizedText,
      seriesId: content.seriesId,
      seasonNumber,
      episodeNumber,
      learningObjective: content.learningObjective,
    });
    if (!validation.ok) {
      throw new Error("Kids episode content does not match its canonical deterministic source: " + validation.errors.join(" | "));
    }
  }
}

function contentAudioUrl(request: GeneratedRequest) {
  const value = request.content?.audioUrl;
  return typeof value === "string" && /^https:\/\//i.test(value.trim()) ? value.trim() : "";
}
function contentAudioKind(request: GeneratedRequest, audioUrl: string) {
  if (request.content?.audioSource === "human_recording") return "user_supplied_human_recording";
  if (audioUrl) return request.category === "quran" ? "verified_quran_recitation" : "source_audio";
  return "arabic_tts_narration";
}

async function validateSourceContent(request: GeneratedRequest) {
  const content = request.content || {};
  const text = contentText(request);
  if (!text) throw new Error("Template video requires text/script/narration content.");
  if (["quran", "hadith", "dua", "adhkar", "story"].includes(request.category)) {
    let sourceId =
      typeof content.sourceId === "string"
        ? content.sourceId
        : typeof content.curatedSourceId === "string"
          ? content.curatedSourceId
          : "";
    if (request.category === "quran" && !sourceId) {
      const surahId = Number(content.surahId);
      const ayahNumber = Number(content.ayahNumber);
      if (Number.isInteger(surahId) && Number.isInteger(ayahNumber)) sourceId = `quran:${surahId}:${ayahNumber}`;
    }
    if (!sourceId) throw new Error(`${request.category} video rejected: a selected, published source is required.`);
    const source = (await resolveVideoSource(request.category, sourceId)) ?? resolveCuratedVideoSource(sourceId);
    if (!source || source.category !== request.category) throw new Error(`${request.category} video rejected: source is missing, unpublished, unreferenced, or has no recorded grade.`);
    if (comparableSourceText(text) !== comparableSourceText(source.text)) throw new Error(`${request.category} video rejected: narration does not exactly match the current published source text.`);
    request.content = {
      ...content,
      ...(request.content.curatedSourceId ? { curatedSourceId: source.id } : { sourceId: source.id }),
      sourceType: request.category,
      sourceUrl: source.sourceUrl,
      sourceLabel: source.sourceLabel,
      textAr: source.text,
      text: source.text,
      ...(source.grade ? { gradeAr: source.grade } : {}),
      ...(source.audioUrl ? { audioUrl: source.audioUrl } : {}),
    };
  }
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

async function assertAudibleAudio(pathname: string) {
  const { stderr } = await execFileAsync("ffmpeg", [
    "-hide_banner", "-i", pathname, "-vn", "-af", "volumedetect", "-f", "null", "-",
  ], { maxBuffer: 4 * 1024 * 1024 });
  const maximum = stderr.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);
  const peakDb = maximum ? Number(maximum[1]) : Number.NEGATIVE_INFINITY;
  if (!Number.isFinite(peakDb) || peakDb < -50) {
    throw new Error("Rendered audio is silent or too quiet; refusing to mark the video complete.");
  }
}

async function assertNarrationQuality(pathname: string, text: string, category: string, audience?: unknown) {
  const probe = await probeMedia(pathname);
  const duration = Number(probe.format?.duration ?? 0);
  if (!Number.isFinite(duration) || duration < 0.8) {
    throw new Error("Narration audio duration is invalid.");
  }

  const quality = evaluateArabicNarrationText(text, category);
  if (!quality.ok) {
    throw new Error("Arabic narration text QA failed: " + quality.errors.join(" | "));
  }
  if (quality.warnings.length) {
    console.warn("[template-video] Narration text warnings:", quality.warnings.join(" | "));
  }

  if (category === "quran") return;
  const wordsPerSecond = quality.wordCount / Math.max(duration, 0.1);
  const childDirected = category === "kids" || audience === "kids";
  const minWps = childDirected ? 0.65 : 0.75;
  const maxWps = childDirected ? 3.8 : category === "hadith" || category === "adhkar" ? 4.1 : 4.5;
  if (!Number.isFinite(wordsPerSecond) || wordsPerSecond < minWps || wordsPerSecond > maxWps) {
    throw new Error(
      "Arabic narration pace is outside the natural range: " +
        wordsPerSecond.toFixed(2) +
        " words/sec for " +
        category +
        ".",
    );
  }

  const { stderr } = await execFileAsync("ffmpeg", [
    "-hide_banner",
    "-i", pathname,
    "-af", "silencedetect=noise=-42dB:d=2.5",
    "-f", "null",
    "-",
  ], { maxBuffer: 4 * 1024 * 1024 });
  const longSilences = [...stderr.matchAll(/silence_duration:\s*([0-9.]+)/g)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 2.5);
  if (longSilences.length > 0) {
    throw new Error("Arabic narration contains an unexpectedly long silent gap.");
  }
}

function requestedVideoShape(request: GeneratedRequest) {
  const resolution = request.content?.resolution;
  if (typeof resolution === "string" && /^\d+x\d+$/.test(resolution)) return resolution;
  return request.content?.videoFormat === "horizontal" ? "1920x1080" : "1080x1920";
}

async function renderVideo(request: GeneratedRequest) {
  const renderStartedAt = Date.now();
  await validateSourceContent(request);
  const boundTemplate = await bindTemplateVersion(request);
  assertKidsStoryContract(request);
  const text = contentText(request);
  const sourceUrl = contentSourceUrl(request);
  const [width, height] = requestedVideoShape(request).split("x").map(Number);
  if (!width || !height) throw new Error("Invalid video resolution.");
  const templateVersion = boundTemplate?.label ??
    (typeof request.content.templateVersion === "string" && request.content.templateVersion.trim()
      ? request.content.templateVersion.trim()
      : VIDEO_TEMPLATE_VERSION);
  const detectedFormat = width > height ? "horizontal" : "vertical";
  const sourceHashValue = sourceHash({
    sourceId: typeof request.content.sourceId === "string" ? request.content.sourceId : "",
    sourceUrl,
    text,
  });
  const contentHashValue = videoContentHash({
    category: request.category,
    sourceId: typeof request.content.sourceId === "string" ? request.content.sourceId : "",
    text,
    format: detectedFormat,
    templateVersion,
    language: typeof request.content.language === "string" ? request.content.language : "ar",
    style: boundTemplate?.config.assetKey ??
      (typeof request.content.style === "string" ? request.content.style : ""),
  });
  request.content = {
    ...request.content,
    templateVersion,
    sourceHash: sourceHashValue,
    contentHash: contentHashValue,
  };

  const temp = await mkdtemp(tmpdir() + "/zikr-template-video-");
  const assPath = temp + "/captions.ass";
  const outputPath = temp + "/video.mp4";
  const audioPath = temp + "/narration.mp3";
  let aiVideoPath: string | null = null;
  try {
    const isTemplatePreview = request.content.templatePreview === true;
    let aiPlan: AiVideoPlan = { ...DEFAULT_AI_VIDEO_PLAN };
    try {
      if (!isTemplatePreview) aiPlan = await generateAiVideoPlan(request);
      request.content = {
        ...request.content,
        ai: {
          provider: isTemplatePreview ? "template-preview" : aiPlanEnabled() ? "google-gemini" : "deterministic-fallback",
          model: !isTemplatePreview && aiPlanEnabled() ? (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite").trim() : null,
          reflection: aiPlan.reflection || null,
          socialCaption: aiPlan.socialCaption || null,
          scene: aiPlan.scene,
          motion: aiPlan.motion,
          generatedAt: new Date().toISOString(),
          sourceLocked: true,
          policyVersion: AI_VISUAL_POLICY_VERSION,
        },
      };
    } catch (error) {
      console.warn("[template-video] Gemini plan skipped for " + request.id + ": " + (error instanceof Error ? error.message : String(error)));
    }

    const persistedAi = request.content?.ai && typeof request.content.ai === "object"
      ? (request.content.ai as Partial<AiVideoPlan> & { scene?: AiVideoPlan["scene"]; motion?: AiVideoPlan["motion"]; provider?: string })
      : null;
    const hasGeminiCreativePlan = persistedAi?.provider === "google-gemini";
    const isKnownScene = (value: unknown): value is AiVideoPlan["scene"] =>
      value === "calm" || value === "dawn" || value === "night" || value === "gold" ||
      value === "emerald" || value === "paper" || value === "rose";
    const scene = boundTemplate
      ? videoTemplateScene(boundTemplate.config.assetKey)
      : hasGeminiCreativePlan && isKnownScene(persistedAi?.scene)
        ? persistedAi.scene
        : deterministicScene(request);
    const motion = boundTemplate
      ? boundTemplate.config.motion
      : hasGeminiCreativePlan && (persistedAi?.motion === "fade" || persistedAi?.motion === "slow")
        ? persistedAi.motion
        : resolveDeterministicVideoMotion(request.id);
    if (persistedAi) {
      request.content = { ...request.content, ai: { ...persistedAi, scene, motion } };
    }
    const isVertical = height >= width;

    const narrationProfile = narrationProfileForRequest(request);
    const narrationText = contentText(request);
    const narrationTextQuality = evaluateArabicNarrationText(narrationText, request.category);
    if (!narrationTextQuality.ok) {
      throw new Error("Narration content QA failed: " + narrationTextQuality.errors.join(" | "));
    }

    let audioUrl = contentAudioUrl(request);
    if (request.category === "quran" && !audioUrl) {
      const verifiedAyahAudio = await getVerifiedQuranAyahAudioUrl(
        Number(request.content?.surahId),
        Number(request.content?.ayahNumber),
      );
      if (verifiedAyahAudio) {
        audioUrl = verifiedAyahAudio;
        request.content = { ...request.content, audioUrl: verifiedAyahAudio, audioSource: "quran-ayah-cdn" };
      }
    }
    if (request.category === "quran" && !audioUrl) {
      throw new Error("Quran video rejected: verified human recitation audio is unavailable; TTS is never used for Quran.");
    }
    if (
      !isTemplatePreview &&
      boundTemplate?.config.audioPolicy === "verified-audio-only" &&
      !audioUrl
    ) {
      throw new Error("Template audio policy requires a verified source or human recording; synthetic narration is disabled.");
    }

    const preferredProvider =
      request.content.aiProviderHint === "hf_ltx_fast" ||
      request.content.aiProviderHint === "hf_wan"
        ? (request.content.aiProviderHint as "hf_ltx_fast" | "hf_wan")
        : undefined;

    if (
      !isTemplatePreview &&
      !boundTemplate &&
      engineConfig().aiEnabled &&
      engineConfig().order.some((provider) => provider !== "template") &&
      aiAttemptsUsed < AI_ATTEMPTS_PER_RUN
    ) {
      aiAttemptsUsed += 1;
      const router = createVideoProviderRouter(async () => ({
        ok: false,
        provider: "template" as const,
        error: "The existing template renderer is handled by this worker.",
      }));
      const aiResult = await router.generate({
        requestId: request.id,
        title: request.title,
        description: request.description || "",
        category: request.category,
        text,
        audience: request.content?.audience === "kids" ? "kids" : "general",
        seriesTitle: typeof request.content?.seriesTitle === "string" ? request.content.seriesTitle : undefined,
        episodeNumber: Number.isInteger(Number(request.content?.episodeNumber)) ? Number(request.content?.episodeNumber) : undefined,
        learningObjective: typeof request.content?.learningObjective === "string" ? request.content.learningObjective : undefined,
        sourceId:
          typeof request.content.sourceId === "string"
            ? request.content.sourceId
            : typeof request.content.curatedSourceId === "string"
              ? request.content.curatedSourceId
              : undefined,
        sourceUrl,
        format: isVertical ? "vertical" : "horizontal",
        durationSeconds: TARGET_VIDEO_SECONDS,
        language: "ar",
        style: scene,
        preferredProvider,
      });
      if (aiResult.ok && aiResult.localPath) {
        aiVideoPath = aiResult.localPath;
      } else if (aiResult.ok && aiResult.videoUrl) {
        const response = await fetch(aiResult.videoUrl, {
          signal: AbortSignal.timeout(60_000),
        });
        if (!response.ok) {
          throw new Error("AI provider returned a video URL that could not be downloaded.");
        }
        aiVideoPath = temp + "/ai-source.mp4";
        await writeFile(aiVideoPath, new Uint8Array(await response.arrayBuffer()));
      }
      request.content = {
        ...request.content,
        aiProvider: aiResult.ok ? aiResult.provider : null,
        aiProviderJobId: aiResult.providerJobId ?? null,
        aiFallbackReason: aiResult.ok
          ? null
          : aiResult.error || "AI providers unavailable",
      };
    } else if (!isTemplatePreview && !boundTemplate && engineConfig().aiEnabled && aiAttemptsUsed >= AI_ATTEMPTS_PER_RUN) {
      request.content = {
        ...request.content,
        aiProvider: null,
        aiFallbackReason: "AI per-run budget exhausted; deterministic template fallback used.",
      };
    }
    const backgroundPath = aiVideoPath || await renderBackground(temp, scene, width, height, request.content);
    let audioKind = contentAudioKind(request, audioUrl);
    if (audioUrl) {
      const response = await fetch(audioUrl, { headers: { Accept: "audio/*" }, signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error("Audio download failed (HTTP " + response.status + ").");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length < 1024) throw new Error("Audio download was empty or invalid.");
      await writeFile(audioPath, bytes);
    } else {
      if (narrationProfile.mode !== "tts" || !narrationProfile.voice) {
        throw new Error("A recorded audio source is required for this video category.");
      }
      try {
        await execFileAsync(
          getArabicTtsPython(),
          [
            "scripts/generate-arabic-voice.py",
            "--text", narrationText,
            "--output", audioPath,
            "--voice", process.env.ARABIC_TTS_VOICE?.trim() || narrationProfile.voice,
            `--rate=${process.env.ARABIC_TTS_RATE?.trim() || narrationProfile.rate}`,
            `--pitch=${process.env.ARABIC_TTS_PITCH?.trim() || narrationProfile.pitch}`,
          ],
          { maxBuffer: 4 * 1024 * 1024 },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          "Arabic TTS failed (profile=" + narrationProfile.id + ", python=" + getArabicTtsPython() + "): " + message,
        );
      }
      audioKind = "arabic_tts_narration";
    }

    await assertNarrationQuality(audioPath, narrationText, request.category, request.content?.audience);
    const audioProbe = await probeMedia(audioPath);
    const audioDuration = Number(audioProbe.format?.duration ?? 0);
    const duration = resolveRenderDuration(audioDuration, TARGET_VIDEO_SECONDS);
    const composition = resolveVideoComposition({
      category: request.category,
      audience: request.content?.audience,
      seed: request.id,
      width,
      height,
      template: boundTemplate?.config,
    });
    await writeFile(
      assPath,
      makeAss(
        text,
        request.title,
        typeof request.content?.sourceLabel === "string" && request.content.sourceLabel.trim() ? request.content.sourceLabel : sourceUrl,
        aiPlan.reflection || null,
        duration,
        audioDuration,
        composition,
        request.category,
        request.content?.audience,
        request.id,
      ),
      "utf8",
    );

    const fadeOutStart = Math.max(0, duration - 0.8);
    const motionFilters = motion === "fade"
      ? ["fade=t=in:st=0:d=0.7", "fade=t=out:st=" + fadeOutStart.toFixed(2) + ":d=0.8"]
      : ["fade=t=in:st=0:d=0.5"];
    const panelX = composition.panelLeft;
    const panelY = composition.panelTop;
    const panelW = composition.panelPixelWidth;
    const panelH = composition.panelPixelHeight;
    const accentX = panelX + Math.round(panelW * 0.055);
    const accentY = panelY + Math.round(panelH * 0.075);
    const accentW = Math.max(24, Math.round(panelW * 0.28));
    const cameraX = composition.cameraPath === "left-to-right" ? "(0.12+0.76*min(on/1800,1))"
      : composition.cameraPath === "right-to-left" ? "(0.88-0.76*min(on/1800,1))" : "0.50";
    const cameraY = composition.cameraPath === "top-to-bottom" ? "(0.12+0.76*min(on/1800,1))"
      : composition.cameraPath === "bottom-to-top" ? "(0.88-0.76*min(on/1800,1))" : "0.50";
    const cameraFilter =
      "zoompan=z='min(zoom+" + composition.zoomIncrement + ",1.06)':x='(iw-iw/zoom)*" +
      cameraX + "':y='(ih-ih/zoom)*" + cameraY +
      "':d=1:s=" + width + "x" + height + ":fps=30";
    const sourceFilter = aiVideoPath
      ? `fps=30,scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,${cameraFilter}`
      : cameraFilter;
    const filter = [
      sourceFilter,
      `drawbox=x=${panelX}:y=${panelY}:w=${panelW}:h=${panelH}:color=0x${composition.panelHex}@${composition.panelOpacity}:t=fill`,
      `drawbox=x=${panelX}:y=${panelY}:w=${panelW}:h=${panelH}:color=0x${composition.accentHex}@0.38:t=2`,
      `drawbox=x=${accentX}:y=${accentY}:w=${accentW}:h=${composition.accentThickness}:color=0x${composition.accentHex}@0.92:t=fill`,
      `drawbox=x=${panelX + panelW - composition.accentThickness - Math.round(panelW * 0.055)}:y=${panelY + Math.round(panelH * 0.075)}:w=${composition.accentThickness}:h=${Math.round(panelH * 0.28)}:color=0x${composition.accentHex}@0.62:t=fill`,
      "eq=contrast=" + composition.contrast + ":saturation=" + composition.saturation + ":brightness=0.00",
      "unsharp=5:5:0.25:5:5:0.0",
      "vignette=PI/5",
      ...motionFilters,
      "subtitles=" + assPath + ":fontsdir=/usr/share/fonts/truetype/noto",
      "format=yuv420p",
    ].join(",");
    const args = [
      "-y", ...(aiVideoPath ? ["-stream_loop", "-1", "-i", backgroundPath] : ["-loop", "1", "-framerate", "30", "-i", backgroundPath]), "-i", audioPath,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-t", duration.toFixed(2),
      "-vf", filter,
      "-c:v", "libx264", "-preset", "medium", "-crf", String(VIDEO_OUTPUT_CRF), "-profile:v", "high",
      "-maxrate", isVertical ? "8M" : "10M", "-bufsize", isVertical ? "16M" : "20M",
      "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart",
      "-metadata:s:v:0", "language=ara",
      "-c:a", "aac", "-b:a", VIDEO_AUDIO_BITRATE, "-ar", "48000", "-ac", "2",
      "-af", [
        "highpass=f=65",
        "lowpass=f=16000",
        "acompressor=threshold=-18dB:ratio=2.5:attack=20:release=250:makeup=2",
        "loudnorm=I=-16:TP=-1.5:LRA=11",
        `afade=t=out:st=${Math.max(0, audioDuration - 0.55).toFixed(2)}:d=${Math.min(0.55, Math.max(0.15, audioDuration)).toFixed(2)}`,
        `apad=whole_dur=${duration.toFixed(2)}s`,
      ].join(","),
      "-metadata:s:a:0", "language=ara",
      "-metadata", "title=" + request.title.slice(0, 180),
      "-metadata", "comment=ZIKR template " + VIDEO_TEMPLATE_VERSION,
      outputPath,
    ];
    await execFileAsync("ffmpeg", args, { maxBuffer: 4 * 1024 * 1024 });
    await assertPlayableOutput(outputPath, width, height);
    await assertAudibleAudio(outputPath);
    const renderDurationMs = Date.now() - renderStartedAt;

    const bytes = await readFile(outputPath);
    const storageKey = request.automation_key || request.id;
    const uploadedMedia = await uploadGeneratedVideoToCloudinary(bytes, storageKey);
    request.content = {
      ...request.content,
      audio: {
        kind: audioKind,
        voice: audioKind === "arabic_tts_narration"
          ? process.env.ARABIC_TTS_VOICE?.trim() || narrationProfile.voice || null
          : null,
        voiceProfile: narrationProfile.id,
        rate: narrationProfile.rate,
        pitch: narrationProfile.pitch,
        sourceUrl: audioUrl || null,
        generatedAt: new Date().toISOString(),
      },
      mediaStorage: {
        provider: "cloudinary",
        publicId: uploadedMedia.publicId,
        bytes: uploadedMedia.bytes,
      },
      render: {
        templateVersion,
        resolution: width + "x" + height,
        durationSeconds: duration,
        scene,
        motion,
        sourceLocked: ["quran", "hadith", "dua", "adhkar", "story"].includes(request.category),
        aiVisualPolicyVersion: AI_VISUAL_POLICY_VERSION,
        generatedAt: new Date().toISOString(),
        renderDurationMs,
        composition: composition.key,
        cameraPath: composition.cameraPath,
        captionTiming: "page-weighted-audio-duration",
      },
    };
    return {
      videoUrl: uploadedMedia.secureUrl,
      scene,
      renderDurationMs,
      composition: composition.key,
      sourceHash: sourceHashValue,
      contentHash: contentHashValue,
      templateVersion,
    };
  } finally {
    await rm(temp, { recursive: true, force: true });
    if (aiVideoPath && aiVideoPath.startsWith(tmpdir()) && !aiVideoPath.startsWith(temp)) await rm(path.dirname(aiVideoPath), { recursive: true, force: true });
  }
}

function buildAutomatedVideoQaChecklist(
  request: GeneratedRequest,
  rendered: {
    videoUrl: string;
    scene: string;
    renderDurationMs: number;
    sourceHash: string;
    contentHash: string;
    templateVersion: string;
  },
): VideoApprovalChecklist {
  const content = request.content ?? {};
  const audio = content.audio && typeof content.audio === "object"
    ? content.audio as Record<string, unknown>
    : {};
  const render = content.render && typeof content.render === "object"
    ? content.render as Record<string, unknown>
    : {};
  const media = content.mediaStorage && typeof content.mediaStorage === "object"
    ? content.mediaStorage as Record<string, unknown>
    : {};
  const category = request.category.trim().toLowerCase();
  const sourceId = typeof content.sourceId === "string" && content.sourceId.trim()
    ? content.sourceId.trim()
    : typeof content.curatedSourceId === "string" && content.curatedSourceId.trim()
      ? content.curatedSourceId.trim()
      : "";
  const sourceUrl = typeof content.sourceUrl === "string" ? content.sourceUrl : "";
  const sourceLabel = typeof content.sourceLabel === "string" ? content.sourceLabel : "";
  const sourceCategories = new Set(["quran", "hadith", "dua", "adhkar", "story"]);
  const isKidsSeries = content.audience === "kids" &&
    content.aiMode === "original_kids_story" &&
    content.sourceType === "original_kids_fiction" &&
    typeof content.seriesId === "string" && Boolean(content.seriesId.trim()) &&
    typeof content.seriesTitle === "string" && Boolean(content.seriesTitle.trim()) &&
    typeof content.learningObjective === "string" && Boolean(content.learningObjective.trim()) &&
    Number.isInteger(Number(content.seasonNumber)) && Number(content.seasonNumber) > 0 &&
    Number.isInteger(Number(content.episodeNumber)) && Number(content.episodeNumber) > 0;
  const isOriginalEditorial = content.audience !== "kids" &&
    category === "other" &&
    content.aiMode === "general_reminder" &&
    content.sourceType === "editorial" &&
    sourceLabel === "محتوى تحريري أصلي من منصة ذِكر" &&
    !/(قال الله|قال رسول الله|رسول الله|حديث قدسي|حديث نبوي)/u.test(contentText(request));
  const sourceVerified = sourceCategories.has(category)
    ? Boolean(sourceId && /^https:\/\//i.test(sourceUrl) && sourceLabel.trim() && render.sourceLocked === true)
    : isKidsSeries || isOriginalEditorial;

  const audioKind = typeof audio.kind === "string" ? audio.kind : "";
  const voiceProfile = typeof audio.voiceProfile === "string" ? audio.voiceProfile : "";
  const approvedVoiceProfiles = new Set(["quran_reciter", "hadith_male_msa", "documentary_male_msa", "kids_friendly"]);
  const audioReviewed = approvedVoiceProfiles.has(voiceProfile) &&
    (category === "quran"
      ? audioKind === "verified_quran_recitation"
      : audioKind === "arabic_tts_narration" ||
        (audioKind === "source_audio" && content.audioRightsVerified === true));

  const allowedProviders = new Set(["hf_ltx_fast", "hf_wan", "template"]);
  const aiProvider = typeof content.aiProvider === "string" ? content.aiProvider : "";
  const providerAllowed = !aiProvider || allowedProviders.has(aiProvider);
  const allowedScenes = new Set(["calm", "dawn", "night", "gold", "emerald", "paper", "rose"]);
  const allowedMotions = new Set(["fade", "slow"]);
  const parsedMediaUrl = (() => {
    try { return new URL(rendered.videoUrl); } catch { return null; }
  })();
  const cloudinaryVerified = parsedMediaUrl?.protocol === "https:" &&
    parsedMediaUrl.hostname === "res.cloudinary.com" &&
    parsedMediaUrl.pathname.includes("/video/upload/") &&
    media.provider === "cloudinary" &&
    typeof media.publicId === "string" && Boolean(media.publicId.trim()) &&
    Number(media.bytes) >= 1024;
  const renderDuration = Number(render.durationSeconds);
  const resolutionValid = render.resolution === "1080x1920" || render.resolution === "1920x1080";
  const visualsReviewed = allowedScenes.has(rendered.scene) &&
    allowedMotions.has(String(render.motion)) &&
    render.aiVisualPolicyVersion === AI_VISUAL_POLICY_VERSION &&
    typeof render.composition === "string" && Boolean(render.composition.trim()) &&
    providerAllowed && cloudinaryVerified && resolutionValid &&
    Number.isFinite(renderDuration) && renderDuration >= 1 && renderDuration <= 60 &&
    rendered.templateVersion === render.templateVersion;

  const narration = contentText(request);
  const narrationQuality = evaluateArabicNarrationText(narration, category);
  const captionsReviewed = narrationQuality.ok &&
    narration.length >= 8 &&
    render.captionTiming === "page-weighted-audio-duration" &&
    typeof render.composition === "string" && Boolean(render.composition.trim()) &&
    !/https?:\/\//i.test(narration);

  // No user-uploaded audio or custom video endpoints are auto-published.
  // Quran recitation must be the verified recitation track; other categories
  // use the approved ZIKR TTS profiles unless a source explicitly carries rights clearance.
  const rightsReviewed = sourceVerified &&
    audioReviewed &&
    providerAllowed &&
    (audioKind !== "source_audio" || content.audioRightsVerified === true) &&
    audioKind !== "user_supplied_human_recording" &&
    cloudinaryVerified;

  return {
    sourceVerified,
    audioReviewed,
    visualsReviewed,
    captionsReviewed,
    rightsReviewed,
  };
}

const INTERNAL_VIDEO_CATEGORY_SLUG: Record<string, string> = {
  quran: "quran-verified",
  hadith: "sunnah-verified",
  story: "verified-stories",
  dua: "duas-adhkar",
  adhkar: "adhkar-verified",
  other: "general-reminders",
};

async function registerGeneratedVideoOnSite(
  request: GeneratedRequest,
  rendered: {
    videoUrl: string;
    scene: string;
    renderDurationMs: number;
    sourceHash: string;
    contentHash: string;
    templateVersion: string;
  },
) {
  const slug = "zikr-" + request.id.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const existingRows = await supabaseServerAdminRequest<Array<{
    id: string;
    published: boolean | null;
  }>>(
    "/rest/v1/videos?slug=eq." + encodeURIComponent(slug) + "&select=id,published&limit=1",
  );
  let videoId = existingRows?.[0]?.id ?? "";
  const existingPublished = existingRows?.[0]?.published === true;
  if (existingPublished) {
    console.log("[video-worker] Internal video already published; preserving existing site record:", videoId);
    return { videoId, published: true, queued: false };
  }

  const categorySlug = INTERNAL_VIDEO_CATEGORY_SLUG[request.category] ?? "general-reminders";
  const categoryRows = await supabaseServerAdminRequest<Array<{ id: string }>>(
    "/rest/v1/video_categories?slug=eq." + encodeURIComponent(categorySlug) + "&published=eq.true&select=id&limit=1",
  );
  const now = new Date().toISOString();
  const metadata = {
    generator: "zikr_internal_video_factory",
    videoGenerationRequestId: request.id,
    generatedVideoUrl: rendered.videoUrl,
    videoUrl: rendered.videoUrl,
    caption: request.description ?? "",
    sourceUrl: typeof request.content.sourceUrl === "string" ? request.content.sourceUrl : null,
    sourceLabel: typeof request.content.sourceLabel === "string" ? request.content.sourceLabel : null,
    sourceType: typeof request.content.sourceType === "string" ? request.content.sourceType : request.category,
    publicPath: "/videos/" + slug,
    generatedAt: now,
    renderer: "template",
    templateVersion: rendered.templateVersion,
    sourceHash: rendered.sourceHash,
    contentHash: rendered.contentHash,
    renderDurationMs: rendered.renderDurationMs,
    scene: rendered.scene,
    audience: request.content.audience === "kids" ? "kids" : "general",
    seriesId: typeof request.content.seriesId === "string" ? request.content.seriesId : null,
    seriesTitle: typeof request.content.seriesTitle === "string" ? request.content.seriesTitle : null,
    seasonNumber: Number.isInteger(Number(request.content.seasonNumber)) ? Number(request.content.seasonNumber) : null,
    episodeNumber: Number.isInteger(Number(request.content.episodeNumber)) ? Number(request.content.episodeNumber) : null,
    learningObjective: typeof request.content.learningObjective === "string" ? request.content.learningObjective : null,
    factorySequence: Number.isInteger(Number(request.content.factorySequence)) ? Number(request.content.factorySequence) : null,
    aiDisclosure: request.content.aiDisclosure ?? null,
    automatedVideoQa: request.content.automatedVideoQa ?? null,
    quality: {
      passed: true,
      checks: [
        "verified_source_or_editorial_contract",
        "arabic_narration_quality",
        "template_asset_policy",
        "render_completed",
        "cloudinary_delivery_verified",
        "internal_site_only",
      ],
    },
  };
  const record = {
    title: request.title,
    slug,
    description: request.description ?? null,
    youtube_id: null,
    thumbnail_url: null,
    duration: Math.max(1, Number(request.content.durationSeconds ?? request.duration ?? TARGET_VIDEO_SECONDS) || TARGET_VIDEO_SECONDS),
    views: 0,
    published: false,
    category_id: categoryRows?.[0]?.id ?? null,
    metadata,
    created_at: now,
    updated_at: now,
  };

  if (!videoId) {
    const inserted = await supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/videos",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(record),
      },
    );
    videoId = inserted?.[0]?.id ?? "";
    if (!videoId) throw new Error("Generated video was uploaded but its ZIKR video record was not returned.");
  } else {
    await supabaseServerAdminRequest(
      "/rest/v1/videos?id=eq." + encodeURIComponent(videoId) + "&published=eq.false",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          ...record,
          created_at: undefined,
        }),
      },
    );
  }

  const queueRows = await supabaseServerAdminRequest<Array<{ id: string; status: string }>>(
    "/rest/v1/content_publish_queue?content_table=eq.videos&content_id=eq." +
      encodeURIComponent(videoId) + "&select=id,status&order=created_at.desc&limit=1",
  );
  const existingQueue = queueRows?.[0];
  if (!existingQueue) {
    await supabaseServerAdminRequest("/rest/v1/content_publish_queue", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        content_table: "videos",
        content_id: videoId,
        scheduled_at: now,
        status: "queued",
        created_at: now,
        updated_at: now,
      }),
    });
  } else if (existingQueue.status === "failed") {
    await supabaseServerAdminRequest(
      "/rest/v1/content_publish_queue?id=eq." + encodeURIComponent(existingQueue.id) + "&status=eq.failed",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "queued",
          scheduled_at: now,
          error_message: null,
          updated_at: now,
        }),
      },
    );
  }

  return { videoId, published: false, queued: true };
}

export async function processTemplateVideoQueue(limit = BATCH_SIZE, priorityDay?: number) {
  if (engineConfig().dryRun) {
    console.log(`[template-video] dry-run enabled; no video generation, upload, or publishing will occur (limit=${limit}).`);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
  const staleBefore = new Date(Date.now() - engineConfig().staleAfterMinutes * 60_000).toISOString();
  const stale = await supabaseServerAdminRequest<Array<{ id: string; generation_attempts?: number | null }>>(
    `/rest/v1/video_generation_requests?status=eq.processing&updated_at=lt.${encodeURIComponent(staleBefore)}&video_url=is.null&select=id,generation_attempts&limit=50`,
  );
  for (const request of stale ?? []) {
    const attempts = (request.generation_attempts ?? 0) + 1;
    const terminalStatus = attempts >= engineConfig().maxRetries ? "failed" : "retry_wait";
    await supabaseServerAdminRequest(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}&status=eq.processing&video_url=is.null`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          status: terminalStatus,
          generation_attempts: attempts,
          next_retry_at: terminalStatus === "retry_wait" ? new Date(Date.now() + videoRetryDelayMinutes(attempts, request.id) * 60_000).toISOString() : null,
          last_attempt_at: new Date().toISOString(),
          error_message: terminalStatus === "failed" ? "تجاوزت عملية الفيديو حد المحاولات بعد الاستعادة." : "تمت استعادة عملية فيديو عالقة تلقائيًا.",
          error_details: "The worker reclaimed a stale processing item and counted the recovery as an attempt.",
          updated_at: new Date().toISOString(),
        }),
      },
    );
  }
  const candidateLimit = Math.max(1, Math.min(10, limit));
  const eligibleFilter = `status=in.(pending,retry_wait)&or=(status.eq.pending,next_retry_at.lte.${encodeURIComponent(new Date().toISOString())})&select=id,title,description,category,content,status,automation_key,generation_attempts,next_retry_at,duration&order=created_at.asc&limit=${candidateLimit}`;
  let rows: GeneratedRequest[] = [];

  if (Number.isInteger(priorityDay)) {
    // Today's scheduled jobs get first claim even when an older backlog exists.
    const prioritized = await supabaseServerAdminRequest<GeneratedRequest[]>(
      `/rest/v1/video_generation_requests?automation_key=like.*:${priorityDay}:*&${eligibleFilter}`,
    );
    rows = [...new Map((prioritized ?? []).map((request) => [request.id, request])).values()]
      .slice(0, candidateLimit);

    if (rows.length < candidateLimit) {
      const backlog = await supabaseServerAdminRequest<GeneratedRequest[]>(
        `/rest/v1/video_generation_requests?${eligibleFilter}`,
      );
      const seen = new Set(rows.map((request) => request.id));
      rows = [
        ...rows,
        ...(backlog ?? []).filter((request) => !seen.has(request.id)),
      ].slice(0, candidateLimit);
    }
  } else {
    rows = (await supabaseServerAdminRequest<GeneratedRequest[]>(
      `/rest/v1/video_generation_requests?${eligibleFilter}`,
    )) ?? [];
  }

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  for (const request of rows || []) {
    const claimed = await supabaseServerAdminRequest<GeneratedRequest[]>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}&status=in.(pending,retry_wait)`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "processing", error_message: null, error_details: null, updated_at: new Date().toISOString() }) },
    );
    if (!claimed?.[0]) continue;
    processed += 1;
    const attemptStartedAt = Date.now();
    try {
      const rendered = await renderVideo(request);
      const qaChecks = buildAutomatedVideoQaChecklist(request, rendered);
      const qaReviewedAt = new Date().toISOString();
      const qaApproval = createAutomatedVideoQaApproval({
        snapshot: {
          category: request.category,
          sourceHash: rendered.sourceHash,
          contentHash: rendered.contentHash,
          templateVersion: rendered.templateVersion,
          videoUrl: rendered.videoUrl,
        },
        checks: qaChecks,
        reviewedAt: qaReviewedAt,
      });
      const missingQaChecks = REQUIRED_VIDEO_APPROVAL_CHECKS.filter((key) => qaChecks[key] !== true);
      const engagement = {
        openingHook: resolveDeterministicVideoHook({ id: request.id, category: request.category, audience: request.content.audience }),
        scene: rendered.scene,
        composition: request.content.render && typeof request.content.render === "object"
          ? (request.content.render as Record<string, unknown>).composition ?? null
          : null,
        durationSeconds: request.content.render && typeof request.content.render === "object"
          ? (request.content.render as Record<string, unknown>).durationSeconds ?? null
          : null,
      };
      request.content = qaApproval
        ? {
            ...request.content,
            ...qaApproval,
            automatedVideoQa: {
              ...(qaApproval.automatedVideoQa as Record<string, unknown>),
              engagement,
            },
          }
        : {
            ...request.content,
            approvalStatus: "qa_failed",
            approvalReviewerId: null,
            approvalReviewedAt: null,
            approvalSnapshotHash: null,
            qualityReview: {
              ...qaChecks,
              reviewedAt: qaReviewedAt,
              mode: "automated",
              engine: AUTOMATED_VIDEO_QA_ENGINE,
              engineVersion: AUTOMATED_VIDEO_QA_VERSION,
            },
            automatedVideoQa: {
              status: "blocked",
              engine: AUTOMATED_VIDEO_QA_ENGINE,
              engineVersion: AUTOMATED_VIDEO_QA_VERSION,
              reviewedAt: qaReviewedAt,
              checks: qaChecks,
              missingChecks: missingQaChecks,
              engagement,
            },
          };
      if (!qaApproval) {
        console.warn(`[template-video] Automated QA blocked internal site publication for ${request.id}: ${missingQaChecks.join(", ")}`);
      }
      if (qaApproval) {
        await registerGeneratedVideoOnSite(request, rendered);
      } else {
        console.warn(`[template-video] Render retained in the generation audit only; automated QA blocked the internal site queue for ${request.id}.`);
      }
      await supabaseServerAdminRequest(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "completed",
          video_url: rendered.videoUrl,
          scene: rendered.scene,
          render_duration_ms: rendered.renderDurationMs,
          source_hash: rendered.sourceHash,
          content_hash: rendered.contentHash,
          template_version: rendered.templateVersion,
          provider:
            typeof request.content.aiProvider === "string"
              ? request.content.aiProvider
              : "template",
          provider_job_id:
            typeof request.content.aiProviderJobId === "string"
              ? request.content.aiProviderJobId
              : null,
          content: request.content,
          updated_at: new Date().toISOString(),
          error_message: null,
          error_details: null,
        }),
      });
      console.log(`[template-video] External distribution is retired; retained internally for ${request.id}.`);
      succeeded += 1;
      console.log(`[template-video] Completed ${request.id}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      const failedScene = request.content?.ai && typeof request.content.ai === "object" && ["calm", "dawn", "night", "gold", "emerald", "paper", "rose"].includes(String((request.content.ai as { scene?: unknown }).scene))
        ? String((request.content.ai as { scene?: unknown }).scene)
        : deterministicScene(request);
      const attempts = (request.generation_attempts ?? 0) + 1;
      const terminalStatus = attempts >= engineConfig().maxRetries ? "failed" : "retry_wait";
      await supabaseServerAdminRequest(`/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: terminalStatus, scene: failedScene, render_duration_ms: Date.now() - attemptStartedAt, generation_attempts: attempts, next_retry_at: terminalStatus === "retry_wait" ? new Date(Date.now() + videoRetryDelayMinutes(attempts, request.id) * 60_000).toISOString() : null, last_attempt_at: new Date().toISOString(), error_message: "Template generation failed", error_details: message.slice(0, 2000), updated_at: new Date().toISOString() }),
      });
      console.error(`[template-video] Failed ${request.id}: ${message}`);
    }
  }
  return { processed, succeeded, failed };
}
