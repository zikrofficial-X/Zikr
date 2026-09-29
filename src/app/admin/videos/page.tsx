import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import AdminVideosClient from "./videos-client";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  await requireAdminPermission("video.manage");

  return (
    <Container className="py-8">
      <AdminVideosClient />
    </Container>
  );
}
