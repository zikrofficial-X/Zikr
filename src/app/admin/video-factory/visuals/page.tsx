import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { AI_VISUAL_POLICY_TEXT, AI_VISUAL_POLICY_VERSION } from "@/features/videos/providers/ai-visual-policy";
import { getVideoEngineConfig, type VideoProviderName } from "@/features/videos/providers/types";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<VideoProviderName, string> = {
  hf_ltx_fast: "Hugging Face · LTX Fast",
  hf_wan: "Hugging Face · Wan",
  comfyui: "ComfyUI",
  free_api: "Free API",
  template: "FFmpeg Template",
};

export default async function VideoFactoryVisualsPage() {
  await requireAdminPermission("video.manage");
  const config = getVideoEngineConfig();

  const enabled = new Set<VideoProviderName>([
    ...(config.aiEnabled && config.hfLtxFastEnabled ? ["hf_ltx_fast" as const] : []),
    ...(config.aiEnabled && config.hfWanEnabled ? ["hf_wan" as const] : []),
    ...(config.aiEnabled && config.comfyUiEnabled ? ["comfyui" as const] : []),
    ...(config.aiEnabled && config.freeApiEnabled ? ["free_api" as const] : []),
    "template",
  ]);
  const ordered = [...config.order];
  const visualProviders = (["hf_ltx_fast", "hf_wan", "comfyui", "free_api", "template"] as VideoProviderName[]);

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/video-factory" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مصنع الفيديو</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">VIDEO FACTORY / VISUAL PROVIDERS</p>
        <h1 className="text-3xl font-bold text-brand-gold">سياسة المرئيات ومزوّدات التوليد</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          لوحة قراءة لإعدادات التشغيل الفعلية من بيئة الخادم. لا تعرض مفاتيح API ولا تسمح بتغييرها من المتصفح؛ تُدار الأسرار من إعدادات بيئة النشر.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs text-brand-cream/40">توليد AI العام</p><p className={`mt-2 text-xl font-bold ${config.aiEnabled ? "text-emerald-300" : "text-amber-200"}`}>{config.aiEnabled ? "مفعّل" : "متوقف"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">وضع المجاني فقط</p><p className="mt-2 text-xl font-bold text-brand-cream">{config.freeOnly ? "مفروض" : "غير مفروض"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">وضع التجربة Dry Run</p><p className={`mt-2 text-xl font-bold ${config.dryRun ? "text-amber-200" : "text-emerald-300"}`}>{config.dryRun ? "مفعّل" : "متوقف"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">الحد اليومي</p><p className="mt-2 text-xl font-bold text-brand-gold">{config.dailyLimit.toLocaleString("ar-EG-u-nu-latn")}</p></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {visualProviders.map((provider) => {
          const isEnabled = enabled.has(provider);
          const isInOrder = ordered.includes(provider);
          return (
            <article key={provider} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-brand-gold">{PROVIDER_LABELS[provider]}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs ${isEnabled ? "border-emerald-400/20 text-emerald-300" : "border-amber-400/20 text-amber-200"}`}>
                  {isEnabled ? "مسموح بالإعدادات" : "غير مفعّل"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-brand-cream/50">
                {provider === "template"
                  ? "مسار الرندر المحلي الاحتياطي؛ يعتمد على القوالب والأصول الموجودة داخل المشروع."
                  : "مزوّد مرئي خارجي. ظهور المزوّد في قائمة الأولوية لا يعني أن بيانات اعتماده أو حصته متاحة لحظة التشغيل."}
              </p>
              <p className="mt-3 text-xs text-brand-cream/35" dir="ltr">
                {provider} · {isInOrder ? `Priority #${ordered.indexOf(provider) + 1}` : provider === "template" ? "Fallback" : "Not in priority order"}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-brand-gold">ترتيب المحاولة الحالي</h2>
          <span className="text-xs text-brand-cream/35">من إعدادات الخادم</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" dir="ltr">
          {ordered.map((provider, index) => (
            <span key={provider} className="rounded-xl border border-brand-gold/15 bg-black/20 px-3 py-2 text-xs text-brand-cream/75">
              {index + 1}. {PROVIDER_LABELS[provider]}
            </span>
          ))}
          <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
            Final fallback: FFmpeg Template
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-3"><p className="text-xs text-brand-cream/35">إعادة المحاولة القصوى</p><p className="mt-1 text-lg font-semibold text-brand-cream">{config.maxRetries}</p></div>
          <div className="rounded-xl bg-black/20 p-3"><p className="text-xs text-brand-cream/35">اعتبار الطلب عالقًا بعد</p><p className="mt-1 text-lg font-semibold text-brand-cream">{config.staleAfterMinutes} دقيقة</p></div>
          <div className="rounded-xl bg-black/20 p-3"><p className="text-xs text-brand-cream/35">مدة الفيديو الافتراضية</p><p className="mt-1 text-lg font-semibold text-brand-cream">{config.defaultDuration} ثانية</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
        <p className="text-xs tracking-wide text-amber-200/70">VISUAL SAFETY POLICY · {AI_VISUAL_POLICY_VERSION}</p>
        <h2 className="mt-2 font-semibold text-brand-gold">ضوابط توليد المشاهد</h2>
        <p className="mt-3 text-sm leading-7 text-brand-cream/65">{AI_VISUAL_POLICY_TEXT}</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/video-factory/templates" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">مكتبة القوالب</Link>
        <Link href="/admin/video-factory/qa" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/70">بوابة الجودة</Link>
        <Link href="/admin/automation" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/70">التحكم في التشغيل</Link>
      </div>
    </Container>
  );
}
