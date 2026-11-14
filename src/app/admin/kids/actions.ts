"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import {
  deleteCloudinaryImageIfUnreferenced,
  uploadCloudinaryImage,
  type CloudinaryImageUpload,
} from "@/features/media/services/cloudinary";
import { isDefinitiveSupabaseInsertRejection } from "@/features/media/services/cloudinary-orphan-compensation";
import { isCloudinarySecureImageUrl } from "@/features/media/services/cloudinary-validation";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";
import { isRegisteredGameId } from "@/lib/games/registry";
import { isKidsContentType, normalizeKidsVideoEmbedUrl, parseKidsQuizData } from "@/features/kids/services/kids-content-validation";

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function normalizeSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function compensateOrphanedKidsImage(
  upload: CloudinaryImageUpload | null,
  requestedPublicId: string | null,
) {
  if (!upload || !requestedPublicId) return;
  try {
    const result = await deleteCloudinaryImageIfUnreferenced({
      publicId: upload.publicId,
      expectedPublicId: requestedPublicId,
      secureUrl: upload.secureUrl,
      isReferenced: async ({ secureUrl }) => {
        const rows = await supabaseServerAdminRequest<Array<{ id: string }>>(
          "/rest/v1/kids_content?select=id&featured_image_url=eq." +
            encodeURIComponent(secureUrl) +
            "&limit=1",
          { method: "GET" },
        );
        if (!Array.isArray(rows)) {
          throw new Error("Unable to verify whether the uploaded Kids image is still referenced.");
        }
        return rows.length > 0;
      },
    });
    if (result === "referenced") {
      console.warn(
        "[admin/kids] orphan image compensation skipped because the exact image URL is still referenced.",
      );
    }
  } catch (cleanupError) {
    console.warn(
      "[admin/kids] orphan image compensation failed safely; the Cloudinary asset was retained.",
      cleanupError,
    );
  }
}

