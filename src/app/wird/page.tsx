import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { WirdDashboard } from '@/components/wird/wird-dashboard';

export const metadata: Metadata = pageMetadata({
  title: 'الورد اليومي وختم القرآن',
  description:
    'حدّد وردك اليومي من الآيات وتابع تقدّمك في ختم القرآن الكريم مع عدّاد المداومة — يعمل بالكامل بدون إنترنت.',
  path: '/wird',
  noindex: true,
});

export default function WirdPage() {
  return (
    <Container className="space-y-6 py-12">
      <nav className="text-sm text-brand-cream/60" dir="rtl">
        <Link href="/" className="hover:text-brand-gold">الرئيسية</Link>
        {' / '}
        <span className="text-brand-gold">الورد اليومي</span>
      </nav>

      <header dir="rtl">
        <h1 className="text-3xl font-bold text-brand-gold sm:text-4xl">الورد اليومي وختم القرآن</h1>
        <p className="mt-2 max-w-2xl text-brand-cream/70">
          اجعل لك ورداً ثابتاً من كتاب الله كل يوم، وتابع تقدّمك نحو ختم المصحف. بياناتك محفوظة على جهازك وتعمل بدون إنترنت.
        </p>
      </header>

      <WirdDashboard />
    </Container>
  );
}
