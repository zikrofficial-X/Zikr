"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function boundedText(formData: FormData, key: string, maxLength: number): string {
  const result = value(formData, key);
  if (result.length > maxLength) throw new Error(`الحقل ${key} يتجاوز الحد المسموح.`);
  return result;
}

function readBoolean(formData: FormData, key: string): boolean {
  const values = formData.getAll(key).map((item) => String(item).trim());
  const result = values.at(-1) ?? "false";
  if (result !== "true" && result !== "false") throw new Error("قيمة اختيار غير صالحة.");
  return result === "true";
}

function optionalHttpsUrl(raw: string, label: string): string | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`الرابط غير صالح في حقل ${label}.`);
  }
  if (parsed.protocol !== "https:" || !parsed.hostname) {
    throw new Error(`يجب أن يستخدم رابط ${label} بروتوكول HTTPS.`);
  }
  return parsed.toString();
}

function safeImagePath(raw: string): string {
  if (!raw) return "/branding/og-image.png";
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  const url = optionalHttpsUrl(raw, "صورة المشاركة");
  if (!url) return "/branding/og-image.png";
  return url;
}

export async function savePublicSiteSettingAction(formData: FormData) {
  const profile = await requireAdminPermission("settings.manage");
  const section = value(formData, "section");
  if (section !== "homepage" && section !== "seo" && section !== "social") {
    throw new Error("قسم الإعدادات العامة غير مدعوم.");
  }

  let setting: Record<string, unknown>;
  if (section === "homepage") {
    setting = {
      title: boundedText(formData, "title", 120) || "ذِكرٌ",
      body: boundedText(formData, "body", 600) || "منصة إسلامية مرتبة للقراءة والذكر والتعلّم والعمل.",
      showQuran: readBoolean(formData, "showQuran"),
      showHadith: readBoolean(formData, "showHadith"),
      showPrayerTimes: readBoolean(formData, "showPrayerTimes"),
    };
  } else if (section === "seo") {
    setting = {
      title: boundedText(formData, "title", 120) || "ZIKR | ذِكرٌ",
      description: boundedText(formData, "description", 320) || "منصة إسلامية شاملة للقرآن الكريم والأحاديث والأذكار ومواقيت الصلاة.",
      keywords: boundedText(formData, "keywords", 500)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 30),
    };
  } else {
    const facebookPageUrl = optionalHttpsUrl(value(formData, "facebookPageUrl"), "فيسبوك");
    const youtubeChannelUrl = optionalHttpsUrl(value(formData, "youtubeChannelUrl"), "يوتيوب");
    const instagramUrl = optionalHttpsUrl(value(formData, "instagramUrl"), "إنستجرام");
    const xUrl = optionalHttpsUrl(value(formData, "xUrl"), "X/Twitter");
    setting = {
      ogTitle: boundedText(formData, "ogTitle", 120) || "ZIKR | ذِكرٌ",
      ogDescription: boundedText(formData, "ogDescription", 320) || "منصة إسلامية مرتبة للقراءة والذكر والتعلّم والعمل.",
      ogImageUrl: safeImagePath(value(formData, "ogImageUrl")),
      facebookPageUrl,
      youtubeChannelUrl,
      instagramUrl,
      xUrl,
      twitterUrl: xUrl,
    };
  }

  const updatedAt = new Date().toISOString();
  await supabaseServerAdminRequest("/rest/v1/site_settings?on_conflict=key", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: section,
      value: setting,
      updated_at: updatedAt,
    }),
  });

  await recordAdminAuditEvent({
    action: "admin.site_settings.update",
    permission: "settings.manage",
    resourceType: "site_settings",
    resourceId: section,
    metadata: { section, fields: Object.keys(setting), actor: profile.id },
  });

  revalidatePath("/");
  revalidatePath("/videos");
  revalidatePath("/admin/seo");
  redirect("/admin/seo?saved=" + section);
}
