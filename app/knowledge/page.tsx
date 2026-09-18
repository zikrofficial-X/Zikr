import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, Compass, ExternalLink, FileSearch, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "مركز المعرفة والمنهجية",
  description: "دليل عملي لفهم محتوى منصة ذِكر ومصادره وطريقة استخدامه والتحقق منه.",
  path: "/knowledge",
});

const principles = [
  { icon: FileSearch, title: "نبدأ من سؤال القارئ", text: "كل مادة تحريرية في ذِكر يجب أن تجيب عن حاجة واضحة: فهم معنى، الوصول إلى مصدر، أو تحويل المعرفة إلى ممارسة. لا ننشر صفحة لمجرد ملء مساحة أو تكرار عنوان بصيغ مختلفة." },
  { icon: ShieldCheck, title: "نفصل بين النص والشرح", text: "عند عرض آية أو حديث أو معلومة تاريخية نوضح ما هو نص منقول وما هو شرح تحريري. هذا الفصل يساعد القارئ على الرجوع إلى المصدر وعدم الخلط بين الاقتباس والرأي التعليمي." },
  { icon: CheckCircle2, title: "نراجع قبل الإتاحة العامة", text: "المادة الناقصة أو التي لا تحتوي على سياق كافٍ أو مراجع قابلة للفتح لا تُعامل كصفحة مكتملة. قد تظهر بعض البيانات داخل أدوات التطبيق، لكنها لا تُقدَّم كإجابة تحريرية نهائية." },
];

const journeys = [
  { title: "قراءة متدرجة في القرآن", text: "ابدأ من المصحف، ثم افتح التفسير أو صفحة السورة، وبعدها دوّن ما تريد مراجعته في الورد أو المفضلة.", href: "/quran", label: "افتح القرآن" },
  { title: "فهم القصة من مصدرها", text: "اقرأ القصة كاملة، راجع إحالاتها الأصلية، ثم استخدم المقالات المرتبطة لفهم الدروس دون اقتطاع العبرة من سياقها.", href: "/stories", label: "اذهب إلى القصص" },
  { title: "ممارسة يومية قابلة للاستمرار", text: "اختر أذكارًا أو دعاءً مناسبًا لوقتك، واستخدم التذكير باعتدال. الهدف هو الاستمرار والفهم، لا جمع أكبر عدد من العناصر.", href: "/adhkar", label: "افتح الأذكار" },
];

const faqs = [
  ["هل كثرة الكلمات وحدها تجعل الصفحة جيدة؟", "لا. القيمة تتعلق بوضوح الإجابة، أصالتها، سياقها، وسهولة التحقق منها. لذلك نفضّل مادة مركزة موثقة على نص طويل مكرر."],
  ["كيف أبلغ عن خطأ في نص أو مصدر؟", "استخدم صفحة التواصل وأرسل رابط الصفحة وموضع الخطأ كما يظهر لك. البلاغ المحدد يساعد فريق المراجعة على الوصول إلى المشكلة وتصحيحها بسرعة."],
  ["هل المقالات فتوى أو استشارة شخصية؟", "لا. المقالات مواد تعليمية عامة. المسائل الخاصة أو المختلف فيها تحتاج سؤال أهل العلم الموثوقين مع عرض تفاصيل الحالة كاملة."],
];

