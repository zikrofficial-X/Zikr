"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/services/admin";
import { uploadCloudinaryImage } from "@/features/media/services/cloudinary";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { isRegisteredGameId } from "@/lib/games/registry";

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function parseQuizData(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as { questions?: unknown }).questions)
    ) {
      throw new Error();
    }
    return parsed;
  } catch {
    throw new Error(
      "بيانات اللعبة / الاختبار يجب أن تكون JSON صحيحًا ويحتوي على questions."
    );
  }
}

function normalizeSlug(slug: string) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function saveKidsContentAction(formData: FormData) {
  await requireAdmin();

  const title_ar = String(formData.get("title_ar") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? "").trim());
  const content_ar = String(formData.get("content_ar") ?? "").trim();
  const type = value(formData, "type") ?? "story";
  const gameId = value(formData, "game_id");

  if (!title_ar || !slug || !content_ar) {
    throw new Error("العنوان بالعربية والرابط المختصر والمحتوى كلها مطلوبة.");
  }

  const featuredImageFile = formData.get("featured_image_file");
  const featuredImageUrl =
    featuredImageFile instanceof File && featuredImageFile.size > 0
      ? (
          await uploadCloudinaryImage({
            file: featuredImageFile,
            folder: "zikr/kids",
            publicId: slug,
            tags: ["zikr", "kids-content"],
          })
        ).secureUrl
      : value(formData, "featured_image_url");

  if (type === "game" && !isRegisteredGameId(gameId)) {
    throw new Error("معرف اللعبة غير مسجل أو غير صالح.");
  }

  await supabaseServerAdminRequest("/rest/v1/kids_content?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      title_ar,
      title_en: value(formData, "title_en") ?? title_ar,
      slug,
      type,
      content_ar,
      content_en: value(formData, "content_en"),
      age_group: value(formData, "age_group") ?? "6-8",
      featured_image_url: featuredImageUrl,
      video_url: value(formData, "video_url"),
      quiz_data: parseQuizData(value(formData, "quiz_data")),
      published: formData.has("published"),
      metadata: {
        reward: value(formData, "reward"),
        memorizationTarget: value(formData, "memorization_target"),
        ...(type === "game" && gameId
          ? { gameId, version: 1, difficulty: "easy" }
          : {}),
      },
      updated_at: new Date().toISOString(),
    }),
  });

  revalidatePath("/kids");
  revalidatePath(`/kids/${slug}`);
  revalidatePath("/admin/kids");
}
