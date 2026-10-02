import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function KidsAssetsPage() {
  await requireAdminPermission("kids.manage");
  return (
    <AdminSectionHub
      eyebrow="KIDS / ASSETS"
      title="Assets"
      description="مركز تنظيمي لأصول ألعاب الأطفال والوسائط المرتبطة بها، مع بقاء إدارة الوسائط العامة في مسار Media الداخلي."
      links={[
        { href: "/admin/media", label: "Media", description: "إدارة أصول الوسائط العامة وحقوقها." },
        { href: "/admin/kids", label: "Content", description: "إدارة المحتوى الذي يستخدم هذه الأصول." },
      ]}
    />
  );
}
