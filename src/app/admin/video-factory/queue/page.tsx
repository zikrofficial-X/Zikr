import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import AdminVideosClient from "@/app/admin/videos/videos-client";

export const dynamic = "force-dynamic";

export default async function VideoFactoryQueuePage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="py-8">
      <AdminVideosClient />
    </Container>
  );
}
