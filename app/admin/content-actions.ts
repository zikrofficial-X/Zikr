"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/services/admin";
import { recordAdminAuditEvent } from "@/lib/services/admin-audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

type ManagedTable = "stories" | "articles" | "competitions" | "memorization_plans" | "pinned_messages";

const TABLES = new Set<ManagedTable>([
  "stories",
  "articles",
  "competitions",
  "memorization_plans",
  "pinned_messages",
]);

function getTarget(formData: FormData) {
  const table = String(formData.get("table") ?? "") as ManagedTable;
  const id = String(formData.get("id") ?? "").trim();
  if (!TABLES.has(table) || !id) throw new Error("عنصر محتوى غير صالح.");
  return { table, id };
}

export async function safeTogglePublishAction(formData: FormData) {
  await requireAdminPermission("content.publish");
  const { table, id } = getTarget(formData);
  const next = String(formData.get("next") ?? "false") === "true";
  const column = table === "pinned_messages" ? "is_active" : "published";

  await supabaseServerAdminRequest(` /rest/v1/${table}?id=eq.${encodeURIComponent(id)}`.trim(), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ [column]: next, updated_at: new Date().toISOString() }),
  });

  await recordAdminAuditEvent({
    action: next ? "content.publish" : "content.unpublish",
    permission: "content.publish",
    resourceType: table,
    resourceId: id,
    metadata: { next },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin");
}

export async function safeDeleteContentAction(formData: FormData) {
  await requireAdminPermission("content.delete");
  const { table, id } = getTarget(formData);
  const column = table === "pinned_messages" ? "is_active" : "published";
  const current = await supabaseServerAdminRequest<Array<Record<string, unknown>>>(
    `/rest/v1/${table}?select=id,${column}&id=eq.${encodeURIComponent(id)}&limit=1`,
    { method: "GET" },
  );
  if (current[0] && Boolean(current[0][column])) {
    throw new Error("لا يمكن حذف عنصر منشور. قم بإخفائه أولاً ثم أعد المحاولة.");
  }

  await supabaseServerAdminRequest(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  await recordAdminAuditEvent({
    action: "content.delete",
    permission: "content.delete",
    resourceType: table,
    resourceId: id,
    metadata: { protectedPublishedDelete: true },
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin");
}
