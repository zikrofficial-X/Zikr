import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import AdminSocialClient from "./social-client";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  await requireAdminPermission("social.manage");
  return (
    <Container className="py-8">
      <AdminSocialClient />
    </Container>
  );
}
