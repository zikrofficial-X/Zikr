import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactoryTemplatesPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY / TEMPLATES"
      title="Templates"
      description="القوالب الثابتة التي يعتمد عليها الرندر المحلي عبر FFmpeg، مع إصدارات يمكن تتبعها في طلبات التوليد."
      links={[
        { href: "/admin/video-factory/visuals", label: "Visuals", description: "إدارة المشاهد والأساليب المرتبطة بالقالب." },
        { href: "/admin/video-factory/queue", label: "Queue", description: "متابعة نتائج الرندر الناتجة من القوالب." },
      ]}
    />
  );
}