export default function KnowledgePage() {
  return (
    <main className="min-h-screen bg-brand-emeraldDeep text-brand-cream" dir="rtl">
      <Container className="space-y-14 py-12 sm:py-16">
        <header className="mx-auto max-w-4xl space-y-5 text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-brand-gold/70">دليل القراءة والتحقق</p>
          <h1 className="text-4xl font-bold leading-tight text-brand-gold sm:text-5xl">مركز المعرفة والمنهجية</h1>
          <p className="text-lg leading-9 text-brand-cream/75">هذا المركز يشرح ماذا ستجد في ذِكر، وكيف نختار المادة التحريرية، وكيف تنتقل من القراءة إلى المصدر ثم إلى التطبيق. الغرض منه أن تحصل على تجربة واضحة يمكن الوثوق بحدودها، لا أن نعدك بإجابة عن كل مسألة.</p>
        </header>

        <section className="grid gap-5 md:grid-cols-3" aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="sr-only">مبادئ المحتوى</h2>
          {principles.map(({ icon: Icon, title, text }) => <Card key={title} className="space-y-4 border-brand-gold/15 bg-black/20 p-7"><Icon className="h-8 w-8 text-brand-gold" aria-hidden="true" /><h3 className="text-xl font-bold text-brand-gold">{title}</h3><p className="leading-8 text-brand-cream/70">{text}</p></Card>)}
        </section>

        <section className="rounded-3xl border border-brand-gold/20 bg-brand-gold/5 p-7 sm:p-10" aria-labelledby="method-heading">
          <div className="flex items-start gap-4"><BookOpen className="mt-1 h-8 w-8 shrink-0 text-brand-gold" aria-hidden="true" /><div className="space-y-5"><h2 id="method-heading" className="text-3xl font-bold text-brand-gold">كيف تُبنى المادة التحريرية؟</h2><p className="leading-9 text-brand-cream/75">تمر المادة الجيدة بأربع مراحل مترابطة. نحدد أولًا السؤال الذي يريد الزائر الإجابة عنه، ثم نجمع المراجع الأولية أو المؤسسية المناسبة للموضوع. بعد ذلك نكتب شرحًا مستقلًا يضيف سياقًا عمليًا بدل إعادة صياغة العنوان. وأخيرًا نراجع اللغة والروابط ونوضح أي حد أو اختلاف يحتاج إلى تنبيه.</p><p className="leading-9 text-brand-cream/75">لا يعني وجود رابط أن كل ما في الصفحة اقتباس حرفي من المصدر. المراجع هي نقاط تحقق للقارئ، بينما يبقى الشرح منسوبًا إلى فريق التحرير. وإذا كانت المادة غير مكتملة أو تحتاج مراجعة متخصصة، نؤجل إتاحتها في المسارات العامة بدل تقديمها كحقيقة نهائية.</p><div className="flex flex-wrap gap-3 pt-2"><Link href="/editorial-policy" className="rounded-xl bg-brand-gold px-5 py-3 font-bold text-brand-emeraldDeep transition hover:bg-brand-goldSoft">اقرأ سياسة التحرير</Link><a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-brand-gold/25 px-5 py-3 text-brand-cream/80 transition hover:border-brand-gold hover:text-brand-gold">إرشادات المحتوى المفيد <ExternalLink className="h-4 w-4" aria-hidden="true" /></a></div></div></div>
        </section>

        <section className="space-y-6" aria-labelledby="journeys-heading"><div><p className="text-sm text-brand-gold/65">اقتراحات عملية</p><h2 id="journeys-heading" className="mt-2 text-3xl font-bold text-brand-gold">اختر مسارًا يناسب هدفك</h2></div><div className="grid gap-5 md:grid-cols-3">{journeys.map((journey) => <Card key={journey.href} className="flex flex-col gap-4 border-brand-gold/15 bg-black/15 p-6"><Compass className="h-7 w-7 text-brand-gold" aria-hidden="true" /><h3 className="text-xl font-bold text-brand-gold">{journey.title}</h3><p className="flex-1 leading-8 text-brand-cream/65">{journey.text}</p><Link href={journey.href} className="text-sm font-bold text-brand-gold hover:text-brand-goldSoft">{journey.label} ←</Link></Card>)}</div></section>

        <section className="space-y-6" aria-labelledby="faq-heading"><h2 id="faq-heading" className="text-3xl font-bold text-brand-gold">أسئلة عن جودة المحتوى</h2><div className="space-y-4">{faqs.map(([question, answer]) => <details key={question} className="rounded-2xl border border-brand-gold/15 bg-black/15 p-5"><summary className="cursor-pointer text-lg font-bold text-brand-gold">{question}</summary><p className="mt-4 leading-8 text-brand-cream/70">{answer}</p></details>)}</div></section>

        <footer className="border-t border-brand-gold/15 pt-8 text-center text-sm leading-8 text-brand-cream/55">لمراجعة سياسة الخصوصية أو إرسال تصحيح، انتقل إلى <Link href="/privacy" className="text-brand-gold underline">الخصوصية</Link> أو <Link href="/contact" className="text-brand-gold underline">التواصل</Link>. هذه الصفحة تعريفية ولا تستبدل الرجوع إلى النصوص الأصلية أو سؤال أهل العلم.</footer>
      </Container>
    </main>
  );
}
