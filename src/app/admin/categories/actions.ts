"use server";

import { revalidatePath } from "next/cache";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

const CATEGORY_TABLES = new Set([
  "article_categories",
  "dua_categories",
  "video_categories",
  "tawasheeh_categories",
]);

function readText(formData: FormData, key: string, required = false) {
  const value = String(formData.get(key) ?? "").trim();
  if (required && !value) throw new Error(`الحقل ${key} مطلوب.`);
  return value || null;
}

function readTable(formData: FormData) {
  const table = String(formData.get("table") ?? "");
  if (!CATEGORY_TABLES.has(table)) throw new Error("مجموعة تصنيفات غير صالحة.");
  return table;
}

function revalidateCategoryPages(table: string) {
  revalidatePath("/admin/categories");
  if (table === "article_categories") revalidatePath("/articles");
  if (table === "dua_categories") revalidatePath("/dua");
  if (table === "video_categories") revalidatePath("/videos");
  if (table === "tawasheeh_categories") revalidatePath("/tawasheeh");
}

export async function createCategoryAction(formData: FormData) {
  const admin = await requireAdminStepUp("content.manage", "/admin/categories");
  const table = readTable(formData);
  const nameAr = readText(formData, "name_ar", true)!;
  const nameEn = readText(formData, "name_en", true)!;
  const slug = readText(formData, "slug", true)!;
  const descriptionAr = readText(formData, "description_ar");
  const icon = readText(formData, "icon");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("الرابط المختصر يجب أن يكون إنجليزيًا صغيرًا ويفصل بين كلماته بشرطة.");
  }
  if (nameAr.length > 180 || nameEn.length > 180 || slug.length > 120) {
    throw new Error("أحد الحقول يتجاوز الحد المسموح.");
  }

  const payload: Record<string, unknown> = {
    name_ar: nameAr,
    name_en: nameEn,
    slug,
    description_ar: descriptionAr,
    icon,
    published: false,
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (table === "tawasheeh_categories") {
    const rawOrder = String(formData.get("order_num") ?? "").trim();
    const orderNum = rawOrder ? Number(rawOrder) : 0;
    if (!Number.isInteger(orderNum) || orderNum < 0 || orderNum > 100000) {
      throw new Error("ترتيب التصنيف غير صالح.");
    }
    payload.order_num = orderNum;
  }

  const rows = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/${table}?select=id`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );
  const id = rows[0]?.id;
  if (!id) throw new Error("لم يتم تأكيد إنشاء التصنيف من قاعدة البيانات.");

  await recordAdminAuditEvent({
    action: "categories.create",
    permission: "content.manage",
    resourceType: table,
    resourceId: id,
    metadata: { name_ar: nameAr, slug, actor: admin.id },
  });

  revalidateCategoryPages(table);
}

export async function toggleCategoryVisibilityAction(formData: FormData) {
  const admin = await requireAdminStepUp("content.manage", "/admin/categories");
  const table = readTable(formData);
  const id = readText(formData, "id", true)!;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("معرّف التصنيف غير صالح.");

  const rows = await supabaseServerAdminRequest<Array<{
    id: string;
    name_ar: string;
    is_active: boolean | null;
    published: boolean | null;
  }>>(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=id,name_ar,is_active,published&limit=1`,
    { method: "GET" },
  );
  const category = rows[0];
  if (!category) throw new Error("التصنيف غير موجود.");

  const currentlyActive = category.is_active ?? category.published ?? true;
  const nextActive = !currentlyActive;
  await supabaseServerAdminRequest(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        is_active: nextActive,
        published: nextActive,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  await recordAdminAuditEvent({
    action: "categories.visibility.update",
    permission: "content.manage",
    resourceType: table,
    resourceId: id,
    metadata: {
      name_ar: category.name_ar,
      previous_active: currentlyActive,
      next_active: nextActive,
      actor: admin.id,
    },
  });

  revalidateCategoryPages(table);
}
