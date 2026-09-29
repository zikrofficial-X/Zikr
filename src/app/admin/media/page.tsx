import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import AdminMediaClient from "./media-client";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireAdminPermission("media.manage");
  return (
    <Container className="py-8">
      <AdminMediaClient />
    </Container>
  );
}
