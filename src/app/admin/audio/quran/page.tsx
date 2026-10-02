import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function AudioQuranPage() {
  await requireAdminPermission("audio.manage");
  return (
    <AdminSectionHub
      eyebrow="AUDIO / QURAN"
      title="Quran Audio"
      description="طبقة الصوت القرآني المستخدمة في مشغل القرآن وفي إنتاج الفيديو."
      links={[
        { href: "/admin/audio", label: "Audio Dashboard", description: "العودة إلى مركز الصوت." },
        { href: "/admin/video-factory/voices", label: "Video Voices", description: "ربط التلاوة بمصنع الفيديو." },
      ]}
    />
  );
}
