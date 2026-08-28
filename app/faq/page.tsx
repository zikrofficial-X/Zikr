'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'عام',
    items: [
      { q: 'هل منصة ذِكرٌ مجانية؟', a: 'نعم، المنصة مجانية بالكامل ولا تتطلب اشتراكاً. بعض المزايا المتقدمة قد تكون حصرية للمسجلين.' },
      { q: 'هل تحتاج إلى إنشاء حساب؟', a: 'يمكنك تصفح معظم المحتوى بدون حساب. الحساب مطلوب لحفظ المفضلة ومتابعة التقدم في الحفظ.' },
      { q: 'هل المنصة متاحة على الجوال؟', a: 'نعم، الموقع متجاوب بالكامل مع الجوال والتابلت والحاسوب. تطبيق جوال قيد التطوير.' },
      { q: 'ما المتصفحات المدعومة؟', a: 'ندعم كل المتصفحات الحديثة: Chrome وFirefox وSafari وEdge. تأكد من استخدام أحدث إصدار.' },
    ],
  },
  {
    category: 'المحتوى',
    items: [
      { q: 'من أين يأتي المحتوى الديني؟', a: 'المحتوى مأخوذ من مصادر إسلامية موثوقة ومراجع أكاديمية معتمدة. قصص الأنبياء مستندة إلى القرآن الكريم والسيرة الصحيحة.' },
      { q: 'كم عدد الأنبياء المتاحة قصصهم؟', a: 'المنصة تحتوي على قصص 25 نبياً بشكل كامل مع التفاصيل والدروس والفيديوهات المرتبطة.' },
      { q: 'هل يمكن ربط فيديوهات يوتيوب بالقصص؟', a: 'نعم، يمكن ربط كل قصة نبي أو غزوة بفيديو من قناة يوتيوب من خلال لوحة الإدارة.' },
      { q: 'كيف أحفظ آخر موضع قراءة؟', a: 'بعد تسجيل الدخول، يتم حفظ آخر آية قرأتها تلقائياً. يمكنك العودة لها من صفحة المفضلة.' },
      { q: 'هل يمكنني تحميل التلاوات الصوتية؟', a: 'حالياً يمكن الاستماع للتلاوات مباشرة من الموقع. ميزة التحميل ستتوفر قريباً.' },
    ],
  },
  {
    category: 'مواقيت الصلاة',
    items: [
      { q: 'هل مواقيت الصلاة دقيقة؟', a: 'نعم، نستخدم حسابات فلكية دقيقة مع مراعاة موقعك الجغرافي ومنهجية الحساب التي تختارها.' },
      { q: 'ما المنهجيات المتاحة لحساب المواقيت؟', a: 'ندعم: رابطة العالم الإسلامي، إسنا، أم القرى، مصر، وغيرها من الطرق المعتمدة.' },
      { q: 'هل يمكنني ضبط التنبيهات قبل الصلاة؟', a: 'نعم، يمكن ضبط تنبيه قبل كل صلاة بعدة دقائق من إعدادات الصلاة.' },
    ],
  },
  {
    category: 'التقنية والخصوصية',
    items: [
      { q: 'هل تُحفظ بياناتي؟', a: 'نحتفظ فقط بالبيانات الضرورية لتشغيل الخدمة. لا نبيع بياناتك لأي طرف ثالث. راجع سياسة الخصوصية.' },
      { q: 'هل الموقع يعمل بدون إنترنت؟', a: 'بعض المحتوى المحفوظ يعمل أوفلاين. الميزة الكاملة قيد التطوير.' },
      { q: 'كيف يمكنني الإبلاغ عن خطأ في المحتوى؟', a: 'تواصل معنا عبر صفحة التواصل مع ذكر القسم والصفحة التي وجدت فيها الخطأ وسنصلحه فوراً.' },
    ],
  },
  {
    category: 'لوحة الإدارة',
    items: [
      { q: 'من يمكنه الوصول للوحة الإدارة؟', a: 'لوحة الإدارة محمية وتتطلب حساباً بصلاحية أدمن. لا يمكن الوصول إليها من المستخدمين العاديين.' },
      { q: 'ماذا يمكنني التحكم فيه من الإدارة؟', a: 'يمكن التحكم في كل شيء: قصص الأنبياء، الغزوات، الفيديوهات، المقالات، القصص، إعدادات الموقع، المستخدمون، وأكثر.' },
      { q: 'كيف أربط فيديو يوتيوب بقصة نبي؟', a: 'اذهب إلى /admin/prophets، اختر النبي، أدخل معرّف الفيديو (الجزء بعد ?v= في رابط يوتيوب)، ثم احفظ.' },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-brand-gold/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-right hover:text-brand-gold transition-colors"
        dir="rtl"
        aria-expanded={open}
      >
        <span className="font-semibold text-brand-cream/90 leading-7">{q}</span>
        <ChevronDown className={`w-5 h-5 text-brand-gold/60 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-8 text-brand-cream/60 pr-2" dir="rtl">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="min-h-screen" dir="rtl">
      <section className="py-16 bg-gradient-to-b from-[#071A13] to-transparent">
        <Container className="max-w-3xl text-center space-y-4">
          <h1 className="text-5xl font-bold text-brand-gold">الأسئلة الشائعة</h1>
          <p className="text-lg text-brand-cream/70">إجابات على أكثر الأسئلة شيوعاً حول منصة ذِكرٌ</p>
        </Container>
      </section>

      <Container className="max-w-3xl py-12 space-y-10">
        {faqs.map((group) => (
          <section key={group.category}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-brand-gold/30" />
              <h2 className="text-xs font-bold text-brand-gold/60 tracking-widest uppercase">{group.category}</h2>
              <div className="flex-1 h-px bg-brand-gold/10" />
            </div>
            <div className="rounded-2xl border border-brand-gold/15 bg-black/20 px-6">
              {group.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-brand-gold">لم تجد إجابتك؟</h2>
          <p className="text-brand-cream/60 text-sm">فريق ذِكرٌ يردّ على استفساراتك خلال 24 ساعة</p>
          <Link href="/contact" className="inline-block rounded-full bg-brand-gold text-black px-8 py-3 font-bold hover:bg-brand-gold/90 transition-colors">
            تواصل معنا مباشرة
          </Link>
        </section>
      </Container>
    </main>
  );
}
