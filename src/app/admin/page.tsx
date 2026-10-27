import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminPlatformCommandCenter } from "@/features/admin/components/admin-platform-command-center";
import { AdminLiveQueueDashboard } from "@/features/admin/components/admin-live-queue-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminPermission("dashboard.view");

  return (
    <Container className="py-8">
      <AdminPlatformCommandCenter />
      <div className="mt-8">
        <AdminLiveQueueDashboard />
      </div>
    </Container>
  );
}
