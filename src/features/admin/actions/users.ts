"use server";

import { revalidatePath } from "next/cache";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
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
  if (!isValidRole(roleValue) || roleValue === "super_admin" && admin.role !== "super_admin") {
    throw new Error("الدور غير صالح أو غير مسموح لك تعيينه.");
  }
  if (userId === admin.id && roleValue !== "admin" && roleValue !== "super_admin") {
    throw new Error("لا يمكنك إزالة صلاحيات الإدارة عن نفسك.");
  }

  const target = await supabaseServerAdminRequest<Array<{ id: string; role: string | null }>>(
    `/rest/v1/profiles?select=id,role&id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: "GET" },
  );
  if (target.length === 0) throw new Error("المستخدم غير موجود.");

  const assignment = await supabaseServerAdminRequest<Array<{ role: string }>>(
    `/rest/v1/admin_role_assignments?select=role&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: "GET" },
  );
  const previousRole = assignment[0]?.role ?? target[0].role ?? "user";
  const now = new Date().toISOString();

  if (roleValue === "user" || roleValue === "admin") {
    await supabaseServerAdminRequest(
      `/rest/v1/admin_role_assignments?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      },
    );
  } else {
    await supabaseServerAdminRequest("/rest/v1/admin_role_assignments", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        role: roleValue,
        created_by: admin.id,
        updated_at: now,
      }),
    });
  }

  await supabaseServerAdminRequest(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        role: roleValue === "user" ? "user" : "admin",
        updated_at: now,
      }),
    },
  );

  await recordAdminAuditEvent({
    action: "users.role.update",
    permission: "users.roles",
    resourceType: "profiles",
    resourceId: userId,
    metadata: { previousRole, nextRole: roleValue, actor: admin.id },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/security");
}
