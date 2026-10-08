import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminSnapshot } from "@/features/admin/services/platform";

export const dynamic = "force-dynamic";

export default async function VideoFactoryScriptsPage() {
  await requireAdminPermission("video.manage");
  const snapshot = await getAdminSnapshot();
  const drafts = snapshot.metrics.find((metric) => metric.key === "drafts")?.value ?? 0;

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/video-factory" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مصنع الفيديو</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">SCRIPT FACTORY</p>
        <h1 className="text-3xl font-bold text-brand-gold">النصوص والسرد</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          هذه الطبقة تفصل بين الكتابة التحريرية والتوثيق الديني. النصوص المنسوبة للقرآن والحديث والأذكار لا يعاد توليدها من AI، بل تطابق المصدر المنشور حرفيًا بعد التطبيع الآمن.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">محتوى يحتاج مراجعة</p><p className="mt-2 text-3xl font-bold text-brand-gold">{drafts}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">القاعدة الدينية</p><p className="mt-2 text-sm font-semibold text-emerald-200">Source-locked</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">كتابة AI</p><p className="mt-2 text-sm font-semibold text-brand-cream/75">للعنوان والكابشن والمشهد فقط</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
          <h2 className="font-bold text-brand-gold">حديث أو أثر</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/55">النص الأصلي + الدرجة + المرجع يبقون كما هم. أي اختلاف عن المصدر يؤدي إلى رفض طلب الفيديو.</p>
        </article>
        <article className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
          <h2 className="font-bold text-brand-gold">المحتوى التحريري</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/55">الرسائل الأصلية يمكن تحسين عنوانها وكابشنها، لكن لا يُسمح بادعاءات دينية أو إحالات غير موجودة في المصدر.</p>
        </article>
      </section>

      <Link href="/admin/ai-video" className="inline-flex rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/15">فتح استوديو الفيديو</Link>
    </Container>
  );
}
