import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function KidsAnalyticsPage() {
  await requireAdminPermission("kids.manage");
  return (
    <AdminSectionHub
      eyebrow="KIDS / ANALYTICS"
      title="Analytics"
      description="طبقة تحليلات قسم الأطفال والألعاب. التحليلات العامة تبقى في المركز التشغيلي العام."
      links={[
        { href: "/admin/analytics", label: "Platform Analytics", description: "عرض التحليلات العامة للمنصة." },
        { href: "/admin/kids/games", label: "Games", description: "الانتقال إلى منظومة الألعاب." },
      ]}
    />
  );
}
