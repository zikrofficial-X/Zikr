export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminHealth } from "@/features/admin/services/platform";
import { getVideoEngineConfig } from "@/features/videos/providers/types";
import { supabaseServerAdminCount } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "صحة النظام | لوحة الإدارة" };

const STATE_LABELS: Record<string, string> = {
  healthy: "سليم",
  degraded: "متدهور",
  available: "متاح",
  unavailable: "تعذر الفحص",
  empty: "لا توجد بيانات",
  socialQueued: "النشر الاجتماعي — في الانتظار",
  socialProcessing: "النشر الاجتماعي — قيد التنفيذ",
  socialPartial: "النشر الاجتماعي — يحتاج معالجة",
  socialFailed: "فشل النشر الاجتماعي",
  videoPending: "الفيديو — في الانتظار",
  videoProcessing: "الفيديو — قيد التنفيذ",
  videoRetryWait: "الفيديو — إعادة المحاولة",
  videoFailed: "فشل الفيديو",
};

export default async function AdminHealthPage() {
  await requireAdminPermission("system.manage");
  const [health, quranAudioCount] = await Promise.all([
    getAdminHealth(),
    supabaseServerAdminCount("quran_audio").catch(() => null),
  ]);
  const engine = getVideoEngineConfig();
  const queueAttention =
    health.queues.socialPartial +
    health.queues.socialFailed +
    health.queues.videoRetryWait +
    health.queues.videoFailed;

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.18em] text-brand-cream/30">صحة النظام</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">صحة وتشغيل النظام</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">فحص قاعدة البيانات، الجداول التشغيلية، وطوابير الفيديو والنشر بدون كشف أسرار البيئة.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4">
          <p className="text-xs text-brand-cream/35">محركات الفيديو</p>
          <p className="mt-1 text-sm font-bold text-brand-gold" dir="ltr">{engine.order.join(" → ")}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4">
          <p className="text-xs text-brand-cream/35">النشر الآلي</p>
          <p className="mt-1 text-sm font-bold text-brand-cream/75">{engine.autoPublishEnabled ? "مفعل" : "متوقف"}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${health.database === 'healthy' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/10'}`}>
          <p className="text-xs text-brand-cream/40">قاعدة البيانات</p>
          <p className="mt-2 text-xl font-bold">{health.database === 'healthy' ? 'سليمة' : 'متدهورة'}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${queueAttention ? 'border-amber-500/25 bg-amber-500/10' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
          <p className="text-xs text-brand-cream/40">حالات تحتاج معالجة</p>
          <p className="mt-2 text-xl font-bold">{queueAttention}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/40">آخر فحص</p>
          <p className="mt-2 text-sm text-brand-cream/70">{new Date(health.generatedAt).toLocaleString('ar-EG-u-nu-latn')}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/40">صوت القرآن</p>
          <p className="mt-2 text-xl font-bold text-brand-gold">{quranAudioCount === null ? "غير متاح" : quranAudioCount.toLocaleString("ar-EG-u-nu-latn")}</p>
          <p className="mt-1 text-xs text-brand-cream/30">quran_audio</p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-brand-gold/10 bg-black/20 px-5 py-3 text-xs font-semibold text-brand-gold/70">
          <span>المورد</span><span>العدد</span><span>الحالة</span>
        </div>
        {health.tables.map((table) => (
          <div key={table.table} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-brand-gold/8 px-5 py-3 text-sm last:border-0">
            <span className="font-mono text-brand-cream/70">{table.table}</span>
            <span className="tabular-nums text-brand-cream/50">{table.count === null ? 'غير متاح' : table.count.toLocaleString('ar-EG-u-nu-latn')}</span>
            <span className={table.state === "unavailable" ? "text-red-300" : table.state === "empty" ? "text-amber-300" : "text-emerald-300"}>{STATE_LABELS[table.state] ?? table.state}</span>
          </div>
        ))}
      </section>

      {health.tables.some((table) => table.state === "empty") && (
        <section className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-5 py-4">
          <p className="text-sm font-semibold text-amber-200">تنبيه بيانات</p>
          <p className="mt-1 text-sm leading-6 text-brand-cream/55">
            الجداول الفارغة ليست عطل اتصال، لكنها تعني أن المصدر لم تتم تعبئته بعد. راجع مكتبة المحتوى والوسائط قبل اعتبار القسم جاهزًا للإنتاج.
          </p>
        </section>
      )}

      {(!health.queuesAvailable.social || !health.queuesAvailable.video) && (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-7 text-red-100/85">
          تعذر قراءة {[!health.queuesAvailable.social && "طابور النشر الاجتماعي", !health.queuesAvailable.video && "طابور توليد الفيديو"].filter(Boolean).join(" و")}. الأرقام غير المتاحة ليست أصفارًا حقيقية.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(health.queues).map(([key, value]) => {
          const readable = key.startsWith("social") ? health.queuesAvailable.social : health.queuesAvailable.video;
          return (
            <div key={key} className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4"><p className="text-xs text-brand-cream/35">{STATE_LABELS[key] ?? key}</p><p className="mt-1 text-2xl font-bold text-brand-cream">{readable ? value : "غير متاح"}</p></div>
          );
        })}
      </section>
    </Container>
  );
}
