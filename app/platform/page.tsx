import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "كيف تستخدم منصة ذِكرٌ",
  description:
    "دليل شامل لكيفية استخدام جميع أقسام منصة ذِكرٌ — القرآن والأذكار والصلاة وقصص الأنبياء والغزوات وأكثر.",
  path: "/platform",
});

const sections = [
  {
    id: "quran",
    title: "قسم القرآن الكريم",
    icon: "📖",
    href: "/quran",
    steps: [
      "انتقل إلى قسم القرآن من القائمة الرئيسية.",
      "اختر السورة التي تريد قراءتها من القائمة.",
      "استخدم أزرار الحجم لتكبير الخط أو تصغيره.",
      "اضغط على أيقونة الصوت لسماع التلاوة.",
      "أضف آيات إلى مفضلتك بالضغط على القلب.",
    ],
    tip: "يمكنك تصفّح التفسير بالضغط على أي آية.",
  },
  {
    id: "prayer",
    title: "مواقيت الصلاة",
    icon: "🕌",
    href: "/prayer-times",
    steps: [
      "اذهب إلى صفحة مواقيت الصلاة.",
      "اسمح للموقع بالوصول إلى موقعك الجغرافي لأدق النتائج.",
      "أو اكتب اسم مدينتك يدوياً.",
      "ستظهر مواقيت الصلوات الخمس بتوقيت دقيق.",
      "فعّل التنبيهات لتُذكَّر قبل كل صلاة.",
    ],
    tip: "يمكن ضبط طريقة الحساب (MWL، إسنا، أم القرى) من الإعدادات.",
  },
  {
    id: "prophets",
    title: "قصص الأنبياء",
    icon: "📚",
    href: "/prophets",
    steps: [
      "اذهب إلى صفحة قصص الأنبياء.",
      "اختر نبياً من القائمة — 25 نبياً مدعومون.",
      "اقرأ القصة كاملة بالتسلسل الزمني.",
      "شاهد فيديو يوتيوب المرفق إن كان متاحاً.",
      "تأمّل الدروس والعبر في نهاية كل قصة.",
    ],
    tip: "القصص مرتبة بالتسلسل الزمني من آدم حتى محمد ﷺ.",
  },
  {
    id: "battles",
    title: "الغزوات الإسلامية",
    icon: "⚔️",
    href: "/battles",
    steps: [
      "انتقل إلى صفحة الغزوات.",
      "اختر الغزوة التي تريد قراءة تفاصيلها.",
      "ستجد السياق التاريخي والأحداث بالتسلسل.",
      "اطّلع على النصر الإلهي والمعجزات.",
      "اختم بالدروس والعبر المستفادة.",
    ],
    tip: "يمكن مشاهدة فيديو يوتيوب مرفق لكل غزوة.",
  },
  {
    id: "adhkar",
    title: "الأذكار والأدعية",
    icon: "📿",
    href: "/adhkar",
    steps: [
      "اذهب إلى قسم الأذكار من القائمة.",
      "اختر أذكار الصباح أو المساء أو غيرها.",
      "اضغط على الذكر لتسجيله كمكتمل.",
      "يحتسب لك الموقع عدد التسبيحات.",
      "تابع سلسلة الأيام المتواصلة (Streak) لتحفيزك.",
    ],
    tip: "تفعيل الإشعارات يذكّرك بأذكار الصباح عند الفجر والمساء عند العصر.",
  },
  {
    id: "kids",
    title: "قسم الأطفال",
    icon: "👶",
    href: "/kids",
    steps: [
      "انتقل إلى قسم الأطفال من القائمة.",
      "اختر الفئة العمرية المناسبة.",
      "استمتع بالقصص والمحتوى المخصص.",
      "شاهد الفيديوهات التعليمية للأطفال.",
    ],
    tip: "المحتوى مصمّم خصيصاً لكل مرحلة عمرية.",
  },
  {
    id: "search",
    title: "البحث الشامل",
    icon: "🔍",
    href: "/search",
    steps: [
      "استخدم أيقونة البحث في الشريط العلوي.",
      "اكتب كلمة أو عبارة أو رقم آية.",
      "تشمل النتائج: آيات، أحاديث، أدعية، مقالات.",
      "فلتر النتائج حسب النوع.",
    ],
    tip: "يمكن البحث بالعربية أو الإنجليزية.",
  },
  {
    id: "memorization",
    title: "قسم الحفظ",
    icon: "🧠",
    href: "/memorization",
    steps: [
      "اختر خطة حفظ مناسبة لمستواك.",
      "تدرّب يومياً مع أسئلة الاستذكار.",
      "تابع تقدّمك في كل سورة.",
      "احصل على تغذية راجعة فورية.",
    ],
    tip: "الاستمرار يومياً ولو بآية واحدة أفضل من الانقطاع.",
  },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-[#071A13] to-transparent">
        <Container className="max-w-3xl text-center space-y-5">
          <h1 className="text-5xl font-bold text-brand-gold">
            دليل استخدام المنصة
          </h1>
          <p className="text-lg leading-8 text-brand-cream/70">
            كل ما تحتاج معرفته للاستفادة الكاملة من منصة ذِكرٌ — من القرآن إلى
            الغزوات إلى الأطفال وكل شيء بينهما.
          </p>
        </Container>
      </section>

      <Container className="max-w-5xl py-12 space-y-8">
        {/* Quick nav */}
        <section className="flex flex-wrap gap-3 justify-center">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-brand-gold/20 px-4 py-1.5 text-sm text-brand-gold/70 hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
            >
              {s.icon} {s.title}
            </a>
          ))}
        </section>

        {/* Section cards */}
        <div className="space-y-6">
          {sections.map(s => (
            <Card key={s.id} id={s.id} className="p-8 space-y-5 scroll-mt-20">
              <div className="flex items-start gap-4">
                <div className="text-4xl shrink-0" aria-hidden>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-2xl font-bold text-brand-gold">
                      {s.title}
                    </h2>
                    <Link
                      href={s.href}
                      className="text-sm rounded-full border border-brand-gold/30 px-4 py-1.5 text-brand-gold hover:bg-brand-gold/10 transition-colors"
                    >
                      فتح القسم ←
                    </Link>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {s.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="w-6 h-6 shrink-0 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-xs text-brand-gold flex items-center justify-center font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-sm leading-7 text-brand-cream/70">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 text-sm text-brand-gold/80">
                    <span className="font-bold">نصيحة:</span> {s.tip}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Official Android app */}
        <section
          className="rounded-2xl border border-brand-gold/20 bg-brand-emerald/10 p-8 text-center space-y-4"
          aria-labelledby="android-download-title"
        >
          <h2
            id="android-download-title"
            className="text-2xl font-bold text-brand-gold"
          >
            تطبيق ذِكرٌ لنظام Android
          </h2>
          <p className="text-brand-cream/70 leading-7">
            حمّل الإصدار الرسمي من مستودع ZIKR الموثوق على GitHub. افحص قيمة
            SHA-256 المنشورة مع كل إصدار قبل التثبيت.
          </p>
          <a
            href="/api/download/android"
            className="inline-flex items-center justify-center rounded-full bg-brand-gold px-8 py-3 font-bold text-black hover:bg-brand-gold/90 transition-colors"
            target="_blank"
            rel="noreferrer noopener"
          >
            تنزيل أحدث APK الرسمي
          </a>
          <p className="text-xs text-brand-cream/50">
            لا تثبّت ملفات APK من روابط غير رسمية. قد يطلب Android السماح
            بالتثبيت من هذا المصدر.
          </p>
        </section>

        {/* Support CTA */}
        <section className="rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-black/30 to-brand-emerald/10 p-10 text-center space-y-5">
          <h2 className="text-2xl font-bold text-brand-gold">
            هل تحتاج مساعدة إضافية؟
          </h2>
          <p className="text-brand-cream/60">فريق ذِكرٌ دائماً هنا لمساعدتك</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-full bg-brand-gold text-black px-8 py-3 font-bold hover:bg-brand-gold/90 transition-colors"
            >
              تواصل معنا
            </Link>
            <Link
              href="/faq"
              className="rounded-full border border-brand-gold/30 px-8 py-3 text-brand-gold hover:bg-brand-gold/10 transition-colors"
            >
              الأسئلة الشائعة
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
