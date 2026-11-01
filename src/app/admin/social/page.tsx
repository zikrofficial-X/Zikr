import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { hasAdminPermission } from "@/features/admin/services/permissions";
import AdminSocialClient from "./social-client";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  const admin = await requireAdminPermission("social.manage");
  const canDelete = hasAdminPermission(admin.role, "social.delete");
  return (
    <Container className="py-8">
      <AdminSocialClient canDelete={canDelete} />
    </Container>
  );
}
