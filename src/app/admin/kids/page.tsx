import { requireAdminPermission } from "@/features/admin/services/admin";
import { hasAdminPermission } from "@/features/admin/services/permissions";
import { AdminKidsContentManager } from "@/features/admin/components/kids-content-manager";

export const dynamic = "force-dynamic";

export default async function AdminKidsPage() {
  const admin = await requireAdminPermission("kids.manage");
  const canPublish = hasAdminPermission(admin.role, "content.publish");
  const canManageMedia = hasAdminPermission(admin.role, "media.manage");
  return <AdminKidsContentManager canPublish={canPublish} canManageMedia={canManageMedia} />;
}
