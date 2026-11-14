import "server-only";

import { redirect } from "next/navigation";
import { createClient, supabaseServerAdminRequest } from "@/lib/supabase/server";
import { requireAdminPermission, requireAdminPermissionApi } from "@/features/admin/services/admin";
import { sanitizeInternalPath } from "@/lib/safe-redirect";
import type { AdminPermission } from "@/features/admin/services/permissions";
import { resolveDestructiveMfaRequirement, shouldRequireAdminStepUp } from "@/features/admin/services/security-policy";

async function destructiveMfaRequired() {
  try {
    const rows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
      "/rest/v1/admin_settings?select=value&key=eq.require_mfa_for_destructive&limit=1",
      { method: "GET" },
    );
    return resolveDestructiveMfaRequirement(rows[0]?.value);
  } catch (error) {
    // Fail closed: if the policy cannot be read, destructive actions must still pass step-up MFA.
    console.error("[admin] could not read require_mfa_for_destructive; requiring step-up:", error);
    return true;
  }
}

export async function requireAdminStepUp(permission: AdminPermission, nextPath = "/admin", forceMfa = false) {
  const profile = await requireAdminPermission(permission);
  if (!shouldRequireAdminStepUp(await destructiveMfaRequired(), forceMfa)) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data.currentLevel !== "aal2") {
    const candidate = sanitizeInternalPath(nextPath);
  const safeNext = candidate === "/admin" || candidate.startsWith("/admin/") ? candidate : "/admin";
  redirect(`/admin/security/step-up?next=${encodeURIComponent(safeNext)}`);
  }
  return profile;
}


export async function requireAdminStepUpApi(
  permission: AdminPermission,
  nextPath = "/admin",
  forceMfa = false,
) {
  const auth = await requireAdminPermissionApi(permission);
  if (!auth.ok) return auth;
  if (!shouldRequireAdminStepUp(await destructiveMfaRequired(), forceMfa)) return auth;

  const candidate = sanitizeInternalPath(nextPath);
  const safeNext = candidate === "/admin" || candidate.startsWith("/admin/") ? candidate : "/admin";
  const stepUpPath = `/admin/security/step-up?next=${encodeURIComponent(safeNext)}`;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error("[admin-security] API step-up assurance check failed:", error.message);
      return { ok: false as const, status: 503 as const, error: "تعذر التحقق من مستوى المصادقة الإضافي. أعد المحاولة." };
    }
    if (data.currentLevel !== "aal2") {
      return {
        ok: false as const,
        status: 403 as const,
        error: "step_up_required",
        nextPath: stepUpPath,
      };
    }
    return auth;
  } catch (error) {
    console.error("[admin-security] API step-up verification unavailable:", error);
    return { ok: false as const, status: 503 as const, error: "تعذر التحقق من المصادقة الإضافية حاليًا." };
  }
}
