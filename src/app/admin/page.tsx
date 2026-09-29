import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminPlatformCommandCenter } from "@/features/admin/components/admin-platform-command-center";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminPermission("dashboard.view");

  return (
    <Container className="py-8">
      <AdminPlatformCommandCenter />
    </Container>
  );
}
