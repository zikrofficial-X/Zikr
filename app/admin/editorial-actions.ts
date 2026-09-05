"use server";

import { revalidatePath } from "next/cache";
import { requireAdminStepUp } from "@/lib/services/admin-security";
import { enforceAdminRateLimit } from "@/lib/services/admin-rate-limit";
import { recordAdminAuditEvent } from "@/lib/services/admin-audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

const REVIEW_STATES = new Set(["draft", "editorial_review", "scholarly_review", "approved", "rejected"]);

function target(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const updatedAt = String(formData.get("updatedAt") ?? "").trim();
  if (!id) throw new Error("معرّف المحتوى مطلوب.");
  return { id, updatedAt };
}

export async function changeEditorialReviewStatusAction(formData: FormData) {
  const admin = await requireAdminStepUp("knowledge.manage", "/admin/editorial");
  await enforceAdminRateLimit(admin, "editorial.review", 30, 60);
  const { id, updatedAt } = target(formData);
  const status = String(formData.get("status") ?? "").trim();
  if (!REVIEW_STATES.has(status)) throw new Error("حالة مراجعة غير صالحة.");

  const current = await supabaseServerAdminRequest<Array<{ id: string; updated_at: string; review_status: string }>>(
    `/rest/v1/content_library?select=id,updated_at,review_status&id=eq.${encodeURIComponent(id)}&limit=1`,
    { method: "GET" },
  );
  if (!current[0]) throw new Error("المحتوى غير موجود.");
  if (updatedAt && current[0].updated_at !== updatedAt) throw new Error("تم تعديل المحتوى. حدّث الصفحة ثم أعد المحاولة.");

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { review_status: status, updated_at: now };
  if (status === "approved") patch.published = false;
  if (status === "rejected" || status === "draft" || status === "editorial_review" || status === "scholarly_review") patch.published = false;

  await supabaseServerAdminRequest(`/rest/v1/content_library?id=eq.${encodeURIComponent(id)}${updatedAt ? `&updated_at=eq.${encodeURIComponent(updatedAt)}` : ""}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });

  await recordAdminAuditEvent({
    action: "editorial.review_status.update",
    permission: "knowledge.manage",
    resourceType: "content_library",
    resourceId: id,
    metadata: { previousStatus: current[0].review_status, nextStatus: status },
  });

  revalidatePath("/admin/editorial");
  revalidatePath("/admin/library");
}

export async function publishApprovedContentAction(formData: FormData) {
  const admin = await requireAdminStepUp("content.publish", "/admin/editorial");
  await enforceAdminRateLimit(admin, "editorial.publish", 10, 60);
  const { id, updatedAt } = target(formData);
  const current = await supabaseServerAdminRequest<Array<{ id: string; updated_at: string; review_status: string; published: boolean }>>(
    `/rest/v1/content_library?select=id,updated_at,review_status,published&id=eq.${encodeURIComponent(id)}&limit=1`,
    { method: "GET" },
  );
  if (!current[0]) throw new Error("المحتوى غير موجود.");
  if (current[0].review_status !== "approved") throw new Error("لا يمكن نشر محتوى قبل اعتماده.");
  if (updatedAt && current[0].updated_at !== updatedAt) throw new Error("تم تعديل المحتوى. حدّث الصفحة ثم أعد المحاولة.");

  const now = new Date().toISOString();
  await supabaseServerAdminRequest(`/rest/v1/content_library?id=eq.${encodeURIComponent(id)}${updatedAt ? `&updated_at=eq.${encodeURIComponent(updatedAt)}` : ""}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ published: true, published_at: now, updated_at: now }),
  });

  await recordAdminAuditEvent({
    action: "editorial.publish",
    permission: "content.publish",
    resourceType: "content_library",
    resourceId: id,
  });
  revalidatePath("/admin/editorial");
  revalidatePath("/admin/library");
}
