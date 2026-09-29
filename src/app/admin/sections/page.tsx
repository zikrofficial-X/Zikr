import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import AdminSectionsClient from "./sections-client";

export const dynamic = "force-dynamic";

export default async function AdminSectionsPage() {
  await requireAdminPermission("sections.manage");
  return (
    <Container className="py-8">
      <AdminSectionsClient />
    </Container>
  );
}
