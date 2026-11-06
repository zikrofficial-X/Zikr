import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function RetiredYoutubeImportPage() {
  await requireAdminPermission("analytics.read");
  redirect("/admin/analytics");
}
