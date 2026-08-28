import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { getMemorizationPlans } from '@/lib/services/site-content';
import { VoiceRecorder } from './voice-recorder';
import { ProgressTracker } from './progress-tracker';
import { getMemorizationProgress } from './actions';

export const dynamic = 'force-dynamic';

import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'حفظ القرآن',
  description: 'خطط عملية لحفظ القرآن الكريم ومراجعته مع متابعة التقدم والتسجيل الصوتي للتسميع.',
  path: '/memorization',
  noindex: true,
});

const plans = [
  { title: 'ورد يومي للحفظ', cadence: 'يومي', target: '5 آيات أو نصف صفحة', tajweed: 'تصحيح المخارج والمدود قبل الانتقال.' },
  { title: 'مراجعة أسبوعين', cadence: 'كل أسبوعين', target: 'مراجعة ما سبق + اختبار أكمل', tajweed: 'تسجيل صوتي ومراجعة الغنة والقلقلة.' },
  { title: 'تثبيت الحفظ', cadence: '3 مرات أسبوعيًا', target: 'تسميع بلا نظر', tajweed: 'بطء في التلاوة مع علامات الوقف.' },
];

export default async function MemorizationPage() {
  const adminPlans = await getMemorizationPlans();
  const { entries, loggedIn } = await getMemorizationProgress();
  const visiblePlans = adminPlans.length ? adminPlans.map((plan) => ({
    title: plan.title,
    cadence: plan.cadence,
    target: plan.target_ref ?? 'ورد مخصص من الأدمن',
    tajweed: plan.tajweed_focus ?? plan.prompt ?? 'متابعة حفظ وتجويد.',
  })) : plans;

  return <Container className='space-y-8 py-10 text-right'>
    <section className='space-y-3'>
      <h1 className='text-3xl font-bold text-brand-gold'>الحفظ والتسميع بالتجويد</h1>
      <p className='max-w-3xl leading-8 arabic-muted'>اختار ورد يومي أو خطة أسبوعين، جاوب على أسئلة أكمل، وسجّل تسميعك صوتيًا ليتم تقييم الحفظ والتجويد بالذكاء الاصطناعي عند تفعيل API الصوت.</p>
      <Button href='/quran'>فتح المصحف</Button>
    </section>

    <section className='grid gap-4 md:grid-cols-3'>
      {visiblePlans.map((plan) => <Card key={plan.title} className='space-y-3'>
        <h2 className='text-xl text-brand-gold'>{plan.title}</h2>
        <p className='text-sm arabic-muted'>التكرار: {plan.cadence}</p>
        <p className='leading-7'>{plan.target}</p>
        <p className='text-sm leading-6 arabic-muted'>{plan.tajweed}</p>
      </Card>)}
    </section>

    <Card className='space-y-4'>
      <h2 className='text-2xl text-brand-gold'>متابعة تقدمك في الحفظ</h2>
      <ProgressTracker initialEntries={entries} loggedIn={loggedIn} />
    </Card>

    <Card className='space-y-4'>
      <h2 className='text-2xl text-brand-gold'>تسميع فويس وتقييم فوري</h2>
      <VoiceRecorder />
    </Card>

    <Card className='space-y-3'>
      <h2 className='text-2xl text-brand-gold'>أسئلة متابعة سريعة</h2>
      <ul className='list-inside list-disc space-y-2 leading-8 arabic-muted'>
        <li>أكمل الآية التالية من غير نظر، ثم قارنها بالمصحف.</li>
        <li>حدد موضع المد اللازم أو الغنة في ورد اليوم.</li>
        <li>سجّل دقيقة واحدة بترتيل هادئ وراجع الوقف والابتداء.</li>
      </ul>
    </Card>
  </Container>;
}
