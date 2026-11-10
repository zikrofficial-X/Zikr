import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function AudioDashboardPage() {
  await requireAdminPermission("audio.manage");
  return (
    <AdminSectionHub
      eyebrow="إدارة الصوت"
      title="مركز الصوت"
      description="المركز الموحد لإدارة طبقات الصوت في ذِكرٌ: تلاوات القرآن الكريم، والأذان، وتحويل النص إلى صوت، ومقاطع الموقع والتذكيرات."
      links={[
        { href: "/admin/audio/quran", label: "تلاوات القرآن", description: "إدارة مسارات التلاوة والربط مع المصحف." },
        { href: "/admin/audio/adhan", label: "الأذان", description: "إدارة ملفات الأذان واستخداماتها." },
        { href: "/admin/audio/tts", label: "تحويل النص إلى صوت", description: "إدارة مسار تحويل النص العربي إلى صوت." },
        { href: "/admin/site-audio", label: "صوت الموقع", description: "إدارة المقاطع الصوتية العامة والتذكيرات." },
      ]}
    />
  );
}
