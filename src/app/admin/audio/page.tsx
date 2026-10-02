import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function AudioDashboardPage() {
  await requireAdminPermission("audio.manage");
  return (
    <AdminSectionHub
      eyebrow="AUDIO"
      title="Audio"
      description="المركز الموحد لإدارة طبقات الصوت في ذِكرٌ: القرآن، الأذان، TTS والصوت العام للموقع."
      links={[
        { href: "/admin/audio/quran", label: "Quran", description: "إدارة مسارات التلاوة والربط مع المصحف." },
        { href: "/admin/audio/adhan", label: "Adhan", description: "إدارة ملفات الأذان واستخداماتها." },
        { href: "/admin/audio/tts", label: "TTS", description: "إدارة مسار تحويل النص العربي إلى صوت." },
        { href: "/admin/site-audio", label: "Site Audio", description: "إدارة المقاطع الصوتية العامة للموقع." },
      ]}
    />
  );
}
