import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminKidsContentManager } from "@/features/admin/components/kids-content-manager";

export const dynamic = "force-dynamic";

export default async function AdminKidsContentPage() {
  await requireAdminPermission("kids.manage");
  return <AdminKidsContentManager />;
}
