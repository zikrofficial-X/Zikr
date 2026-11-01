import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function VideoFactorySchedulerRedirectPage() {
  await requireAdminPermission("system.manage");
  redirect("/admin/automation");
}
