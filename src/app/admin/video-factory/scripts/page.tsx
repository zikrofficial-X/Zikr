import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function LegacyVideoFactoryScriptsRedirectPage() {
  await requireAdminPermission("video.manage");
  redirect("/admin/video/scripts");
}
