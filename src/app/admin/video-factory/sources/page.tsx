import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactorySourcesPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY / SOURCES"
      title="Sources"
      description="مصادر الفيديو هي نقطة البداية الموثقة. الاستوديو الحالي يحتوي على اختيار المصادر والتحقق من النص قبل الرندر."
      links={[
        { href: "/admin/ai-video", label: "Video Studio", description: "اختيار مصدر منشور وإنشاء طلب فيديو موثق." },
        { href: "/admin/sources", label: "Content Sources", description: "إدارة مصادر المحتوى الأساسية على مستوى المنصة." },
      ]}
    />
  );
}
