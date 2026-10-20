import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { createVideoGenerationRequest } from "@/features/videos/services/video-automation";
import { resolveVideoSource } from "@/features/videos/services/video-sources";
import { resolveCuratedVideoSource } from "@/features/videos/data/curated-content";

const VALID_CATEGORIES = [
  "quran",
  "hadith",
  "story",
  "dua",
  "adhkar",
  "other",
] as const;
const SOURCE_LOCKED_CATEGORIES = new Set<string>([
  "quran",
  "hadith",
  "story",
  "dua",
  "adhkar",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function ownStorageAudioUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    const configuredUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredUrl) return null;
    const configuredOrigin = new URL(configuredUrl).origin;
    if (
      url.protocol !== "https:" ||
      url.origin !== configuredOrigin ||
      url.username ||
      url.password ||
      url.hash
    )
      return null;
    if (
      !url.pathname.startsWith(
        "/storage/v1/object/public/videos/human-narration/"
      )
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi("video.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body: unknown = await request.json();
    if (!isObject(body))
      return NextResponse.json(
        { error: "بيانات طلب الفيديو غير صالحة." },
        { status: 400 }
      );

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" ? body.category : "";
    if (
      title.length < 3 ||
      title.length > 180 ||
      description.length < 5 ||
      description.length > 1000
    ) {
      return NextResponse.json(
        { error: "أدخل عنوانًا (3–180 حرفًا) ووصفًا (5–1000 حرف)." },
        { status: 400 }
      );
    }
    if (
      !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
    ) {
      return NextResponse.json(
        { error: "تصنيف الفيديو غير صالح." },
        { status: 400 }
      );
    }

    let content: Record<string, unknown> = isObject(body.content)
      ? { ...body.content }
      : {};
    const qualityProfile = {
      version: "2026.1",
      audience: category === "other" ? "general" : "family",
      hookSeconds: 3,
      structure: ["hook", "context", "source", "reflection", "action", "cta"],
      visualBeats: 6,
      pacing: category === "quran" || category === "adhkar" ? "calm" : "dynamic",
      captions: true,
      sourceCard: category !== "other",
      endCard: true,
      safeArea: true,
      audioMix: "voice-first",
      reviewRequired: true,
    } as const;
    content = { ...content, qualityProfile };
    let narration = "";
    let source: Awaited<ReturnType<typeof resolveVideoSource>> = null;

    if (SOURCE_LOCKED_CATEGORIES.has(category)) {
      const sourceId =
        typeof body.sourceId === "string" ? body.sourceId.trim() : "";
      if (!sourceId) {
        return NextResponse.json(
          { error: "اختر نصًا منشورًا من مكتبة المصادر قبل إنشاء الفيديو." },
          { status: 400 }
        );
      }
      source = await resolveVideoSource(category, sourceId);
      if (!source)
        source = resolveCuratedVideoSource(sourceId) as typeof source;
      if (!source || source.category !== category) {
        return NextResponse.json(
          {
            error:
              "المصدر غير موجود أو غير منشور أو لا يحتوي على مرجع موثوق. حدّث قائمة المصادر واختر مصدرًا آخر.",
          },
          { status: 422 }
        );
      }
      narration = source.text;
      content = {
        ...content,
        type: category,
        sourceType: category,
        sourceId: source.id,
        sourceUrl: source.sourceUrl,
        sourceLabel: source.sourceLabel,
        textAr: source.text,
        text: source.text,
        prompt: source.text,
        aiMode: "source_locked",
        sourceVerifiedAtRequest: true,
        ...(source.audience ? { audience: source.audience } : {}),
        ...(source.seriesId ? { seriesId: source.seriesId } : {}),
        ...(source.seriesTitle ? { seriesTitle: source.seriesTitle } : {}),
        ...(Number.isInteger(source.seasonNumber) ? { seasonNumber: source.seasonNumber } : {}),
        ...(Number.isInteger(source.episodeNumber) ? { episodeNumber: source.episodeNumber } : {}),
        ...(source.episodeTitle ? { episodeTitle: source.episodeTitle } : {}),
        ...(source.ageGroup ? { ageGroup: source.ageGroup } : {}),
        ...(source.learningObjective ? { learningObjective: source.learningObjective } : {}),
        ...(source.visualTheme ? { visualTheme: source.visualTheme } : {}),
        ...(source.generationMode ? { generationMode: source.generationMode } : {}),
        ...(Number.isInteger(source.factorySequence) ? { factorySequence: source.factorySequence } : {}),
        ...(source.audience === "kids" ? { voiceProfile: "kids_friendly", contentFormat: "series_episode" } : {}),
        ...(source.audioUrl ? { audioUrl: source.audioUrl } : {}),
        ...(source.grade ? { gradeAr: source.grade } : {}),
        ...(source.additionalSources?.length
          ? { additionalSources: source.additionalSources }
          : {}),
        ...(category === "quran"
          ? {
              surahId: Number(source.id.split(":")[1]),
              ayahNumber: Number(source.id.split(":")[2]),
            }
          : {}),
      };
    } else {
      const candidate =
        typeof body.narration === "string" ? body.narration : "";
      narration = candidate.replace(/\s+/g, " ").trim();
      if (narration.length < 30 || narration.length > 2500) {
        return NextResponse.json(
          { error: "النص العام يجب أن يكون بين 30 و2500 حرف." },
          { status: 400 }
        );
      }
      content = {
        ...content,
        type: category,
        text: narration,
        script: narration,
        prompt: narration,
        aiMode: "general_reminder",
      };
    }

    let humanAudioUrl: string | null = null;
    if (typeof body.humanAudioUrl === "string" && body.humanAudioUrl.trim()) {
      if (category === "quran") {
        return NextResponse.json(
          {
            error:
              "تلاوة القرآن تستخدم تسجيل التلاوة المرتبط بالآية؛ لا يمكن استبداله بتسجيل غير مرتبط بالمصدر.",
          },
          { status: 400 }
        );
      }
      humanAudioUrl = ownStorageAudioUrl(body.humanAudioUrl);
      if (!humanAudioUrl) {
        return NextResponse.json(
          {
            error:
              "ملف الصوت يجب أن يكون مرفوعًا عبر أداة التسجيل في الاستوديو.",
          },
          { status: 400 }
        );
      }
      content = {
        ...content,
        audioUrl: humanAudioUrl,
        audioSource: "human_recording",
      };
    }

    const result = await createVideoGenerationRequest({
      title,
      description,
      category,
      content,
    });
    if (!result)
      return NextResponse.json(
        { error: "تعذر حفظ طلب توليد الفيديو." },
        { status: 500 }
      );

    return NextResponse.json(
      {
        ...result,
        audioChoice: humanAudioUrl
          ? "human_recording"
          : category === "quran"
            ? "source_quran_recitation"
            : "arabic_neural_tts",
        sourceVerified: Boolean(source),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/admin/videos/create] POST:", error);
    return NextResponse.json(
      { error: "تعذر إنشاء طلب الفيديو." },
      { status: 500 }
    );
  }
}
