import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "عن منصة ذِكرٌ",
  description:
    "تعرّف على رسالة منصة ذِكرٌ ورؤيتها وفريقها في تقديم أفضل تجربة روحانية رقمية إسلامية.",
  path: "/about",
});

const features = [
  { icon: "📖", title: "القرآن الكريم", desc: "تصفّح القرآن بخطوط عربية جميلة مع التفسير والتلاوة من أشهر القراء." },
  { icon: "📿", title: "الأذكار والأدعية", desc: "أذكار الصباح والمساء وأدعية المناسبات منظّمة بشكل سهل." },
  { icon: "🕌", title: "مواقيت الصلاة", desc: "توقيت دقيق لكل صلاة بناء على موقعك الجغرافي." },
  { icon: "📚", title: "قصص الأنبياء", desc: "فهرس الأنبياء المذكورين في القرآن مع فصول قصصية وروابط الآيات والمراجع." },
  { icon: "⚔️", title: "الغزوات الإسلامية", desc: "أحداث الغزوات مع التفريق بين النص القرآني والرواية التاريخية والمعلومة التقريبية." },
  { icon: "🎥", title: "فيديوهات تعليمية", desc: "مقاطع يوتيوب مرتبطة بكل قصة ونبي لمزيد من الفهم." },
  { icon: "📰", title: "المقالات", desc: "مقالات تعليمية تحريرية تُعرض مع مصادرها، مع التنبيه إلى أن المقالات العامة لا تستبدل سؤال أهل العلم في الفتوى." },
  { icon: "👶", title: "قسم الأطفال", desc: "قصص وألعاب ومحتوى تعليمي مخصص لأبنائنا الصغار." },
];

const stats = [
  { num: "25", label: "نبي مذكور في القرآن" },
  { num: "30+", label: "غزوة وفتح إسلامي" },
  { num: "6236", label: "آية قرآنية" },
  { num: "100+", label: "دعاء مأثور" },
];

