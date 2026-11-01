import { Container } from "@/components/ui/container";
import AdminVideoRequestsClient from "@/features/admin/video-requests/components/admin-video-requests-client";
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminVideoRequestsPage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="py-8">
      <AdminBreadcrumbs current="طلبات الفيديو" />
      <AdminVideoRequestsClient />
    </Container>
  );
}
