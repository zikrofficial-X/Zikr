import "server-only";

import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/admin/services/admin";
import type { AdminPermission } from "@/features/admin/services/permissions";

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

const SENSITIVE_METADATA_KEY = /token|secret|password|cookie|authorization|api[_-]?key|private[_-]?key|credential/i;

function scrubMetadataValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth-limited]";
  if (typeof value === "string") {
    return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => scrubMetadataValue(item, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      if (SENSITIVE_METADATA_KEY.test(key)) continue;
      output[key] = scrubMetadataValue(nested, depth + 1);
    }
    return output;
  }
  return String(value);
}

function safeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  return (scrubMetadataValue(metadata ?? {}) as Record<string, unknown>) ?? {};
}

/** Append one administrative event to the immutable audit stream. */
export async function recordAdminAuditEvent(event: AdminAuditEvent): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Administrative audit requires an authenticated user.");

  const requestId = event.requestId ?? crypto.randomUUID();
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
      request_id: requestId,
      metadata: safeMetadata(event.metadata),
    }),
  });
}
