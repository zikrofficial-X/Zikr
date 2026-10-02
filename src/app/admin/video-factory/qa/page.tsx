import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactoryQaPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY / QA"
      title="QA"
      description="بوابة الجودة التي تربط تحقق المصدر وفحص الدقة والترميز ووجود الصوت قبل وضع طلب الفيديو في completed."
      links={[
        { href: "/admin/videos", label: "Queue", description: "عرض حالات الطلبات وأخطاء الرندر وإعادة المحاولة." },
        { href: "/admin/video-factory/sources", label: "Sources", description: "التأكد من المصدر قبل بدء الإنتاج." },
      ]}
    />
  );
}
