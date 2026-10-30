import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export default async function AdminVideoRequestsPage() {
  await requireAdminPermission("video.manage");
  redirect("/admin/video-factory/queue");
}
