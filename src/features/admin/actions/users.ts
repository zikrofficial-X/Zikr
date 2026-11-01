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
  if (!isValidRole(roleValue)) throw new Error("الدور غير صالح.");
  if (userId === admin.id && roleValue !== admin.role) {
    throw new Error("لا يمكنك تغيير دور حسابك الحالي من داخل الجلسة نفسها.");
  }
  if (admin.role !== "super_admin" && (roleValue === "admin" || roleValue === "super_admin")) {
    throw new Error("تعيين مدير كامل يتطلب صلاحية المشرف الأعلى.");
  }

  // One SECURITY DEFINER RPC performs the profile mirror, role-assignment write,
  // and immutable audit insert in a single database transaction.
  await supabaseServerAdminRequest("/rest/v1/rpc/admin_update_user_role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      p_actor_user_id: admin.id,
      p_target_user_id: userId,
      p_next_role: roleValue,
      p_request_id: crypto.randomUUID(),
    }),
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/security");
}
