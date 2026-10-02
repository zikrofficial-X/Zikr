import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function KidsGamesPage() {
  await requireAdminPermission("kids.manage");
  return (
    <AdminSectionHub
      eyebrow="KIDS / GAMES"
      title="Games"
      description="إدارة منظومة ألعاب الأطفال التعليمية ضمن المسار الرسمي لقسم Kids."
      links={[
        { href: "/admin/kids", label: "Kids Content", description: "مركز محتوى الأطفال الحالي." },
        { href: "/admin/kids/levels", label: "Levels", description: "إدارة مستويات الألعاب والتقدم." },
      ]}
    />
  );
}
