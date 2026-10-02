import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPermission("content.manage");
  return (
    <AdminSectionHub
      eyebrow="CONTENT / CATEGORIES"
      title="Categories"
      description="إدارة التصنيفات كطبقة مستقلة داخل بنية المحتوى. روابط التشغيل الحالية تبقى عبر مكتبة المحتوى والمحتوى التحريري."
      links={[
        { href: "/admin/library", label: "Library", description: "إدارة العناصر ومجموعات المحتوى الحالية." },
        { href: "/admin/content", label: "Editorial", description: "إدارة المحتوى الذي يعتمد على التصنيفات الحالية." },
      ]}
    />
  );
}
