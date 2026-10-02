import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactoryScriptsPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY / SCRIPTS"
      title="Scripts"
      description="طبقة النصوص وإعدادات السرد داخل مصنع الفيديو. النصوص الدينية تبقى source-locked ولا يتم استبدالها بكتابة حرة."
      links={[
        { href: "/admin/ai-video", label: "Video Studio", description: "إنشاء طلب يحتوي على النص المعتمد ومصدره." },
        { href: "/admin/video-factory/qa", label: "QA", description: "مراجعة ضوابط التطابق والصوت قبل اعتماد الناتج." },
      ]}
    />
  );
}
