import { Container } from "@/components/ui/container";
import AdminVideosClient from "@/app/admin/videos/videos-client";
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminVideoRequestsPage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="py-8">
      <AdminBreadcrumbs current="طلبات الفيديو" />
      <AdminVideosClient />
    </Container>
  );
}
