"use server";

import { revalidatePath } from "next/cache";
import { requireAdminStepUp } from "@/lib/services/admin-security";
import { recordAdminAuditEvent } from "@/lib/services/admin-audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export async function deleteFailedVideoGenerationAction() {
  await requireAdminStepUp("video.delete", "/admin/control");
  await supabaseServerAdminRequest("/rest/v1/video_generation_requests?status=eq.failed", {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  await recordAdminAuditEvent({
    action: "video_generation.delete_failed",
    permission: "video.delete",
    resourceType: "video_generation_requests",
    metadata: { filter: "status=failed" },
  });
  revalidatePath("/admin/control");
  revalidatePath("/admin/videos");
}
