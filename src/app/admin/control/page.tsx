import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminControlRedirectPage() {
  await requireAdminPermission("dashboard.view");
  redirect("/admin");
}
