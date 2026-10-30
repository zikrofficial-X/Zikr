import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/lib/site";
import AndroidReleaseCard from "@/components/platform/android-release-card";
import { BookOpen, Clock3, BookMarked, Shield, MoonStar, Users, Search, Brain } from "lucide-react";

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
    icon: BookOpen,
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
    icon: Clock3,
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
    icon: BookMarked,
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
    icon: Shield,
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
    icon: MoonStar,
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
    icon: Users,
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
    icon: Search,
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
    icon: Brain,
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-gold">
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
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold/75 transition-colors hover:border-brand-gold/40 hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {section.title}
              </a>
            );
          })}
        </section>

        {/* Section cards */}
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
            <Card key={section.id} id={section.id} className="scroll-mt-24 space-y-5 p-5 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-gold/20 bg-brand-gold/5 text-brand-gold" aria-hidden="true">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-2xl font-bold text-brand-gold">
                      {section.title}
                    </h2>
                    <Link
                      href={section.href}
                      className="text-sm rounded-full border border-brand-gold/30 px-4 py-1.5 text-brand-gold hover:bg-brand-gold/10 transition-colors"
                    >
                      فتح القسم ←
                    </Link>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {section.steps.map((step, idx) => (
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
                    <span className="font-bold">نصيحة:</span> {section.tip}
                  </div>
                </div>
              </div>
            </Card>
            );
          })}
        </div>

        <AndroidReleaseCard />

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
