"use server";

import { revalidatePath } from "next/cache";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { ADMIN_ROLE_PERMISSIONS, type AdminRole } from "@/features/admin/services/permissions";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

const ASSIGNABLE_ROLES = Object.keys(ADMIN_ROLE_PERMISSIONS) as AdminRole[];

function isValidRole(value: string): value is AdminRole {
  return ASSIGNABLE_ROLES.includes(value as AdminRole);
}

export async function updateUserRoleAuditedAction(formData: FormData) {
  const admin = await requireAdminStepUp("users.roles", "/admin/users");
  const userId = String(formData.get("userId") ?? "").trim();
  const roleValue = String(formData.get("role") ?? "").trim();

  if (!userId) throw new Error("معرّف المستخدم مطلوب.");
  if (
    !isValidRole(roleValue) ||
    (roleValue === "super_admin" && admin.role !== "super_admin")
  ) {
    throw new Error("الدور غير صالح أو غير مسموح لك تعيينه.");
  }
  if (
    userId === admin.id &&
    roleValue !== "admin" &&
    roleValue !== "super_admin"
  ) {
    throw new Error("لا يمكنك إزالة صلاحيات الإدارة عن نفسك.");
  }

  // The database function applies profile.role, admin_role_assignments and the
  // immutable audit event in one transaction. No client-supplied actor is trusted:
  // admin.id comes from the authenticated server-side profile guard above.
  await supabaseServerAdminRequest(
    "/rest/v1/rpc/admin_update_user_role",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_role: roleValue,
        p_actor_user_id: admin.id,
      }),
    },
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin/security");
}
