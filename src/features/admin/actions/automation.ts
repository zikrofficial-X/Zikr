"use server";

import { revalidatePath } from "next/cache";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

const JSON_HEADERS = { "Content-Type": "application/json", Prefer: "return=minimal" } as const;

/** Pause/resume the autonomous video worker. The worker reads admin_settings.video_automation on every run. */
export async function setVideoAutomationPausedAction(formData: FormData) {
  await requireAdminStepUp("system.manage", "/admin/automation");
  const paused = formData.get("paused") === "true";
  await supabaseServerAdminRequest("/rest/v1/admin_settings?on_conflict=key", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      key: "video_automation",
      value: { paused },
      description: "Autonomous video worker control (paused=true stops seeding and rendering).",
      updated_at: new Date().toISOString(),
    }),
  });
  await recordAdminAuditEvent({
    action: paused ? "video_automation.pause" : "video_automation.resume",
    permission: "system.manage",
    resourceType: "admin_settings",
    resourceId: "video_automation",
    metadata: { paused },
  });
  revalidatePath("/admin/automation");
}

/** Put failed video requests back in the queue so the next worker run retries them. */
export async function retryFailedVideoGenerationAction() {
  await requireAdminStepUp("video.manage", "/admin/automation");
  await supabaseServerAdminRequest("/rest/v1/video_generation_requests?status=eq.failed", {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ status: "pending", error_message: null, error_details: null, updated_at: new Date().toISOString() }),
  });
  await recordAdminAuditEvent({
    action: "video_generation.retry_failed",
    permission: "video.manage",
    resourceType: "video_generation_requests",
    metadata: { filter: "status=failed" },
  });
  revalidatePath("/admin/automation");
  revalidatePath("/admin/videos");
}
