import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export default async function AdminVideoStudioPage() {
  await requireAdminPermission("video.manage");
  redirect("/admin/ai-video");
}
