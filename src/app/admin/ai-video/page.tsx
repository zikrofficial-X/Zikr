import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import AdminAiVideoClient from "./ai-video-client";

export const dynamic = "force-dynamic";

export default async function AdminAiVideoPage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="py-8">
      <AdminAiVideoClient />
    </Container>
  );
}
