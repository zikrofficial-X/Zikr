import type { Metadata } from 'next';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getCompetitions } from '@/lib/services/site-content';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'المسابقات الإسلامية',
  description: 'شارك في المسابقات الإسلامية القرآنية والدينية على منصة ذِكرٌ واحصل على جوائز قيّمة.',
  path: '/competitions',
});

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

  return <Container className='space-y-8 py-10 text-right'>
    <section className='space-y-3'>
      <h1 className='text-3xl font-bold text-brand-gold'>المسابقات</h1>
      <p className='max-w-3xl leading-8 arabic-muted'>كل مسابقة يضيفها الأدمن من لوحة التحكم تظهر هنا بعد نشرها مباشرة.</p>
    </section>

    <section className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {competitions.map((competition) => <Card key={competition.id} className='space-y-3'>
        {competition.metadata?.imageUrl ? <Image src={competition.metadata.imageUrl} alt={competition.title} width={640} height={360} className='aspect-video w-full rounded-xl object-cover' /> : null}
        <h2 className='text-xl text-brand-gold'>{competition.title}</h2>
        <p className='leading-7 arabic-muted'>{competition.description}</p>
        {competition.prize ? <p className='text-sm text-emerald-200'>الجائزة: {competition.prize}</p> : null}
        {competition.metadata?.rules ? <p className='text-sm leading-6 arabic-muted'>الشروط: {competition.metadata.rules}</p> : null}
        <div className='text-xs arabic-muted'>
          {competition.starts_at ? <p>تبدأ: {new Date(competition.starts_at).toLocaleString('ar-EG')}</p> : null}
          {competition.ends_at ? <p>تنتهي: {new Date(competition.ends_at).toLocaleString('ar-EG')}</p> : null}
        </div>
      </Card>)}
      {!competitions.length ? <Card className='md:col-span-2 lg:col-span-3'>لا توجد مسابقات منشورة حاليًا. يمكن للأدمن إضافتها من لوحة التحكم.</Card> : null}
    </section>

    <Button href='/admin' variant='ghost'>لوحة الأدمن</Button>
  </Container>;
}
