import Link from "next/link";
import { getAdminSnapshot } from "@/features/admin/services/platform";
import { deleteFailedVideoGenerationAction } from "@/app/admin/video-actions";

const utilities = [
  ["البحث المركزي", "/admin/search", "ابحث في المحتوى"],
  ["سجل الإدارة", "/admin/audit", "راجع كل العمليات الحساسة"],
  ["صحة النظام", "/admin/health", "افحص قاعدة البيانات والطوابير"],
  ["التنبيهات", "/admin/notifications", "أدر إشعارات التشغيل"],
  ["الأمن والصلاحيات", "/admin/security", "RBAC وMFA"],
  ["إعدادات الإدارة", "/admin/settings", "الضبط التشغيلي"],
  ["SEO/AdSense", "/admin/seo", "تدقيق الفهرسة وجودة المحتوى"],
  ["الأتمتة", "/admin/automation", "الطوابير والمهام"],
  ["مركز الإصدار", "/admin/release", "بوابة الجودة والإطلاق"],
] as const;

export async function AdminPlatformCommandCenter() {
  const snapshot = await getAdminSnapshot();
  const failedVideoJobs = snapshot.queues.videoFailed;

  return (
    <div className="space-y-8" dir="rtl">
      <header className="rounded-3xl border border-brand-gold/15 bg-black/20 p-6 md:p-8">
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">ZIKR ADMIN PLATFORM</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-3xl font-bold text-brand-gold">مركز العمليات الرئيسي</h1><p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/50">لوحة واحدة لإدارة المحتوى، المعرفة، الوسائط، الفيديو، النشر الاجتماعي، المستخدمين، الأمن، السجلات، صحة النظام، والأتمتة والإصدار.</p></div>
          <Link href="/" className="rounded-xl border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">عرض الموقع</Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {snapshot.metrics.map((metric) => <div key={metric.key} className={`rounded-2xl border p-5 ${metric.tone === 'danger' ? 'border-red-500/25 bg-red-500/10 text-red-200' : metric.tone === 'warning' ? 'border-amber-500/20 bg-amber-500/5 text-amber-200' : metric.tone === 'success' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200' : 'border-brand-gold/10 bg-black/15 text-brand-cream'}`}><p className="text-xs opacity-60">{metric.label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{metric.value.toLocaleString('ar-EG')}</p></div>)}
      </section>

      <section className="rounded-3xl border border-red-500/15 bg-red-500/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-lg font-bold text-brand-cream">تنظيف عمليات توليد الفيديو الفاشلة</h2><p className="mt-1 text-sm text-brand-cream/45">يتم استهداف status=failed فقط، مع تدقيق مركزي وMFA اختياري للعمليات الحساسة.</p></div>
          <form action={deleteFailedVideoGenerationAction}><button disabled={failedVideoJobs === 0} type="submit" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-35">حذف الفاشلة ({failedVideoJobs})</button></form>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-brand-gold">صحة الطوابير</h2><Link href="/admin/health" className="text-xs text-brand-cream/40 hover:text-brand-gold">تفاصيل</Link></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(snapshot.queues).map(([key, value]) => <div key={key} className="rounded-xl border border-brand-gold/8 bg-black/10 p-3"><p className="text-[11px] text-brand-cream/35">{key}</p><p className="mt-1 text-xl font-bold text-brand-cream">{value}</p></div>)}
          </div>
        </div>
        <div className="rounded-3xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-brand-gold">آخر العمليات الإدارية</h2><Link href="/admin/audit" className="text-xs text-brand-cream/40 hover:text-brand-gold">السجل الكامل</Link></div>
          <div className="mt-4 space-y-2">
            {snapshot.audit.slice(0, 6).map((event) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-gold/8 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm text-brand-cream/75">{event.action}</p><p className="text-[11px] text-brand-cream/30">{event.permission ?? '—'} · {event.resource_type ?? 'system'}</p></div><span className={event.outcome === 'success' ? 'text-emerald-300' : event.outcome === 'denied' ? 'text-amber-300' : 'text-red-300'}>{event.outcome}</span></div>)}
            {snapshot.audit.length === 0 && <p className="text-sm text-brand-cream/35">لا توجد عمليات حديثة.</p>}
          </div>
        </div>
      </section>

      <section><div className="mb-4"><h2 className="text-xl font-bold text-brand-gold">مراكز التشغيل</h2><p className="mt-1 text-sm text-brand-cream/40">الوحدات الجديدة مدمجة فوق وحدات ZIKR الحالية بدون تعطيلها.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{utilities.map(([title, href, description]) => <Link key={href} href={href} className="rounded-2xl border border-brand-gold/10 bg-black/10 p-5 transition hover:-translate-y-0.5 hover:border-brand-gold/25 hover:bg-black/20"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-brand-cream hover:text-brand-gold">{title}</h3><span className="text-xs text-brand-gold/50">فتح</span></div><p className="mt-2 text-sm leading-6 text-brand-cream/40">{description}</p></Link>)}</div></section>

      <section><div className="mb-4"><h2 className="text-xl font-bold text-brand-gold">جرد المحتوى</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{snapshot.counts.map((row) => <div key={row.table} className="rounded-2xl border border-brand-gold/8 bg-black/10 p-4"><p className="text-xs text-brand-cream/35">{row.label}</p><p className="mt-1 text-xl font-bold text-brand-cream">{row.count.toLocaleString('ar-EG')}</p></div>)}</div></section>

      <p className="text-center text-xs text-brand-cream/20">آخر تحديث: {new Date(snapshot.generatedAt).toLocaleString('ar-EG')}</p>
    </div>
  );
}
