import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactoryVoicesPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY / VOICES"
      title="Voices"
      description="مركز إدارة مسار الصوت المستخدم في إنتاج الفيديو، بما في ذلك التلاوة الموثقة والتسجيل البشري وTTS."
      links={[
        { href: "/admin/site-audio", label: "Site Audio", description: "إدارة الأصول الصوتية العامة للموقع." },
        { href: "/admin/video-factory/qa", label: "QA", description: "فحوصات وجود الصوت وعدم كونه صامتًا." },
      ]}
    />
  );
}
