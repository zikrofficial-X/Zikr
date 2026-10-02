import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminSectionHub } from "@/features/admin/components/admin-section-hub";

export const dynamic = "force-dynamic";

export default async function VideoFactoryDashboardPage() {
  await requireAdminPermission("video.manage");
  return (
    <AdminSectionHub
      eyebrow="VIDEO FACTORY"
      title="Video Factory Dashboard"
      description="المركز الرسمي لدورة إنتاج الفيديو: المصدر، النص، الصوت، الصورة، القالب، الطابور، الجودة، الجدولة والنشر."
      links={[
        { href: "/admin/video-factory/sources", label: "Sources", description: "اختيار المصادر الموثقة التي يبدأ منها الإنتاج." },
        { href: "/admin/video-factory/scripts", label: "Scripts", description: "إدارة نصوص وإعدادات النص قبل الرندر." },
        { href: "/admin/video-factory/voices", label: "Voices", description: "إدارة مسار الأصوات والتلاوات وTTS." },
        { href: "/admin/video-factory/visuals", label: "Visuals", description: "إدارة المشاهد والأسلوب البصري." },
        { href: "/admin/video-factory/templates", label: "Templates", description: "إدارة قوالب الرندر المستخدمة في المصنع." },
        { href: "/admin/video-factory/queue", label: "Queue", description: "متابعة الطلبات المعلقة والمعالجة والمكتملة." },
        { href: "/admin/video-factory/qa", label: "QA", description: "بوابة فحوصات جودة الفيديو قبل الاعتماد." },
        { href: "/admin/video-factory/scheduler", label: "Scheduler", description: "إدارة التشغيل المجدول وعامل GitHub Actions." },
        { href: "/admin/video-factory/publishing", label: "Publishing", description: "تسليم الفيديو للنشر على القنوات المرتبطة." },
      ]}
    />
  );
}
