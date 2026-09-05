import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/admin";
import type { AdminPermission } from "@/lib/services/admin-permissions";

export type AdminAuditOutcome = "success" | "denied" | "failed";

export type AdminAuditEvent = {
  action: string;
  permission?: AdminPermission;
  resourceType?: string;
  resourceId?: string | null;
  outcome?: AdminAuditOutcome;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Append one administrative event to the immutable audit stream.
 * Callers should invoke this only after the relevant authorization guard.
 * Audit failures are deliberately surfaced so security telemetry is not silently lost.
 */
export async function recordAdminAuditEvent(event: AdminAuditEvent): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Administrative audit requires an authenticated user.");

  await supabaseServerAdminRequest("/rest/v1/admin_audit_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      actor_user_id: profile.id,
      action: event.action,
      permission: event.permission ?? null,
      resource_type: event.resourceType ?? null,
      resource_id: event.resourceId ?? null,
      outcome: event.outcome ?? "success",
      request_id: event.requestId ?? null,
      metadata: event.metadata ?? {},
    }),
  });
}
