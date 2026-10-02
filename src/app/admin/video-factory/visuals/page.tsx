import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactoryVisualsPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY / VISUALS"
      title="Visuals"
      description="طبقة المشاهد والحركة والأسلوب البصري التي يستخدمها العامل قبل إخراج الفيديو النهائي."
      links={[
        { href: "/admin/ai-video", label: "AI Video Studio", description: "اختيار النمط البصري وتخصيص إنتاج الفيديو." },
        { href: "/admin/video-factory/templates", label: "Templates", description: "قوالب الرندر المتاحة للمصنع." },
      ]}
    />
  );
}
