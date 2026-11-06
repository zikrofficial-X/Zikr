import AdminMediaClient from "../media/media-client";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminMemoryPage() {
  await requireAdminPermission("media.manage");
  return <AdminMediaClient />;
}