export async function saveKidsContentAction(formData: FormData) {
  await requireAdminPermission("kids.manage");

  const title_ar = String(formData.get("title_ar") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? "").trim());
  const content_ar = String(formData.get("content_ar") ?? "").trim();
  const type = value(formData, "type") ?? "story";
  const gameId = value(formData, "game_id");
  const allowedAgeGroups = new Set(["3-5", "6-8", "9-12", "13-15"]);
  const ageGroup = value(formData, "age_group") ?? "6-8";
  const ageAppropriate = type === "story" && formData.get("age_appropriate") === "on";
  const published = formData.get("published") === "on";
  if (published || ageAppropriate) await requireAdminStepUp("content.publish", "/admin/kids");
  const rawVideoUrl = value(formData, "video_url");
  if (rawVideoUrl && type !== "video") throw new Error("رابط الفيديو مسموح به لمحتوى الفيديو فقط.");
  const videoUrl = rawVideoUrl ? normalizeKidsVideoEmbedUrl(rawVideoUrl) : null;
  if (rawVideoUrl && !videoUrl) throw new Error("يجب استخدام رابط تضمين HTTPS صالح من YouTube فقط.");

  if (!isKidsContentType(type)) throw new Error("نوع محتوى الأطفال غير صالح.");
  if (!allowedAgeGroups.has(ageGroup)) throw new Error("الفئة العمرية غير صالحة.");
  if (type === "story" && published && !ageAppropriate) {
    throw new Error("يجب اعتماد ملاءمة القصة للعمر قبل نشرها.");
  }
  if (type === "video" && !videoUrl) {
    throw new Error("رابط فيديو YouTube آمن مطلوب قبل نشر محتوى الفيديو.");
  }

  if (!title_ar || !slug || !content_ar) {
    throw new Error("العنوان بالعربية والرابط المختصر والمحتوى كلها مطلوبة.");
  }

  // Validate structured form data before uploading media so rejected forms do not leave orphaned Cloudinary assets.
  const quizData = type === "quiz" ? parseKidsQuizData(value(formData, "quiz_data")) : null;
  if (type === "quiz" && !quizData) {
    throw new Error("بيانات الاختبار مطلوبة.");
  }
  const existingSlug = await supabaseServerAdminRequest<Array<{ id: string }>>(
    "/rest/v1/kids_content?select=id&slug=eq." + encodeURIComponent(slug) + "&limit=1",
    { method: "GET" },
  );
  if (!Array.isArray(existingSlug) || existingSlug.some((row) => typeof row?.id !== "string" || !row.id.trim())) {
    throw new Error("تعذر التحقق من الرابط المختصر. حاول مرة أخرى.");
  }
  if (existingSlug.length > 0) {
    throw new Error("الرابط المختصر مستخدم بالفعل. اختر رابطًا جديدًا.");
  }
  if (type === "game" && !isRegisteredGameId(gameId)) {
    throw new Error("معرف اللعبة غير مسجل أو غير صالح.");
  }

  const featuredImageFile = formData.get("featured_image_file");
  let featuredImageUrl = value(formData, "featured_image_url");
  let uploadedImage: CloudinaryImageUpload | null = null;
  let requestedPublicId: string | null = null;
  const hasFeaturedImageFile = featuredImageFile instanceof File && featuredImageFile.size > 0;
  if (hasFeaturedImageFile || featuredImageUrl) {
    // The hidden URL field is client-controlled too; media.manage must cover
    // both a new upload and attaching an existing Cloudinary image.
    await requireAdminPermission("media.manage");
  }
  if (hasFeaturedImageFile) {
    requestedPublicId = slug + "-" + randomUUID();
    uploadedImage = await uploadCloudinaryImage({
      file: featuredImageFile as File,
      folder: "zikr/kids",
      publicId: requestedPublicId,
      tags: ["zikr", "kids-content"],
      maxBytes: 3 * 1024 * 1024,
    });
    featuredImageUrl = uploadedImage.secureUrl;
  }
  if (
    featuredImageUrl &&
    !isCloudinarySecureImageUrl(featuredImageUrl, process.env.CLOUDINARY_CLOUD_NAME)
  ) {
    await compensateOrphanedKidsImage(uploadedImage, requestedPublicId);
    throw new Error("الصورة المميزة يجب أن تكون من حساب Cloudinary المعتمد للمشروع.");
  }

  let saved: Array<{ id: string; slug: string }>;
  try {
    saved = await supabaseServerAdminRequest<Array<{ id: string; slug: string }>>("/rest/v1/kids_content?select=id,slug", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title_ar,
        title_en: value(formData, "title_en") ?? title_ar,
        slug,
        type,
        content_ar,
        content_en: value(formData, "content_en"),
        age_group: ageGroup,
        featured_image_url: featuredImageUrl,
        video_url: videoUrl,
        quiz_data: quizData,
        published,
        metadata: {
          ...(type === "story" ? { age_appropriate: ageAppropriate } : {}),
          reward: value(formData, "reward"),
          memorizationTarget: value(formData, "memorization_target"),
          ...(type === "game" && gameId
            ? { gameId, version: 1, difficulty: "easy" }
            : {}),
        },
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (saveError) {
    if (isDefinitiveSupabaseInsertRejection(saveError)) {
      await compensateOrphanedKidsImage(uploadedImage, requestedPublicId);
    } else {
      console.warn(
        "[admin/kids] database insert outcome is ambiguous; retaining the Cloudinary image for reconciliation.",
        saveError,
      );
    }
    throw saveError;
  }
  if (
    !Array.isArray(saved) ||
    saved.length !== 1 ||
    typeof saved[0]?.id !== "string" ||
    !saved[0].id.trim() ||
    saved[0].slug !== slug
  ) {
    await compensateOrphanedKidsImage(uploadedImage, requestedPublicId);
    throw new Error("لم يتم تأكيد حفظ محتوى الأطفال من قاعدة البيانات.");
  }
  let auditError: unknown = null;
  try {
    await recordAdminAuditEvent({
      action: "kids.content.save",
      permission: "kids.manage",
      resourceType: "kids_content",
      resourceId: saved[0].id,
      metadata: { slug, type, published, ageGroup, ageAppropriate: type === "story" ? ageAppropriate : null, gameId },
    });
  } catch (error) {
    auditError = error;
  }

  revalidatePath("/api/kids/content");
  revalidatePath("/kids");
  revalidatePath(`/kids/${slug}`);
  revalidatePath("/admin/kids");
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemap-index.xml");
  revalidatePath("/sitemap-content/[id]", "page");

  if (auditError) {
    console.warn("[admin/kids] audit event unavailable after content save:", auditError);
    throw new Error("Kids content was saved, but its audit event could not be recorded. Do not repeat the action; notify an owner.");
  }
}

export async function reviewKidsStoryAgeSuitabilityAction(formData: FormData) {
  await requireAdminPermission("kids.manage");
  await requireAdminStepUp("content.publish", "/admin/kids/content");

  const id = value(formData, "id");
  const expectedUpdatedAt = value(formData, "expected_updated_at");
  const decision = value(formData, "decision");
  const confirmReview = formData.get("confirm_review") === "on";
  const reviewNote = String(formData.get("review_note") ?? "").trim();

  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("معرف القصة غير صالح.");
  }
  if (!expectedUpdatedAt || !Number.isFinite(Date.parse(expectedUpdatedAt))) {
    throw new Error("تعذر التحقق من إصدار القصة. حدّث الصفحة ثم أعد المحاولة.");
  }
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("قرار مراجعة ملاءمة العمر غير صالح.");
  }
  if (!confirmReview) {
    throw new Error("يجب تأكيد قراءة القصة كاملة قبل تسجيل قرار المراجعة.");
  }
  if (reviewNote.length > 500 || (decision === "rejected" && reviewNote.length < 10)) {
    throw new Error("اكتب سببًا واضحًا لا يقل عن 10 أحرف عند رفض ملاءمة القصة، وبحد أقصى 500 حرف.");
  }

  const rows = await supabaseServerAdminRequest<Array<{
    id: string;
    slug: string;
    type: string;
    age_group: string | null;
    content_ar: string;
    metadata: Record<string, unknown> | null;
    updated_at: string;
  }>>(
    "/rest/v1/kids_content?id=eq." + encodeURIComponent(id) +
      "&select=id,slug,type,age_group,content_ar,metadata,updated_at&limit=2",
    { method: "GET" },
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("لم يتم العثور على القصة المطلوبة للمراجعة.");
  }

  const current = rows[0];
  const allowedAgeGroups = new Set(["3-5", "6-8", "9-12", "13-15"]);
  if (
    current.type !== "story" ||
    typeof current.content_ar !== "string" ||
    !current.content_ar.trim() ||
    !allowedAgeGroups.has(current.age_group ?? "")
  ) {
    throw new Error("لا يمكن اعتماد هذا السجل كقصة صالحة للمراجعة العمرية.");
  }
  if (current.updated_at !== expectedUpdatedAt) {
    throw new Error("تغيرت القصة منذ تحميلها. حدّث الصفحة واقرأ النسخة الأحدث قبل المراجعة.");
  }

  const metadataValue: unknown = current.metadata;
  if (metadataValue !== null && (typeof metadataValue !== "object" || Array.isArray(metadataValue))) {
    throw new Error("بيانات القصة الوصفية ليست كائنًا صالحًا؛ لم يتم تعديل أي بيانات.");
  }
  const existingMetadata = (metadataValue ?? {}) as Record<string, unknown>;
  const approved = decision === "approved";
  const nextMetadata = { ...existingMetadata, age_appropriate: approved };
  const nextUpdatedAt = buildNextRowVersionUpdatedAt(current.updated_at);
  const updated = await supabaseServerAdminRequest<Array<{ id: string; updated_at: string }>>(
    "/rest/v1/kids_content?id=eq." + encodeURIComponent(id) +
      "&updated_at=eq." + encodeURIComponent(current.updated_at) +
      "&select=id,updated_at",
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ metadata: nextMetadata, updated_at: nextUpdatedAt }),
    },
  );

  if (!Array.isArray(updated) || updated.length !== 1 || updated[0]?.id !== id) {
    throw new Error("تغيرت القصة أثناء الحفظ. لم يتم تسجيل القرار؛ حدّث الصفحة ثم أعد المراجعة.");
  }

  let auditError: unknown = null;
  try {
    await recordAdminAuditEvent({
      action: approved ? "kids.story.age_approval.approved" : "kids.story.age_approval.rejected",
      permission: "content.publish",
      resourceType: "kids_content",
      resourceId: id,
      metadata: {
        slug: current.slug,
        ageGroup: current.age_group,
        decision,
        previousAgeAppropriate: current.metadata?.age_appropriate === true,
        reviewNote: reviewNote || null,
      },
    });
  } catch (error) {
    auditError = error;
  }

  revalidatePath("/admin/kids/content");
  revalidatePath("/admin/kids");
  revalidatePath("/api/kids/content");
  revalidatePath("/kids");
  revalidatePath(`/kids/${current.slug}`);

  if (auditError) {
    console.warn("[admin/kids] age-review audit event unavailable after metadata update:", auditError);
    throw new Error("تم حفظ قرار المراجعة، لكن تعذر تسجيل سجل التدقيق. لا تكرر الإرسال؛ أبلغ مالك النظام.");
  }
}
