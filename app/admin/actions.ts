"use server";

/**
 * @openapi
 * POST /admin/site-setting (Server Action: saveSiteSettingAction)
 * Summary: Save site settings (upsert by key)
 * Tags: Admin
 * Auth: Required (admin role)
 * Request (FormData): key, title, body, imageUrl, logoUrl, youtubeChannelUrl, pinnedMessage
 *
 * POST /admin/story (Server Action: saveStoryAction)
 * Summary: Create or update a story (upsert by slug)
 * Tags: Admin
 * Auth: Required (admin role)
 * Request (FormData): title, slug, content, category, mood, published, coverImage
 *
 * POST /admin/competition (Server Action: saveCompetitionAction)
 * Summary: Create a competition
 * Tags: Admin
 * Auth: Required (admin role)
 * Request (FormData): title, description, prize, startsAt, endsAt, published, imageUrl, rules
 *
 * POST /admin/pinned-message (Server Action: savePinnedMessageAction)
 * Summary: Create a pinned message
 * Tags: Admin
 * Auth: Required (admin role)
 * Request (FormData): title, body, ctaLabel, ctaHref, published
 *
 * POST /admin/memorization-plan (Server Action: saveMemorizationPlanAction)
 * Summary: Create a memorization plan
 * Tags: Admin
 * Auth: Required (admin role)
 * Request (FormData): title, cadence, targetRef, prompt, tajweedFocus, published
 */
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

type SocialPlatform = "facebook" | "facebook_reels" | "youtube";

const VIDEO_CATEGORIES = new Set([
  "quran",
  "hadith",
  "story",
  "dua",
  "adhkar",
  "prophets",
  "companions",
  "scholars",
  "educational",
  "other",
]);

const VIDEO_GENERATION_CATEGORIES = new Set([
  "quran",
  "hadith",
  "story",
  "dua",
  "adhkar",
]);

type JsonRecord = Record<string, unknown>;

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function platforms(formData: FormData): SocialPlatform[] {
  return ["facebook", "facebook_reels", "youtube"].filter(
    (platform): platform is SocialPlatform =>
      formData.get(`share_${platform}`) === "on"
  );
}

