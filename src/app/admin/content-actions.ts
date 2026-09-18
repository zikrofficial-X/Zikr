"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { enforceAdminRateLimit } from "@/features/admin/services/rate-limit";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

type ManagedTable = "stories" | "articles" | "competitions" | "memorization_plans" | "pinned_messages";

const TABLES = new Set<ManagedTable>([
  "stories",
  "articles",
  "competitions",
  "memorization_plans",
  "pinned_messages",
]);

function getTarget(formData: FormData) {
  const table = String(formData.get("table") ?? "") as ManagedTable;
  const id = String(formData.get("id") ?? "").trim();
  const updatedAt = String(formData.get("updatedAt") ?? "").trim();
  if (!TABLES.has(table) || !id) throw new Error("عنصر محتوى غير صالح.");
  return { table, id, updatedAt: updatedAt || null };
}

export async function safeTogglePublishAction(formData: FormData) {
  const admin = await requireAdminPermission("content.publish");
  await enforceAdminRateLimit(admin, "content.publish", 30, 60);
  const { table, id, updatedAt } = getTarget(formData);
  const next = String(formData.get("next") ?? "false") === "true";
  const column = table === "pinned_messages" ? "is_active" : "published";

  if (updatedAt) {
    const result = await supabaseServerAdminRequest<Array<{ id: string }>>(
      `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&updated_at=eq.${encodeURIComponent(updatedAt)}&select=id`,
      { method: "GET" },
    );
    if (result.length === 0) throw new Error("تم تعديل هذا العنصر بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة.");
  }

  await supabaseServerAdminRequest(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ [column]: next, updated_at: new Date().toISOString() }),
  });

  await recordAdminAuditEvent({
    action: next ? "content.publish" : "content.unpublish",
    permission: "content.publish",
    resourceType: table,
    resourceId: id,
    metadata: { next, optimisticUpdatedAt: updatedAt },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin");
}

export async function safeDeleteContentAction(formData: FormData) {
  const admin = await requireAdminStepUp("content.delete", "/admin/content");
  await enforceAdminRateLimit(admin, "content.delete", 10, 60);
  const { table, id, updatedAt } = getTarget(formData);
  const column = table === "pinned_messages" ? "is_active" : "published";
  const current = await supabaseServerAdminRequest<Array<Record<string, unknown>>>(
    `/rest/v1/${table}?select=id,${column},updated_at&id=eq.${encodeURIComponent(id)}&limit=1`,
    { method: "GET" },
  );
  if (!current[0]) throw new Error("العنصر غير موجود.");
  if (Boolean(current[0][column])) throw new Error("لا يمكن حذف عنصر منشور. قم بإخفائه أولاً ثم أعد المحاولة.");
  if (updatedAt && String(current[0].updated_at) !== updatedAt) throw new Error("تم تعديل هذا العنصر بواسطة مستخدم آخر. حدّث الصفحة ثم أعد المحاولة.");

  await supabaseServerAdminRequest(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}${updatedAt ? `&updated_at=eq.${encodeURIComponent(updatedAt)}` : ""}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  await recordAdminAuditEvent({
    action: "content.delete",
    permission: "content.delete",
    resourceType: table,
    resourceId: id,
    metadata: { protectedPublishedDelete: true, optimisticUpdatedAt: updatedAt },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin");
}
