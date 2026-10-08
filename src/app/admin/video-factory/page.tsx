import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminSnapshot } from "@/features/admin/services/platform";

export const dynamic = "force-dynamic";

const modules = [
  { href: "/admin/video-factory/sources", label: "المصادر", description: "مصدر موثوق + نص مقفل + مرجع قابل للتتبع." },
  { href: "/admin/video-factory/scripts", label: "النصوص", description: "فحص الكتابة العربية وقواعد source-lock." },
  { href: "/admin/video-factory/voices", label: "الأصوات", description: "التلاوة البشرية، ملفات TTS، والخصائص الصوتية." },
  { href: "/admin/video-factory/visuals", label: "المشاهد", description: "مزودات AI، الخلفيات، الحركة والسياسة البصرية." },
  { href: "/admin/video-factory/templates", label: "القوالب", description: "إصدارات FFmpeg ودقات الإخراج." },
  { href: "/admin/video-factory/qa", label: "الجودة", description: "فحص المصدر، الصوت، المدة، الترميز والنتيجة النهائية." },
  { href: "/admin/videos", label: "الطابور", description: "طلبات الانتظار والمعالجة وإعادة المحاولة." },
  { href: "/admin/social", label: "النشر", description: "YouTube وFacebook/Reels والطابور الاجتماعي." },
  { href: "/admin/automation", label: "الأتمتة", description: "الهدف اليومي، AI، المدة، التشغيل العاجل والجدولة." },
] as const;

export default async function VideoFactoryDashboardPage() {
  await requireAdminPermission("video.manage");
  const snapshot = await getAdminSnapshot();

  const videoPending = snapshot.queues.videoPending + snapshot.queues.videoProcessing;
  const videoFailures = snapshot.queues.videoFailed;
  const socialPending = snapshot.queues.socialQueued;
  const socialFailures = snapshot.queues.socialFailed;

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-3">
        <p className="text-xs tracking-[0.22em] text-brand-cream/30">ZIKR VIDEO FACTORY</p>
        <h1 className="text-3xl font-bold text-brand-gold md:text-4xl">مصنع الفيديو</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          لوحة إنتاج موحدة تربط المصدر الموثق بالنص والصوت والمشهد والرندر وضبط الجودة والنشر، بدون مسارات متنافسة أو جدولة مكررة.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["طلبات الفيديو النشطة", videoPending, videoFailures ? "يوجد فشل يحتاج مراجعة" : "لا يوجد فشل مرئي", videoFailures ? "danger" : "success"],
          ["النشر الاجتماعي", socialPending, socialFailures ? "يوجد فشل نشر" : "الطابور منضبط", socialFailures ? "danger" : "neutral"],
          ["المسودات والمراجعة", snapshot.metrics.find((metric) => metric.key === "drafts")?.value ?? 0, "محتوى يحتاج قرارًا تحريريًا", "warning"],
          ["تدقيق الإدارة", snapshot.metrics.find((metric) => metric.key === "auditFailures")?.value ?? 0, "آخر 12 عملية مدققة", "neutral"],
        ].map(([label, value, note, tone]) => (
          <div key={String(label)} className={`rounded-2xl border p-5 ${
            tone === "danger"
              ? "border-red-400/20 bg-red-500/5"
              : tone === "warning"
                ? "border-amber-300/15 bg-amber-300/5"
                : "border-brand-gold/10 bg-black/15"
          }`}>
            <p className="text-xs text-brand-cream/40">{label}</p>
            <p className="mt-2 text-3xl font-bold text-brand-gold">{Number(value).toLocaleString("ar-EG-u-nu-latn")}</p>
            <p className="mt-1 text-xs text-brand-cream/35">{note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group rounded-2xl border border-brand-gold/10 bg-black/15 p-5 transition hover:border-brand-gold/25 hover:bg-brand-gold/5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-brand-gold">{module.label}</h2>
              <span className="text-xs text-brand-gold/40 transition group-hover:text-brand-gold">فتح ←</span>
            </div>
            <p className="mt-2 text-sm leading-7 text-brand-cream/50">{module.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link href="/admin/ai-video" className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5 hover:border-emerald-400/30">
          <p className="text-xs text-emerald-200/55">Production Studio</p>
          <h2 className="mt-1 font-semibold text-brand-gold">استوديو إنشاء الفيديو</h2>
          <p className="mt-2 text-sm leading-6 text-brand-cream/50">اختيار مصدر، إنشاء طلب، وتوليد فيديو source-locked.</p>
        </Link>
        <Link href="/admin/video-factory/qa" className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-5 hover:border-sky-400/30">
          <p className="text-xs text-sky-200/55">Quality Gate</p>
          <h2 className="mt-1 font-semibold text-brand-gold">بوابة الجودة</h2>
          <p className="mt-2 text-sm leading-6 text-brand-cream/50">لا يمر أي فيديو صامت أو غير صالح أو خارج مواصفات الإخراج.</p>
        </Link>
        <Link href="/admin/automation" className="rounded-2xl border border-brand-gold/10 bg-black/10 p-5 hover:border-brand-gold/25">
          <p className="text-xs text-brand-cream/30">Operations</p>
          <h2 className="mt-1 font-semibold text-brand-gold">مركز الأتمتة</h2>
          <p className="mt-2 text-sm leading-6 text-brand-cream/50">الهدف اليومي، محاولات AI، مدة الفيديو، Run Now والنشر.</p>
        </Link>
      </section>

      <p className="text-xs text-brand-cream/25">آخر تحديث للبيانات: {new Date(snapshot.generatedAt).toLocaleString("ar-EG-u-nu-latn")}</p>
    </Container>
  );
}
