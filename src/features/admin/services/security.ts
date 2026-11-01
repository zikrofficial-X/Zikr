import "server-only";

import { redirect } from "next/navigation";
import { createClient, supabaseServerAdminRequest } from "@/lib/supabase/server";
import { requireAdminPermission, requireAdminPermissionApi } from "@/features/admin/services/admin";
import type { AdminPermission } from "@/features/admin/services/permissions";

async function destructiveMfaRequired() {
  try {
    const rows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
      "/rest/v1/admin_settings?select=value&key=eq.require_mfa_for_destructive&limit=1",
      { method: "GET" },
    );
    return rows[0]?.value === true;
  } catch (error) {
    // Fail closed: if the policy cannot be read, destructive actions must still pass step-up MFA.
    console.error("[admin] could not read require_mfa_for_destructive; requiring step-up:", error);
    return true;
  }
}

export async function requireAdminStepUp(permission: AdminPermission, nextPath = "/admin") {
  const profile = await requireAdminPermission(permission);
  if (!(await destructiveMfaRequired())) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data.currentLevel !== "aal2") {
    redirect(`/admin/security/step-up?next=${encodeURIComponent(nextPath)}`);
  }
  return profile;
}


/** API variant of the step-up guard: never redirect an API caller to an HTML page. */
export async function requireAdminStepUpApi(permission: AdminPermission) {
  const auth = await requireAdminPermissionApi(permission);
  if (!auth.ok) return auth;
  if (!(await destructiveMfaRequired())) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data.currentLevel !== "aal2") {
    return { ok: false as const, status: 403 as const, error: "Step-up authentication required." };
  }
  return auth;
}
