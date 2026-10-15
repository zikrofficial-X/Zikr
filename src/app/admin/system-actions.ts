"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveAdminSettingAction(formData: FormData) {
  const profile = await requireAdminPermission("settings.manage");
  const key = formValue(formData, "key");
  const rawValues = formData.getAll("value").map((value) => String(value).trim());
  const rawValue = rawValues.at(-1) ?? "";
  if (!key) throw new Error("مفتاح الإعداد مطلوب.");

  const allowedSettings = new Set([
    "require_mfa_for_destructive",
    "maintenance_mode",
    "admin_alerts_enabled",
    "search_result_limit",
  ]);
  if (!allowedSettings.has(key)) throw new Error("إعداد إدارة غير مدعوم.");

  let value: unknown;
  if (["require_mfa_for_destructive", "maintenance_mode", "admin_alerts_enabled"].includes(key)) {
    if (rawValue !== "true" && rawValue !== "false") throw new Error("قيمة منطقية غير صالحة.");
    value = rawValue === "true";
  } else {
    const numeric = Number(rawValue);
    if (!Number.isInteger(numeric) || numeric < 10 || numeric > 100) {
      throw new Error("حد نتائج البحث يجب أن يكون بين 10 و100.");
    }
    value = numeric;
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

  const rawValues = formData.getAll("value").map((value) => String(value).trim());
  const rawValue = rawValues.at(-1) ?? "";
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
  } else if (key === "video_automation_daily_target") {
    const numeric = Number(rawValue);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 24) {
      throw new Error("الهدف اليومي يجب أن يكون بين 1 و24.");
    }
    value = numeric;
  } else if (key === "video_automation_ai_attempts_per_run") {
    const numeric = Number(rawValue);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 4) {
      throw new Error("محاولات مزودات الفيديو الذكية يجب أن تكون بين 0 و4.");
    }
    value = numeric;
  } else if (key === "video_automation_video_seconds") {
    const numeric = Number(rawValue);
    if (!Number.isInteger(numeric) || numeric < 10 || numeric > 45) {
      throw new Error("مدة الفيديو يجب أن تكون بين 10 و45 ثانية.");
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
  const batchRows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
    "/rest/v1/admin_settings?key=eq.video_automation_batch_size&select=value&limit=1",
  ).catch(() => []);
  const rawBatch = Number(batchRows?.[0]?.value ?? 3);
  const batchSize = Number.isInteger(rawBatch) ? Math.min(10, Math.max(1, rawBatch)) : 3;
  const key = "video_automation_run_now";
  const requestedAt = new Date().toISOString();
  const request = { requestedAt, requestedBy: profile.id, dispatchedAt: null as string | null, failedAt: null as string | null, error: null as string | null };

  try {
    await supabaseServerAdminRequest("/rest/v1/admin_settings?on_conflict=key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key, value: request, updated_by: profile.id, updated_at: requestedAt }),
    });

    await dispatchGitHubWorkflow("generate-ai-video.yml", {
      batch_size: String(batchSize),
      urgent: "true",
    });

    const dispatchedAt = new Date().toISOString();
    await supabaseServerAdminRequest("/rest/v1/admin_settings?key=eq." + encodeURIComponent(key), {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ value: { ...request, dispatchedAt }, updated_at: dispatchedAt }),
    });

    await recordAdminAuditEvent({
      action: "admin.video_automation.run_requested",
      permission: "system.manage",
      resourceType: "admin_settings",
      resourceId: key,
      metadata: { requestedAt, batchSize, priority: "urgent", dispatchedDirectly: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "GitHub workflow dispatch token is not configured.") {
      // Keep the request in the same database queue consumed by the scheduled
      // worker instead of falsely marking it failed when Vercel has no dispatch PAT.
      const queuedAt = new Date().toISOString();
      const queuedRequest = {
        ...request,
        dispatchPending: true,
        queuedForScheduledWorker: true,
        fallbackMessage: "تم حفظ الطلب. سيعالجه عامل الفيديو عند دورة GitHub Actions المجدولة التالية؛ التشغيل الفوري يحتاج ضبط GITHUB_DISPATCH_TOKEN في Vercel.",
      };
      await supabaseServerAdminRequest("/rest/v1/admin_settings?key=eq." + encodeURIComponent(key), {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ value: queuedRequest, updated_at: queuedAt }),
      });
      await recordAdminAuditEvent({
        action: "admin.video_automation.run_requested_queued",
        permission: "system.manage",
        resourceType: "admin_settings",
        resourceId: key,
        metadata: { requestedAt, batchSize, directDispatch: false, fallback: "scheduled-worker" },
      });
      revalidatePath("/admin/automation");
      return;
    }

    const failedAt = new Date().toISOString();
    await supabaseServerAdminRequest("/rest/v1/admin_settings?key=eq." + encodeURIComponent(key), {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ value: { ...request, failedAt, error: message.slice(0, 500) }, updated_at: failedAt }),
    }).catch(() => {});
    await recordAdminAuditEvent({
      action: "admin.video_automation.run_requested_failed",
      permission: "system.manage",
      resourceType: "admin_settings",
      resourceId: key,
      outcome: "failed",
      metadata: { requestedAt, batchSize, error: message.slice(0, 500) },
    }).catch(() => {});
    throw error;
  }

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
