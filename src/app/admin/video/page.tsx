import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs";

export default async function AdminVideoHubPage() {
  await requireAdminPermission("video.manage");
  const modules = [
    ["/admin/video/requests", "الطلبات والطابور", "متابعة حالات التوليد وإعادة المحاولة."],
    ["/admin/video/studio", "الاستوديو", "إنشاء فيديو موثق من مصدر منشور."],
    ["/admin/video/scripts", "نصوص السرد", "مراجعة النصوص العربية والمصادر."],
    ["/admin/video/voices", "الأصوات", "إدارة التلاوة وملفات TTS."],
    ["/admin/video/visuals", "العناصر المرئية", "إدارة الخلفيات والسياسة البصرية."],
    ["/admin/video/qa", "ضبط الجودة", "فحص المصدر والصوت والترميز قبل النشر."],
  ];
  return <div className="mx-auto max-w-[1800px] space-y-6 p-4 md:p-8" dir="rtl">
    <AdminBreadcrumbs current="مركز الفيديو" />
    <header><p className="text-xs tracking-[0.18em] text-brand-cream/30">VIDEO OPERATIONS</p><h1 className="mt-2 text-3xl font-bold text-brand-gold">مركز الفيديو</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/50">مسار موحد من المصدر إلى النص والصوت والمشهد وضبط الجودة ثم النشر.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{modules.map(([href, title, description]) => <Link key={href} href={href} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5 transition hover:border-brand-gold/30 hover:bg-brand-gold/5"><h2 className="font-semibold text-brand-cream hover:text-brand-gold">{title}</h2><p className="mt-2 text-sm leading-6 text-brand-cream/45">{description}</p><span className="mt-4 inline-flex text-xs text-brand-gold">فتح الوحدة ←</span></Link>)}</div>
    <div className="rounded-2xl border border-sky-400/15 bg-sky-400/[0.05] p-5 text-sm leading-7 text-sky-100/75">المسارات القديمة لمصنع الفيديو والاستوديو ما زالت تعمل للتوافق، بينما هذا هو المسار الرسمي الجديد.</div>
  </div>;
}