function videoSlugFromTitle(title: string): string {
  const base = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${base || "video"}-${suffix}`;
}

async function queueSocialPublish(input: {
  contentType: string;
  contentId?: string | null;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  targetPlatforms: SocialPlatform[];
  scheduledAt?: string | null;
  metadata?: JsonRecord;
}) {
  if (input.targetPlatforms.length === 0) return;

  await supabaseServerAdminRequest("/rest/v1/social_publish_queue", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      content_type: input.contentType,
      content_id: input.contentId,
      title: input.title,
      body: input.body,
      image_url: input.imageUrl,
      video_url: input.videoUrl,
      target_platforms: input.targetPlatforms,
      scheduled_at: input.scheduledAt,
      metadata: input.metadata ?? {},
    }),
  });
}

export async function saveSiteSettingAction(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("key") ?? "").trim();
  if (!key) throw new Error("مفتاح الإعداد مطلوب.");

  const sectionKeys = [
    "showQuran",
    "showHadith",
    "showProphets",
    "showCompanions",
    "showKids",
    "showPoetry",
    "showPrayerTimes",
    "showMemorization",
  ] as const;

  const sectionEntries: [string, boolean][] = sectionKeys.map(k => [
    k,
    formData.get(k) === "on",
  ]);

  const stringEntries: [string, string | null][] = [
    ["title", value(formData, "title")],
    ["body", value(formData, "body")],
    ["imageUrl", value(formData, "imageUrl")],
    ["logoUrl", value(formData, "logoUrl")],
    ["youtubeChannelUrl", value(formData, "youtubeChannelUrl")],
    ["pinnedMessage", value(formData, "pinnedMessage")],
    ["facebookPageUrl", value(formData, "facebookPageUrl")],
    ["twitterUrl", value(formData, "twitterUrl")],
    ["instagramUrl", value(formData, "instagramUrl")],
  ];

  const valueObj: JsonRecord = {};
  for (const [k, v] of stringEntries) {
    if (v !== null) valueObj[k] = v;
  }
  for (const [k, v] of sectionEntries) {
    valueObj[k] = v;
  }

  const payload: JsonRecord = {
    key,
    value: valueObj,
    updated_at: new Date().toISOString(),
  };

  await supabaseServerAdminRequest("/rest/v1/site_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(payload),
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveStoryAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !slug || !content)
    throw new Error("العنوان والرابط والمحتوى مطلوبة.");

  await supabaseServerAdminRequest("/rest/v1/stories?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      title,
      slug,
      content,
      category: value(formData, "category") ?? "faith",
      mood: value(formData, "mood"),
      published: bool(formData, "published"),
      metadata: { coverImage: value(formData, "coverImage") },
      updated_at: new Date().toISOString(),
    }),
  });

  revalidatePath("/admin");
  revalidatePath("/stories");
}

export async function saveArticleAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !slug || !content)
    throw new Error("عنوان المقال والرابط والمحتوى مطلوبة.");

  const imageUrl = value(formData, "imageUrl");
  const summary = value(formData, "summary");
  const selectedPlatforms = platforms(formData);

  await supabaseServerAdminRequest("/rest/v1/articles?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      title,
      slug,
      content,
      summary,
      author: value(formData, "author") ?? "ZIKR",
      featured_image_url: imageUrl,
      published: bool(formData, "published"),
      metadata: { autoShare: selectedPlatforms.length > 0, source: "admin" },
      updated_at: new Date().toISOString(),
    }),
  });

  await queueSocialPublish({
    contentType: "article",
    contentId: slug,
    title,
    body: summary ?? content.slice(0, 500),
    imageUrl,
    targetPlatforms: selectedPlatforms,
    scheduledAt: value(formData, "scheduledAt"),
    metadata: { publicPath: `/articles/${slug}` },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
}

export async function saveVideoPostAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("عنوان الفيديو مطلوب.");

  const slug = value(formData, "slug") ?? videoSlugFromTitle(title);
  const description = value(formData, "description");
  const category = value(formData, "category") ?? "other";
  if (!VIDEO_CATEGORIES.has(category)) {
    throw new Error("يرجى اختيار تصنيف صحيح للفيديو.");
  }
  const caption = value(formData, "caption") ?? description;
  const youtubeId = value(formData, "youtubeId");
  const videoUrl = value(formData, "uploadedVideoUrl");
  const videoStorageKey = value(formData, "videoStorageKey");
  const thumbnailUrl = value(formData, "thumbnailUrl");
  const selectedPlatforms = platforms(formData);

  if (selectedPlatforms.length > 0 && !videoUrl) {
    throw new Error("للنشر التلقائي على Facebook أو YouTube يجب رفع ملف فيديو من حقل الرفع.");
  }

  await supabaseServerAdminRequest("/rest/v1/videos?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      title,
      slug,
      description,
      youtube_id: youtubeId,
      thumbnail_url: thumbnailUrl,
      published: bool(formData, "published"),
      metadata: {
        autoShare: selectedPlatforms.length > 0,
        source: "admin",
        caption,
        category,
        sourceVideoUrl: videoUrl,
        sourceStorageKey: videoStorageKey,
      },
      updated_at: new Date().toISOString(),
    }),
  });

  if (bool(formData, "generateVideo")) {
    if (!VIDEO_GENERATION_CATEGORIES.has(category)) {
      throw new Error("يرجى اختيار تصنيف صحيح لتوليد الفيديو.");
    }

    const script = value(formData, "script")?.replace(/\s+/g, " ").trim() ?? "";
    if (script.length < 30) {
      throw new Error(
        "يرجى إدخال نص مراجَع لا يقل عن 30 حرفاً قبل توليد الفيديو تلقائياً."
      );
    }

    await supabaseServerAdminRequest("/rest/v1/video_generation_requests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        title,
        description,
        category,
        content: {
          prompt: script,
          publicPath: `/videos/${slug}`,
        },
        thumbnail_url: thumbnailUrl,
        status: "pending",
      }),
    });
  }

  await queueSocialPublish({
    contentType: "video",
    contentId: slug,
    title,
    body: caption,
    imageUrl: thumbnailUrl,
    videoUrl,
    targetPlatforms: selectedPlatforms,
    scheduledAt: value(formData, "scheduledAt"),
          metadata: {
        publicPath: `/videos/${slug}`,
        caption,
        category,
        sourceStorageKey: videoStorageKey,
        sourceVideoUrl: videoUrl,
      },

  });

  revalidatePath("/admin");
  revalidatePath("/admin/videos");
  revalidatePath("/videos");
  revalidatePath(`/videos/${slug}`);
}

export async function saveCompetitionAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("عنوان المسابقة مطلوب.");

  await supabaseServerAdminRequest("/rest/v1/competitions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      title,
      description: value(formData, "description"),
      prize: value(formData, "prize"),
      starts_at: value(formData, "startsAt"),
      ends_at: value(formData, "endsAt"),
      published: bool(formData, "published"),
      metadata: {
        imageUrl: value(formData, "imageUrl"),
        rules: value(formData, "rules"),
      },
    }),
  });

  revalidatePath("/admin");
}

export async function savePinnedMessageAction(formData: FormData) {
  await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("نص الرسالة المثبتة مطلوب.");

  const priorityRaw = Number(value(formData, "priority") ?? "0");

  await supabaseServerAdminRequest("/rest/v1/pinned_messages", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      title: value(formData, "title") ?? "رسالة مثبتة",
      body,
      type: value(formData, "type") ?? "info",
      priority: Number.isFinite(priorityRaw) ? priorityRaw : 0,
      is_active: bool(formData, "published"),
    }),
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

// ─── User role management ────────────────────────────────────────────────────
export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!userId) throw new Error("معرّف المستخدم مطلوب.");
  if (role !== "admin" && role !== "user") throw new Error("الدور غير صالح.");
  if (userId === admin.id && role !== "admin") {
    throw new Error("لا يمكنك إزالة صلاحية الأدمن عن نفسك.");
  }

  await supabaseServerAdminRequest(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ role, updated_at: new Date().toISOString() }),
    }
  );

  await supabaseServerAdminRequest("/rest/v1/admin_actions_audit", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: admin.id,
      action: "update_user_role",
      meta: { target_user_id: userId, role },
    }),
  });

  revalidatePath("/admin/users");
}

// ─── Content management (delete / toggle publish) ────────────────────────────
const MANAGED_TABLES = {
  stories: {
    publishColumn: "published",
    paths: ["/stories", "/admin/content"],
  },
  articles: {
    publishColumn: "published",
    paths: ["/articles", "/admin/content"],
  },
  competitions: {
    publishColumn: "published",
    paths: ["/competitions", "/admin"],
  },
  memorization_plans: {
    publishColumn: "published",
    paths: ["/memorization", "/admin"],
  },
  pinned_messages: { publishColumn: "is_active", paths: ["/", "/admin"] },
} as const;

type ManagedTable = keyof typeof MANAGED_TABLES;

function assertManagedTable(table: string): asserts table is ManagedTable {
  if (!(table in MANAGED_TABLES)) throw new Error("جدول غير مسموح بإدارته.");
}

export async function deleteContentAction(formData: FormData) {
  await requireAdmin();
  const table = String(formData.get("table") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  assertManagedTable(table);
  if (!id) throw new Error("المعرّف مطلوب.");

  await supabaseServerAdminRequest(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    }
  );

  revalidatePath("/admin");
  for (const path of MANAGED_TABLES[table].paths) revalidatePath(path);
}

export async function togglePublishAction(formData: FormData) {
  await requireAdmin();
  const table = String(formData.get("table") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  const next = formData.get("next") === "true";
  assertManagedTable(table);
  if (!id) throw new Error("المعرّف مطلوب.");

  const column = MANAGED_TABLES[table].publishColumn;

  await supabaseServerAdminRequest(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        [column]: next,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  revalidatePath("/admin");
  for (const path of MANAGED_TABLES[table].paths) revalidatePath(path);
}

export async function saveMemorizationPlanAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("عنوان خطة الحفظ مطلوب.");

  await supabaseServerAdminRequest("/rest/v1/memorization_plans", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      title,
      cadence: value(formData, "cadence") ?? "daily",
      target_ref: value(formData, "targetRef"),
      prompt: value(formData, "prompt"),
      tajweed_focus: value(formData, "tajweedFocus"),
      published: bool(formData, "published"),
    }),
  });

  revalidatePath("/admin");
  revalidatePath("/memorization");
}