const team = [
  { name: "فريق المحتوى", role: "تحرير وتنظيم المحتوى مع توثيق المصدر وإتاحة التصحيح", icon: "📝" },
  { name: "فريق التقنية", role: "تطوير أدوات قراءة ووصول آمنة وسهلة", icon: "💻" },
  { name: "فريق التصميم", role: "تجربة عربية واضحة تراعي RTL وإتاحة الاستخدام", icon: "🎨" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen" dir="rtl">
      <section className="relative py-20 bg-gradient-to-b from-[#071A13] via-[#0A2A1E] to-transparent overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
          <div className="absolute top-8 right-16 text-6xl text-brand-gold/30 font-arabic">ذِكرٌ</div>
          <div className="absolute bottom-8 left-16 text-4xl text-brand-gold/20 font-arabic">﴿وَذَكِّرْ﴾</div>
        </div>
        <Container className="max-w-4xl text-center space-y-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-brand-gold leading-tight">عن منصة <span className="font-arabic">ذِكرٌ</span></h1>
          <p className="text-xl leading-9 text-brand-cream/80 max-w-2xl mx-auto">منصة روحانية رقمية عربية تجمع القرآن والحديث والقصص والعلم في تجربة حديثة وسهلة الوصول — للفرد والأسرة والناشئة.</p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/quran" className="rounded-full border border-brand-gold/40 bg-brand-gold/10 px-6 py-2.5 text-brand-gold hover:bg-brand-gold/20 transition-colors text-sm font-semibold">تصفّح القرآن</Link>
            <Link href="/prophets" className="rounded-full border border-brand-gold/20 px-6 py-2.5 text-brand-cream/70 hover:text-brand-gold hover:border-brand-gold/40 transition-colors text-sm">قصص الأنبياء</Link>
          </div>
        </Container>
      </section>

      <Container className="max-w-5xl space-y-16 py-16">
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="rounded-2xl border border-brand-gold/15 bg-black/20 p-6 text-center space-y-2 hover:border-brand-gold/30 transition-colors">
                <p className="text-4xl font-bold text-brand-gold">{s.num}</p>
                <p className="text-sm text-brand-cream/55">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-brand-gold">رسالتنا</h2>
            <p className="leading-9 text-brand-cream/75">نؤمن بأن الوصول إلى المعرفة الإسلامية الموثوقة حق لكل مسلم في كل مكان. نبني منصة تجمع أفضل ما أُنتج من محتوى إسلامي وتقدّمه بتجربة رقمية عصرية تناسب المسلم المعاصر في زمن الشاشات والإنترنت.</p>
            <p className="leading-9 text-brand-cream/75">هدفنا ليس فقط توفير المعلومة، بل بناء رفيق روحاني يومي يساعدك على التذكر والتدبر والنمو في إيمانك.</p>
          </div>
          <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-4">
            <p className="text-2xl font-arabic leading-loose text-brand-cream" dir="rtl">﴿ وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ ﴾</p>
            <p className="text-sm text-brand-gold/60">سورة الذاريات — الآية 55</p>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-gold/25 bg-brand-gold/5 p-8 md:p-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-16 h-16 rounded-full border border-brand-gold/40 bg-brand-gold/10 flex items-center justify-center text-2xl font-bold text-brand-gold" aria-hidden>م ع</div>
            <div>
              <p className="text-sm text-brand-gold/70 mb-1">عن المؤسس</p>
              <h2 className="text-3xl font-bold text-brand-gold">محمد علاء</h2>
            </div>
          </div>
          <p className="leading-9 text-brand-cream/75">أُسست منصة ذِكرٌ على يد <strong className="text-brand-cream">محمد علاء</strong> بهدف تقديم مكتبة إسلامية رقمية عربية تجمع القرآن الكريم والحديث والسيرة والقصص النافعة في مكان واحد، مع عناية خاصة بسهولة الاستخدام ووضوح المصادر واحترام خصوصية الزائر.</p>
          <p className="leading-9 text-brand-cream/65 text-sm">المحتوى التحريري التعليمي في المنصة يُراجع ويُنظم داخليًا، أما النصوص التراثية والبيانات المفتوحة فتُعرض مع الإشارة إلى مصادرها وتراخيصها، لتبقى المنصة مساحة معرفة نافعة ومسؤولة.</p>
          <div className="flex flex-col gap-3 rounded-xl border border-brand-gold/15 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-gold">محمد علاء</p>
              <p className="mt-1 text-sm leading-7 text-brand-cream/65">طالب بكلية الأعمال، جامعة الإسكندرية — قسم إدارة الأعمال. أساهم في تطوير ذِكر رغبةً في نشر العلم النافع وخدمة الناس في أمور دينهم ودنياهم.</p>
            </div>
            <Link href="https://www.linkedin.com/in/muhammed-alaa-0169b3385" target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-brand-gold/30 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/10">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> LinkedIn
            </Link>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-brand-gold text-center">ما الذي تقدّمه المنصة؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <Card key={f.title} className="p-6 space-y-3 hover:border-brand-gold/30 transition-colors group">
                <div className="text-3xl" aria-hidden>{f.icon}</div>
                <h3 className="font-bold text-brand-gold group-hover:text-brand-goldSoft transition-colors">{f.title}</h3>
                <p className="text-sm leading-7 text-brand-cream/55">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4 p-7">
            <h2 className="text-2xl font-bold text-brand-gold">كيف نعتني بالمحتوى؟</h2>
            <p className="leading-8 text-brand-cream/70">نبدأ بتحديد نوع المادة: نص منقول، بيانات مفتوحة، شرح تعليمي، أو أداة تفاعلية. ثم نعرض لكل نوع سياقه المناسب بدل خلط الاقتباس بالرأي التحريري. عندما يكون للمادة مصدر واضح نذكره، وعندما تكون الصفحة تجربة تقنية نوضح حدود النتائج وإمكانية اختلافها بحسب الجهاز والموقع والإعدادات.</p>
            <p className="leading-8 text-brand-cream/70">لا نملأ الصفحات بتكرار أو نصوص مصطنعة لمجرد زيادة عدد الكلمات. القيمة عندنا هي أن يجد الزائر جوابًا واضحًا، رابطًا مفيدًا، وطريقة عملية لاستخدام الميزة مع احترام حقوق المؤلف والخصوصية.</p>
          </Card>
          <Card className="space-y-4 p-7">
            <h2 className="text-2xl font-bold text-brand-gold">كيف تستفيد من ذِكرٌ؟</h2>
            <p className="leading-8 text-brand-cream/70">يمكنك قراءة القرآن والاستماع إليه، تنظيم الأذكار، مراجعة مواقيت الصلاة والقبلة، متابعة القصص والمقالات، أو استخدام القسم المخصص للصغار مع إشراف الأسرة. الحساب اختياري لمعظم القراءة العامة، ويُستخدم فقط عند الحاجة إلى مزامنة المفضلة أو التقدم.</p>
            <p className="leading-8 text-brand-cream/70">لأفضل تجربة، اختر مدينتك، راجع إعدادات اللغة والصوت، واستخدم صفحة التواصل للإبلاغ عن خطأ مع ذكر الرابط وموضع المشكلة. الآراء التعليمية العامة لا تستبدل الفتوى أو الاستشارة المتخصصة.</p>
          </Card>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-brand-gold text-center">من نحن</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map(t => (
              <Card key={t.name} className="p-6 text-center space-y-3">
                <div className="text-4xl mx-auto" aria-hidden>{t.icon}</div>
                <h3 className="font-bold text-brand-gold">{t.name}</h3>
                <p className="text-sm leading-7 text-brand-cream/55">{t.role}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-black/30 to-brand-emerald/10 p-10 space-y-6">
          <h2 className="text-3xl font-bold text-brand-gold">رؤيتنا المستقبلية</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-brand-cream">متاح الآن وما بعده</h3>
              <ul className="space-y-2 text-sm text-brand-cream/60 list-inside">
                <li className="flex items-start gap-2"><span className="text-brand-gold mt-0.5">◆</span> تطبيق Android — الإصدار 1.3.1 متاح حاليًا</li>
                <li className="flex items-start gap-2"><span className="text-brand-gold mt-0.5">◆</span> تطبيق iOS — ضمن خطط التطوير القادمة</li>
                <li className="flex items-start gap-2"><span className="text-brand-gold mt-0.5">◆</span> مزامنة التقدم بين الأجهزة وخطط حفظ مخصصة بالذكاء الاصطناعي</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-brand-cream">هدفنا البعيد</h3>
              <ul className="space-y-2 text-sm text-brand-cream/60 list-inside">
                <li className="flex items-start gap-2"><span className="text-brand-gold mt-0.5">◆</span> توسيع المحتوى التعليمي بعد مراجعته وتوثيق مصادره</li>
                <li className="flex items-start gap-2"><span className="text-brand-gold mt-0.5">◆</span> تحسين الوصول ودعم لغات واحتياجات استخدام إضافية تدريجيًا</li>
                <li className="flex items-start gap-2"><span className="text-brand-gold mt-0.5">◆</span> بناء أدوات تعلم رقمية مسؤولة لا تقدم نفسها بديلًا عن أهل العلم</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-brand-gold">انضم إلى مجتمع ذِكرٌ</h2>
          <p className="text-brand-cream/60">شارك المنصة مع أهلك وأصدقائك لتعمّ الفائدة</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="rounded-full bg-brand-gold text-black px-8 py-3 font-bold hover:bg-brand-gold/90 transition-colors">تواصل معنا</Link>
            <Link href="/platform" className="rounded-full border border-brand-gold/30 px-8 py-3 text-brand-gold hover:bg-brand-gold/10 transition-colors">كيف تستخدم المنصة</Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
