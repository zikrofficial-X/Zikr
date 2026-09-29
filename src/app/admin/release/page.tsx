export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminHealth } from "@/features/admin/services/platform";

export const metadata: Metadata = { title: "مركز الإصدار | الأدمن" };

const checks = [
  ["CI / Verify", "CircleCI → ci-check"],
  ["Production build", "vercel.json → pnpm build"],
  ["Migration integrity", "pnpm supabase:migrations:check"],
  ["Routes integrity", "pnpm routes:check"],
  ["Mobile readiness", "pnpm mobile:check"],
] as const;

export default async function AdminReleasePage() {
  await requireAdminPermission("release.manage");
  const health = await getAdminHealth();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "غير متاح خارج Vercel";
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "غير متاح";

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">RELEASE OPERATIONS</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">مركز الإصدار</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">بوابة تعرض معلومات الإصدار الفعلية والتحققات المطلوبة. وجود اسم التحقق هنا لا يعني أنه نجح؛ النتيجة النهائية تأتي من CI/Deployment.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">Branch</p><p className="mt-2 font-mono text-sm text-brand-cream/70">{branch}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5 md:col-span-2"><p className="text-xs text-brand-cream/35">Commit</p><p className="mt-2 break-all font-mono text-sm text-brand-cream/70">{commit}</p></div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <h2 className="text-lg font-semibold text-brand-gold">التحققات المطلوبة</h2>
        <div className="mt-4 space-y-2">
          {checks.map(([name, value]) => <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-gold/8 bg-black/10 px-4 py-3"><span className="text-sm text-brand-cream/75">{name}</span><span className="font-mono text-xs text-brand-cream/35">{value}</span><span className="text-[11px] text-brand-cream/25">تحقق خارجي</span></div>)}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${health.database === 'healthy' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}><h2 className="font-semibold text-brand-gold">اتصال قاعدة البيانات</h2><p className="mt-2 text-sm text-brand-cream/55">{health.database === 'healthy' ? 'تم الاتصال بقاعدة الإنتاج بنجاح في آخر فحص.' : 'تعذر تأكيد سلامة الاتصال في آخر فحص.'}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><h2 className="font-semibold text-brand-gold">الطوابير</h2><p className="mt-2 text-sm text-brand-cream/55">Social failed: {health.queues.socialFailed} · Video failed: {health.queues.videoFailed}</p></div>
      </section>
    </Container>
  );
}
