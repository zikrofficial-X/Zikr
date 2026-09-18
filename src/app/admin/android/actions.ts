"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export async function saveAndroidReleaseAction(formData: FormData) {
  await requireAdmin();

  const mode = String(formData.get("mode") ?? "auto").trim();
  const releaseTag = String(formData.get("releaseTag") ?? "").trim();

  if (mode !== "auto" && mode !== "pinned") {
    throw new Error("وضع إصدار Android غير صالح.");
  }

  if (mode === "pinned" && !releaseTag) {
    throw new Error("اختر إصدار Android محددًا أو استخدم الوضع التلقائي.");
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

  revalidatePath("/admin/android");
  revalidatePath("/platform");
  revalidatePath("/api/download/android");
}
