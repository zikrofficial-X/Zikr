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

export async function saveVideoAutomationSettingAction(formData: FormData) {
  const profile = await requireAdminPermission("system.manage");
  const key = formValue(formData, "key");
  if (!key.startsWith("video_automation_")) throw new Error("إعداد أتمتة الفيديو غير صالح.");

  const rawValue = formValue(formData, "value");
  let value: unknown = rawValue;

  if (
    key === "video_automation_enabled" ||
    key === "video_automation_ai_enabled" ||
    key === "video_automation_auto_publish" ||
    key === "video_automation_facebook_enabled"
  ) {
    value = rawValue === "true";
  } else if (key === "video_automation_batch_size") {
    const numeric = Number(rawValue);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 10) {
      throw new Error("حجم الدفعة يجب أن يكون بين 1 و10.");
    }
    value = numeric;
  } else {
    throw new Error("إعداد أتمتة فيديو غير مدعوم.");
  }

  await supabaseServerAdminRequest("/rest/v1/admin_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      key,
      value,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }),
  });

  await recordAdminAuditEvent({
    action: "admin.video_automation.setting_update",
    permission: "system.manage",
    resourceType: "admin_settings",
    resourceId: key,
    metadata: { value },
  });

  revalidatePath("/admin/automation");
}

export async function requestVideoAutomationRunAction() {
  const profile = await requireAdminPermission("system.manage");
  const key = "video_automation_run_now";
  const value = new Date().toISOString();
  const request = {
    requestedAt: value,
    requestedBy: profile.id,
    dispatchedAt: null as string | null,
  };

  await supabaseServerAdminRequest("/rest/v1/admin_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      key,
      value: request,
      updated_by: profile.id,
      updated_at: value,
    }),
  });

  // Direct dispatch is the only automatic Run Now path. The scheduled GitHub poller was
  // intentionally retired to keep Actions usage inside the GitHub Free allowance.
  const token = process.env.GITHUB_PAT || process.env.GITHUB_DISPATCH_TOKEN || process.env.GH_DISPATCH_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || "zikrcontact-del/Zikr";
  if (!token) {
    throw new Error("GitHub dispatch token is not configured; Run Now cannot be queued without a scheduled poller.");
  }

  let dispatched = false;
  {
    const batchRows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
      "/rest/v1/admin_settings?key=eq.video_automation_batch_size&select=value&limit=1",
    ).catch(() => []);
    const rawBatch = Number(batchRows?.[0]?.value ?? 1);
    const batchSize = Number.isInteger(rawBatch) ? Math.min(10, Math.max(1, rawBatch)) : 1;
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository}/actions/workflows/generate-ai-video.yml/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ref: "main", inputs: { batch_size: String(batchSize), urgent: "true" } }),
          signal: AbortSignal.timeout(15_000),
        },
      );
      dispatched = response.status === 204;
    } catch {
      dispatched = false;
    }
    if (!dispatched) {
      throw new Error("GitHub refused the video workflow dispatch; the Run Now request was not marked as dispatched.");
    }

    await supabaseServerAdminRequest("/rest/v1/admin_settings?key=eq.video_automation_run_now", {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ value: { ...request, dispatchedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }),
    });
  }

  await recordAdminAuditEvent({
    action: "admin.video_automation.run_requested",
    permission: "system.manage",
    resourceType: "admin_settings",
    resourceId: key,
    metadata: { requestedAt: value, priority: "urgent", dispatchedDirectly: dispatched },
  });

  revalidatePath("/admin/automation");
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
      read: false,
      metadata: link ? { link } : {},
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
  await supabaseServerAdminRequest("/rest/v1/notifications?user_id=is.null&read=eq.false", {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ read: true }),
  });
  await recordAdminAuditEvent({
    action: "admin.notification.mark_all_read",
    permission: "notifications.manage",
    resourceType: "notifications",
  });
  revalidatePath("/admin/notifications");
}
