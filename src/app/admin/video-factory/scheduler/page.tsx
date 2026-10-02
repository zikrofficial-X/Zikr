import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactorySchedulerPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY / SCHEDULER"
      title="Scheduler"
      description="المسار الرسمي للتحكم في التشغيل المجدول عبر GitHub Actions، مع إعدادات الأتمتة المخزنة في Admin Settings."
      links={[
        { href: "/admin/automation", label: "Automation Ops", description: "إعدادات التشغيل التلقائي وحالة آخر عامل تشغيل." },
        { href: "/admin/video-factory/queue", label: "Queue", description: "متابعة الطلبات التي أنشأها العامل." },
      ]}
    />
  );
}
