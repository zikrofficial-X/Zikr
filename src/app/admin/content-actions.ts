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
import { parseExplicitScheduledAt } from "@/features/admin/services/content-schedule";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";

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
  const admin = await requireAdminStepUp("content.publish", "/admin/content");
  await enforceAdminRateLimit(admin, "content.publish", 30, 60);
  const { table, id } = getTarget(formData);
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const date = parseExplicitScheduledAt(scheduledAt);
  if (!date || date.getTime() <= Date.now() + 60_000) {
    throw new Error("اختر موعداً مستقبلياً للنشر بعد دقيقة على الأقل.");
  }
  const select = table === "stories"
    ? "id,published,is_approved,user_id"
    : table === "articles"
      ? "id,published,metadata"
      : "id,published";
  const targets = await supabaseServerAdminRequest<Array<{
    id: string;
    published: boolean | null;
    is_approved?: boolean | null;
    user_id?: string | null;
    metadata?: unknown;
  }>>(
    `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`,
    { method: "GET" },
  );
  const target = targets?.[0];
  if (!target) throw new Error("المحتوى المطلوب جدولته غير موجود.");
  if (target.published !== false) throw new Error("لا يمكن جدولة عنصر منشور بالفعل.");
  if (table === "stories" && (target.is_approved !== true || target.user_id !== null)) {
    throw new Error("لا يمكن جدولة قصة غير معتمدة أو مرتبطة بحساب مستخدم؛ اعتمد قصة عامة أولاً.");
  }
  if (table === "articles") {
    const metadata = target.metadata && typeof target.metadata === "object" && !Array.isArray(target.metadata)
      ? target.metadata as Record<string, unknown>
      : {};
    if (metadata.automationPublicationHold === true) {
      throw new Error("لا يمكن جدولة المقال أثناء وجود إيقاف نشر صريح؛ أعد مراجعته وانشره يدويًا أولاً.");
    }
  }
  const activeSchedules = await supabaseServerAdminRequest<Array<{ id: string; status: string }>>(
    `/rest/v1/content_publish_queue?content_table=eq.${encodeURIComponent(table)}&content_id=eq.${encodeURIComponent(id)}&status=in.(queued,processing)&select=id,status&limit=1`,
    { method: "GET" },
  );
  if (activeSchedules?.length) {
    throw new Error("يوجد موعد نشر قائم أو قيد التنفيذ لهذا المحتوى. ألغِ الموعد الحالي أولاً.");
  }

  await supabaseServerAdminRequest("/rest/v1/content_publish_queue", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ content_table: table, content_id: id, scheduled_at: date.toISOString(), created_by: admin.id, status: "queued" }),
  });
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
  const admin = await requireAdminStepUp("content.publish", "/admin/content");
  await enforceAdminRateLimit(admin, "content.publish", 30, 60);
  const queueId = String(formData.get("queueId") ?? "").trim();
  if (!queueId) throw new Error("معرّف الجدولة مطلوب.");

  const currentRows = await supabaseServerAdminRequest<Array<{ id: string; status: "queued" | "processing"; updated_at: string }>>(
    `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(queueId)}&status=in.(queued,processing)&select=id,status,updated_at&limit=1`,
    { method: "GET" },
  );
  const current = currentRows?.[0];
  if (!current?.updated_at) {
    throw new Error("لم يعد موعد النشر نشطًا؛ حدّث الصفحة قبل المتابعة.");
  }

  // Advancing the exact queue version fences an in-flight worker. The worker
  // rechecks this claim before publishing and rolls back only its own write.
  const cancelled = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(queueId)}&status=in.(queued,processing)&updated_at=eq.${encodeURIComponent(current.updated_at)}&select=id`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        status: "cancelled",
        error_message: "Cancelled by an administrator before scheduled publication.",
        updated_at: buildNextRowVersionUpdatedAt(current.updated_at),
      }),
    },
  );
  if (!cancelled?.some((row) => row.id === queueId)) {
    throw new Error("تغيرت حالة موعد النشر أثناء الإلغاء؛ حدّث الصفحة ثم أعد المحاولة.");
  }

  await recordAdminAuditEvent({
    action: "content.publish.schedule_cancel",
    permission: "content.publish",
    resourceType: "content_publish_queue",
    resourceId: queueId,
    metadata: { previousStatus: current.status },
  });
  revalidatePath("/admin/content");
}
