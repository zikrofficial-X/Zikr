import { NextRequest, NextResponse } from "next/server";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { readBoundedJsonBody } from "@/lib/request/bounded-json-body";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { runPostCommitAudit } from "@/features/admin/services/post-commit-audit";
import { createVideoGenerationRequest } from "@/features/videos/services/video-automation";
import { resolveVideoSource } from "@/features/videos/services/video-sources";
import { resolveCuratedVideoSource } from "@/features/videos/data/curated-content";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { isVideoTemplateAssetAllowedForAudience, parseVideoTemplateConfig } from "@/features/videos/services/template-config";
import { versionedTemplateLabel } from "@/features/videos/services/video-template-version";

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

function ownCloudinaryAudioUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    if (!cloudName || url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" ||
        url.username || url.password || url.hash) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== "video" || parts[2] !== "upload") return null;
    const mediaParts = parts.slice(3);
    const version = mediaParts[0] ?? "";
    if (version.startsWith("v") && version.slice(1) && [...version.slice(1)].every(ch => ch >= "0" && ch <= "9")) mediaParts.shift();
    const fileName = mediaParts.pop() ?? "";
    const dot = fileName.lastIndexOf(".");
    const publicId = [...mediaParts, dot > 0 ? fileName.slice(0, dot) : fileName].join("/");
    const validExtension = [".mp3", ".m4a", ".wav", ".ogg", ".webm"].some(ext => fileName.toLowerCase().endsWith(ext));
    if (!publicId.startsWith("audio-human-") || !validExtension) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminStepUpApi("video.manage", "/admin/video/studio");
  if (!auth.ok)
    return NextResponse.json(
      { error: auth.error, nextPath: "nextPath" in auth ? auth.nextPath : undefined },
      { status: auth.status, headers: { "Cache-Control": "no-store" } },
    );

  try {
    const bodyResult = await readBoundedJsonBody(request, 64 * 1024);
    if (!bodyResult.ok) {
      return NextResponse.json(
        { error: bodyResult.error },
        { status: bodyResult.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    const body: unknown = bodyResult.value;
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
    content = {
      ...content, qualityProfile, approvalStatus: "awaiting_human_review",
      approvalReviewedAt: null, qualityReview: null,
      aiDisclosure: {
        version: "2026-01",
        statementAr: "قد تُستخدم أدوات الذكاء الاصطناعي في العناصر المرئية والتعليقات المصاحبة؛ النص المرجعي الديني يظل مقفلاً من المصدر الموثوق.",
        sourceTextLocked: SOURCE_LOCKED_CATEGORIES.has(category),
      },
    };
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

    if (typeof content.templateVersionId === "string" && content.templateVersionId.trim()) {
      const versionId = content.templateVersionId.trim();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(versionId)) {
        return NextResponse.json({ error: "إصدار القالب المحدد غير صالح." }, { status: 400 });
      }
      const versions = await supabaseServerAdminRequest<Array<{
        id: string; template_id: string; version: number; config: unknown; status: string;
      }>>(
        `/rest/v1/video_template_versions?id=eq.${encodeURIComponent(versionId)}&select=id,template_id,version,config,status&limit=1`,
      );
      const templateVersion = versions?.[0];
      if (!templateVersion || templateVersion.status !== "active") {
        return NextResponse.json({ error: "اختر إصدار قالب نشطًا؛ المسودات والإصدارات القديمة لا تقبل طلبات إنتاج جديدة." }, { status: 409 });
      }
      const templates = await supabaseServerAdminRequest<Array<{
        id: string; slug: string; audience: "general" | "kids";
      }>>(
        `/rest/v1/video_templates?id=eq.${encodeURIComponent(templateVersion.template_id)}&select=id,slug,audience&limit=1`,
      );
      const template = templates?.[0];
      const config = parseVideoTemplateConfig(templateVersion.config);
      if (!template || !config || !isVideoTemplateAssetAllowedForAudience(config.assetKey, template.audience)) {
        return NextResponse.json({ error: "إعدادات القالب لا تجتاز تحقق محرك الرندر." }, { status: 422 });
      }
      const requestedAudience = content.audience === "kids" ? "kids" : "general";
      if (requestedAudience !== template.audience) {
        return NextResponse.json({ error: "القالب المختار لا يتوافق مع فئة الجمهور لهذا الفيديو." }, { status: 422 });
      }
      content = {
        ...content,
        templateVersion: versionedTemplateLabel(template.slug, templateVersion.version),
        templateAssetKey: config.assetKey,
        templateAudience: template.audience,
        templateMotion: config.motion,
        templateConfigSnapshot: config,
        videoFormat: config.defaultFormat,
        resolution: config.defaultFormat === "vertical" ? "1080x1920" : "1920x1080",
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
      humanAudioUrl = ownCloudinaryAudioUrl(body.humanAudioUrl);
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
    const auditRecorded = await runPostCommitAudit(
      () => recordAdminAuditEvent({
      action: "video_generation.create",
      permission: "video.manage",
      resourceType: "video_generation_requests",
      resourceId: result.id,
      metadata: { category, sourceVerified: Boolean(source), hasHumanAudio: Boolean(humanAudioUrl), templateVersionId: typeof content.templateVersionId === "string" ? content.templateVersionId : null, templateVersion: typeof content.templateVersion === "string" ? content.templateVersion : null },
      }),
      (auditError) => console.error("[api/admin/videos/create] audit event failed after committed mutation:", auditError),
    );

    return NextResponse.json(
      {
        ...result,
        auditRecorded,
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
