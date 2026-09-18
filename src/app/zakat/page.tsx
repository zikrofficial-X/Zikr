import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { ZakatDashboard } from '@/components/zakat/zakat-dashboard';

export const metadata: Metadata = pageMetadata({
  title: 'الزكاة والتذكير السنوي',
  description:
    'احسب زكاة مالك واضبط تذكيراً سنوياً متجدداً بموعد إخراج الزكاة عند حولان الحول — يعمل بدون إنترنت.',
  path: '/zakat',
});

export default function ZakatPage() {
  return (
    <Container className="space-y-6 py-12">
      <nav className="text-sm text-brand-cream/60" dir="rtl">
        <Link href="/" className="hover:text-brand-gold">الرئيسية</Link>
        {' / '}
        <span className="text-brand-gold">الزكاة</span>
      </nav>

      <header dir="rtl">
        <h1 className="text-3xl font-bold text-brand-gold sm:text-4xl">الزكاة والتذكير السنوي</h1>
        <p className="mt-2 max-w-2xl text-brand-cream/70">
          احسب مقدار زكاتك واضبط تذكيراً سنوياً متجدداً بموعد إخراجها. بياناتك محفوظة على جهازك.
        </p>
      </header>

      <ZakatDashboard />
    </Container>
  );
}
