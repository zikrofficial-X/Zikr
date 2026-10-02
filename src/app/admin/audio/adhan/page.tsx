import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function AudioAdhanPage() {
  await requireAdminPermission("audio.manage");
  return (
    <AdminSectionHub
      eyebrow="AUDIO / ADHAN"
      title="Adhan"
      description="إدارة أصول الأذان واستخدامها في واجهات الصلاة والتنبيهات."
      links={[
        { href: "/admin/audio", label: "Audio Dashboard", description: "العودة إلى مركز الصوت." },
        { href: "/admin/site-audio", label: "Site Audio", description: "فتح مكتبة الصوت العامة." },
      ]}
    />
  );
}
