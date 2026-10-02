import { Container } from '@/components/ui/container';
import { AudioLibrary } from '@/components/audio/audio-library';
import { Headphones, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'مكتبة الصوتيات',
  description: 'مكتبة موحدة للأذان والذكر والصلاة على النبي والتذكيرات الصوتية في منصة ذِكر.',
};

export default function AudioPage() {
  return (
    <Container className="py-10 sm:py-14" dir="rtl">
      <header className="mx-auto max-w-4xl text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-gold/20 bg-brand-gold/5 text-brand-gold"><Headphones className="h-7 w-7" /></span>
        <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-brand-gold/65">AUDIO LIBRARY</p>
        <h1 className="mt-2 text-4xl font-bold text-brand-gold">مكتبة الصوتيات</h1>
        <p className="mt-4 text-base leading-8 text-brand-cream/70">مكان واحد لتشغيل الأذان والذكر والصلاة على النبي والتذكيرات، مع مصدر واضح لكل مقطع ودعم للمقاطع التي يديرها فريق ذِكر.</p>
      </header>
      <section className="mx-auto mt-8 max-w-5xl rounded-2xl border border-brand-gold/15 bg-brand-gold/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
          <p className="text-sm leading-7 text-brand-cream/70">الصوت الافتراضي يعمل محليًا حتى عند غياب اتصال قاعدة البيانات، وعند تعيين مقطع أساسي من الإدارة تنتقل الواجهة إليه تلقائيًا من خلال API الموحد.</p>
        </div>
      </section>
      <div className="mt-8"><AudioLibrary /></div>
    </Container>
  );
}
