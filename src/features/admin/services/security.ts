import "server-only";

import { redirect } from "next/navigation";
import { createClient, supabaseServerAdminRequest } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/features/admin/services/admin";
import type { AdminPermission } from "@/features/admin/services/permissions";

async function destructiveMfaRequired() {
  const rows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
    "/rest/v1/admin_settings?select=value&key=eq.require_mfa_for_destructive&limit=1",
    { method: "GET" },
  ).catch(() => []);
  return rows[0]?.value === true;
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
