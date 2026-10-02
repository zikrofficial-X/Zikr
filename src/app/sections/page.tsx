import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { ArrowLeft, ArrowUpLeft, ChevronLeft, type LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { SITE_CATALOG } from '@/lib/navigation/catalog';

function resolveIcon(name: string): LucideIcon {
  const candidate = (Icons as unknown as Record<string, unknown>)[name];
  return (candidate as LucideIcon | undefined) ?? Icons.Circle;
}

const toneClasses: Record<string, string> = {
  quran: 'border-emerald-400/20 bg-emerald-950/30 hover:border-emerald-300/45',
  sunnah: 'border-violet-300/20 bg-violet-950/20 hover:border-violet-200/45',
  worship: 'border-sky-300/20 bg-sky-950/20 hover:border-sky-200/45',
  history: 'border-amber-300/20 bg-amber-950/20 hover:border-amber-200/45',
  media: 'border-rose-300/20 bg-rose-950/20 hover:border-rose-200/45',
  kids: 'border-cyan-300/20 bg-cyan-950/20 hover:border-cyan-200/45',
  tools: 'border-slate-300/20 bg-slate-900/30 hover:border-slate-200/45',
  learning: 'border-teal-300/20 bg-teal-950/20 hover:border-teal-200/45',
};

export const metadata = {
  title: 'دليل أقسام ذِكر',
  description: 'خريطة موحدة ومنظمة لجميع أقسام منصة ذِكر دون تكرار أو تداخل.',
};

export default function SectionsPage() {
  return (
    <Container className="py-10 sm:py-14" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border border-brand-gold/20 bg-[radial-gradient(circle_at_80%_0%,rgba(199,168,107,0.16),transparent_34%),linear-gradient(135deg,#0b3329,#061b15)] p-6 sm:p-10">
        <div className="relative max-w-5xl">
          <span className="inline-flex items-center rounded-full border border-brand-gold/20 bg-black/20 px-3 py-1 text-xs text-brand-gold">خريطة المنصة</span>
          <h1 className="mt-4 text-4xl font-bold text-brand-gold sm:text-5xl">كل ذِكر في مكانه الصحيح</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-brand-cream/75 sm:text-lg">
            هذا هو المدخل التنظيمي الواحد للمنصة. كل وظيفة لها مكان أساسي واحد، والمحتوى المتشابه يجتمع تحت مسار واحد بدل إنشاء صفحات متكررة. يمكنك البدء من أي مجموعة ثم الانتقال إلى الأدوات المرتبطة بها دون فقد السياق.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-bold text-brand-emeraldDeep hover:bg-brand-goldSoft">ابدأ بالبحث <ArrowLeft className="h-4 w-4" /></Link>
            <Link href="/platform" className="inline-flex items-center gap-2 rounded-xl border border-brand-gold/30 px-4 py-2.5 text-sm text-brand-cream hover:border-brand-gold hover:text-brand-gold">دليل الاستخدام <ArrowUpLeft className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <div className="mt-10 space-y-10">
        {SITE_CATALOG.map(group => {
          const GroupIcon = resolveIcon(group.icon);
          return (
            <section key={group.id} aria-labelledby={`${group.id}-heading`}>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-brand-gold">
                    <GroupIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-xs font-semibold tracking-[0.18em] text-brand-gold/60">{group.en}</span>
                  </div>
                  <h2 id={`${group.id}-heading`} className="mt-2 text-2xl font-bold text-brand-gold">{group.ar}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/65">{group.descriptionAr}</p>
                </div>
                <span className="hidden rounded-full border border-brand-cream/10 px-3 py-1 text-xs text-brand-cream/55 sm:inline-flex">{group.items.length} مسارات</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map(item => {
                  const ItemIcon = resolveIcon(item.icon);
                  return (
                    <Link key={item.href} href={item.href} className={`group rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 ${toneClasses[item.tone] ?? toneClasses.tools}`}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/15 text-brand-gold"><ItemIcon className="h-5 w-5" aria-hidden="true" /></span>
                        <ChevronLeft className="mt-1 h-4 w-4 text-brand-cream/35 transition-transform group-hover:-translate-x-1 group-hover:text-brand-gold" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-brand-cream group-hover:text-brand-gold">{item.ar}</h3>
                      <p className="mt-2 text-sm leading-7 text-brand-cream/60">{item.descriptionAr}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-12 rounded-2xl border border-brand-gold/15 bg-brand-gold/5 p-5 sm:p-7">
        <h2 className="text-xl font-bold text-brand-gold">قاعدة التنظيم الجديدة</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-brand-cream/70">
          لا توجد صفحة جديدة لمجرد إنشاء رابط آخر لنفس المحتوى. الوظائف المتشابهة تُجمع في مسار واحد، والصفحات المتخصصة تحتفظ بدورها عندما تقدم تجربة أو مادة مختلفة فعليًا. أي قسم جديد يجب أن يدخل الكتالوج أولًا ثم يمر على فحص التكرار قبل الدمج.
        </p>
      </section>
    </Container>
  );
}
