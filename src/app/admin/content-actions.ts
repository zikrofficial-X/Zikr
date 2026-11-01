"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { enforceAdminRateLimit } from "@/features/admin/services/rate-limit";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import {
  deleteManagedContent,
  toggleManagedContent,
  type ManagedContentTable,
} from "@/features/admin/services/content";

const TABLES = new Set<ManagedContentTable>([
  "stories",
  "articles",
  "competitions",
  "memorization_plans",
  "pinned_messages",
]);

function getTarget(formData: FormData) {
  const table = String(formData.get("table") ?? "") as ManagedContentTable;
  const id = String(formData.get("id") ?? "").trim();
  const updatedAt = String(formData.get("updatedAt") ?? "").trim();
  if (!TABLES.has(table) || !id) throw new Error("عنصر محتوى غير صالح.");
  return { table, id, updatedAt: updatedAt || null };
}

export async function safeTogglePublishAction(formData: FormData) {
  const admin = await requireAdminStepUp("content.publish", "/admin/content");
  await enforceAdminRateLimit(admin, "content.publish", 30, 60);
  const { table, id, updatedAt } = getTarget(formData);
  const next = String(formData.get("next") ?? "false") === "true";
  await toggleManagedContent(table, id, next, updatedAt);

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
  await deleteManagedContent(table, id, updatedAt);

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

export async function scheduleContentPublishAction(formData: FormData) {
  const admin = await requireAdminPermission("content.publish");
  await enforceAdminRateLimit(admin, "content.publish", 30, 60);
  const { table, id } = getTarget(formData);
  const targetRows = await supabaseServerAdminRequest<Array<{ id: string; published: boolean | null }>>(
    `/rest/v1/${table}?select=id,published&id=eq.${encodeURIComponent(id)}&limit=1`,
    { method: "GET" },
  );
  if (!targetRows[0]) throw new Error("عنصر المحتوى غير موجود.");
  if (targetRows[0].published) throw new Error("لا يمكن جدولة عنصر منشور بالفعل.");

  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const date = new Date(scheduledAt);
  if (!scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now() + 60_000) {
    throw new Error("اختر موعداً مستقبلياً للنشر بعد دقيقة على الأقل.");
  }
  let scheduledRows: Array<{ id: string }> = [];
  try {
    scheduledRows = await supabaseServerAdminRequest<Array<{ id: string }>>("/rest/v1/content_publish_queue?select=id", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ content_table: table, content_id: id, scheduled_at: date.toISOString(), created_by: admin.id, status: "queued" }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/duplicate|unique|23505|409/i.test(message)) {
      throw new Error("لدى هذا المحتوى جدولة نشطة بالفعل.");
    }
    throw error;
  }
  if (!scheduledRows.length) throw new Error("لم يتم إنشاء مهمة الجدولة.");
  await recordAdminAuditEvent({
    action: "content.publish.schedule",
    permission: "content.publish",
    resourceType: table,
    resourceId: id,
    metadata: { scheduledAt: date.toISOString() },
  });
  revalidatePath("/admin/content");
}

export async function cancelContentPublishAction(formData: FormData) {
  const admin = await requireAdminPermission("content.publish");
  await enforceAdminRateLimit(admin, "content.publish", 30, 60);
  const queueId = String(formData.get("queueId") ?? "").trim();
  if (!queueId) throw new Error("معرّف الجدولة مطلوب.");
  const cancelledRows = await supabaseServerAdminRequest<Array<{ id: string }>>(`/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(queueId)}&status=eq.queued&select=id`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ status: "cancelled", updated_at: new Date().toISOString() }),
  });
  if (!cancelledRows.length) throw new Error("تعذر إلغاء الجدولة؛ ربما بدأت المعالجة أو ألغيت بالفعل.");
  await recordAdminAuditEvent({ action: "content.publish.schedule_cancel", permission: "content.publish", resourceType: "content_publish_queue", resourceId: queueId });
  revalidatePath("/admin/content");
}
