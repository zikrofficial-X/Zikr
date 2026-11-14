"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { runPostCommitAudit } from "@/features/admin/services/post-commit-audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";


type AdminAuditEvent = Parameters<typeof recordAdminAuditEvent>[0];
async function recordAdminAuditEventSafely(event: AdminAuditEvent): Promise<boolean> {
  return runPostCommitAudit(
    () => recordAdminAuditEvent(event),
    (error) => console.error("[admin/android] audit event failed after committed mutation:", error),
  );
}

export async function saveAndroidReleaseAction(formData: FormData) {
  await requireAdminPermission("android.manage");

  const mode = String(formData.get("mode") ?? "auto").trim();
  const releaseTag = String(formData.get("releaseTag") ?? "").trim();

  if (mode !== "auto" && mode !== "pinned") {
    throw new Error("وضع إصدار Android غير صالح.");
  }

  if (mode === "pinned" && !releaseTag) {
    throw new Error("اختر إصدار Android محددًا أو استخدم الوضع التلقائي.");
  }
  if (mode === "pinned" && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(releaseTag)) {
    throw new Error("صيغة وسم إصدار Android غير صالحة.");
  }

  await supabaseServerAdminRequest("/rest/v1/site_settings?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      key: "android_release",
      value: {
        mode,
        releaseTag: mode === "pinned" ? releaseTag : null,
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    }),
  });

  await recordAdminAuditEventSafely({
    action: "android.release_setting.update",
    permission: "android.manage",
    resourceType: "site_settings",
    resourceId: "android_release",
    metadata: { mode, releaseTag: mode === "pinned" ? releaseTag : null },
  });

  updateTag("site-setting:android_release");
  revalidatePath("/admin/android");
  revalidatePath("/platform");
  revalidatePath("/api/download/android");
}
