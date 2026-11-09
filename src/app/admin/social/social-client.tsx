import Link from "next/link";

export default function AdminSocialPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-brand-gold/15 bg-black/15 p-6 text-brand-cream" dir="rtl">
      <p className="text-xs tracking-[0.18em] text-brand-cream/40">العمليات الداخلية</p>
      <h1 className="text-2xl font-bold text-brand-gold">النشر الاجتماعي الخارجي متوقف</h1>
      <p className="text-sm leading-7 text-brand-cream/60">
        لا تُرسل ZIKR منشورات أو فيديوهات إلى منصات خارجية. لإدارة ذاكرة المشروع وملفات العمل ومخرجات الفيديو، استخدم مساحة الذاكرة الداخلية.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/video/requests" className="inline-flex rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-black transition hover:bg-brand-gold/90">
          مراجعة الفيديوهات
        </Link>
        <span className="self-center text-sm text-brand-cream/55">فتح تفاصيل الفيديو واعتماده من خلال الطابور الداخلي المحمي.</span>
        <Link href="/admin/memory" className="inline-flex rounded-xl border border-brand-gold/25 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold/10">
          فتح ذاكرة المشروع
        </Link>
      </div>
    </section>
  );
}
