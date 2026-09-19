"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveAdminSettingAction(formData: FormData) {
  const profile = await requireAdminPermission("settings.manage");
  const key = formValue(formData, "key");
  const rawValue = formValue(formData, "value");
  if (!key) throw new Error("مفتاح الإعداد مطلوب.");

  let value: unknown = rawValue;
  try {
    value = JSON.parse(rawValue);
  } catch {
    value = rawValue;
  }

  await supabaseServerAdminRequest("/rest/v1/admin_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, value, updated_by: profile.id, updated_at: new Date().toISOString() }),
  });

  await recordAdminAuditEvent({
    action: "admin.settings.update",
    permission: "settings.manage",
    resourceType: "admin_settings",
    resourceId: key,
    metadata: { value },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/security");
}

export async function createAdminNotificationAction(formData: FormData) {
  const profile = await requireAdminPermission("notifications.manage");
  const title = formValue(formData, "title");
  const body = formValue(formData, "body");
  const link = formValue(formData, "link") || null;
  const type = formValue(formData, "type") || "admin";
  if (!title || !body) throw new Error("العنوان والنص مطلوبان.");

  await supabaseServerAdminRequest("/rest/v1/notifications", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: null,
      title,
      body,
      type,
      is_read: false,
      link,
    }),
  });

  await recordAdminAuditEvent({
    action: "admin.notification.create",
    permission: "notifications.manage",
    resourceType: "notifications",
    metadata: { actor: profile.id, type, link },
  });

  revalidatePath("/admin/notifications");
}

export async function markAdminNotificationsReadAction() {
  await requireAdminPermission("notifications.manage");
  await supabaseServerAdminRequest("/rest/v1/notifications?user_id=is.null&is_read=eq.false", {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_read: true }),
  });
  await recordAdminAuditEvent({
    action: "admin.notification.mark_all_read",
    permission: "notifications.manage",
    resourceType: "notifications",
  });
  revalidatePath("/admin/notifications");
}
