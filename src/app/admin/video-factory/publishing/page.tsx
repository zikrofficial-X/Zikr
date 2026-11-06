import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function VideoFactoryPublishingRedirectPage() {
  await requireAdminPermission("media.manage");
  redirect("/admin/memory");
}
