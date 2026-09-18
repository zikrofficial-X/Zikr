"use server";

import { revalidatePath } from "next/cache";
import { requireAdminStepUp } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export async function updateUserRoleAuditedAction(formData: FormData) {
  const admin = await requireAdminStepUp("users.roles", "/admin/users");
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!userId) throw new Error("معرّف المستخدم مطلوب.");
  if (role !== "admin" && role !== "user") throw new Error("الدور غير صالح.");
  if (userId === admin.id && role !== "admin") throw new Error("لا يمكنك إزالة صلاحية الأدمن عن نفسك.");

  const target = await supabaseServerAdminRequest<Array<{ id: string; role: string | null }>>(
    `/rest/v1/profiles?select=id,role&id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: "GET" },
  );
  if (target.length === 0) throw new Error("المستخدم غير موجود.");
  const previousRole = target[0].role ?? "user";

  await supabaseServerAdminRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ role, updated_at: new Date().toISOString() }),
  });

  await recordAdminAuditEvent({
    action: "users.role.update",
    permission: "users.roles",
    resourceType: "profiles",
    resourceId: userId,
    metadata: { previousRole, nextRole: role, actor: admin.id },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/security");
}
