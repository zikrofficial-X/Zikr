import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function KidsLevelsPage() {
  await requireAdminPermission("kids.manage");
  return (
    <AdminSectionHub
      eyebrow="KIDS / LEVELS"
      title="Levels"
      description="طبقة المستويات والتدرج والصعوبة لألعاب الأطفال."
      links={[
        { href: "/admin/kids/games", label: "Games", description: "ربط مستويات المحتوى بالألعاب." },
        { href: "/admin/kids", label: "Content", description: "المحتوى التعليمي الذي تغذيه المستويات." },
      ]}
    />
  );
}
