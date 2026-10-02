import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function AudioTtsPage() {
  await requireAdminPermission("audio.manage");
  return (
    <AdminSectionHub
      eyebrow="AUDIO / TTS"
      title="TTS"
      description="إدارة طبقة تحويل النص العربي إلى صوت والتي يعتمد عليها العامل عند غياب التسجيل البشري أو الصوت الموثق."
      links={[
        { href: "/admin/video-factory/voices", label: "Video Voices", description: "تطبيق خيارات الصوت داخل مصنع الفيديو." },
        { href: "/admin/audio", label: "Audio Dashboard", description: "العودة إلى مركز الصوت." },
      ]}
    />
  );
}
