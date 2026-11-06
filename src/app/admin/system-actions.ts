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
      throw new Error("حد نتض��q�^