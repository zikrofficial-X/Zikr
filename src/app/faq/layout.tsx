import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { generateFAQSchema } from '@/lib/seo';

const faqItems = [
  { question: 'هل منصة ذِكرٌ مجانية؟', answer: 'نعم، المنصة مجانية تماماً لجميع المستخدمين.' },
  { question: 'ما مصادر المحتوى الديني؟', answer: 'جميع المحتوى موثّق من مصادر إسلامية معتمدة كصحيح البخاري ومسلم.' },
  { question: 'هل يعمل الموقع على الجوال؟', answer: 'نعم، الموقع متجاوب مع جميع الأجهزة والمتصفحات.' },
  { question: 'كيف أستخدم أوقات الصلاة؟', answer: 'اذهب إلى قسم مواقيت الصلاة وأدخل مدينتك للحصول على المواقيت.' },
];

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'الأسئلة الشائعة',
    description: 'إجابات على أكثر الأسئلة شيوعاً حول منصة ذِكرٌ وخدماتها وطريقة استخدامها.',
    path: '/faq',
  }),
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = generateFAQSchema(faqItems);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
