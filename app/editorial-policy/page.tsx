import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "معايير التحرير والمصادر",
  description:
    "منهج منصة ذِكرٌ في اختيار المحتوى الإسلامي، عرض المصادر، تصحيح الأخطاء، والتمييز بين التعليم العام والفتوى.",
  path: "/editorial-policy",
});

export default function EditorialPolicyPage() {
  return (
    <Container className="max-w-4xl space-y-8 py-12" dir="rtl">
      <header className="space-y-4 text-center">
        <p className="text-sm font-semibold text-brand-gold/80">
          الشفافية أولاً
        </p>
        <h1 className="text-4xl font-bold text-brand-gold">
          معايير التحرير والمصادر
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-9 text-brand-cream/75">
          نوضح هنا كيف نختار المادة المنشورة في ذِكرٌ، وكيف نفرق بين النص
          المنقول والشرح التعليمي، وكيف يمكن للزائر الإبلاغ عن خطأ أو مصدر غير
          دقيق.
        </p>
      </header>

      <Card className="space-y-4 leading-9">
        <h2 className="text-2xl font-bold text-brand-gold">ما الذي نقدمه؟</h2>
        <p className="text-brand-cream/75">
          تقدم المنصة أدوات قراءة واستماع وتنظيم للقرآن والأذكار والأدعية
          والحديث، إلى جانب مقالات تعليمية عامة. نعرض المادة كما هي من مصدرها
          عندما تكون منقولة، ونفصل بينها وبين الشرح أو الإرشادات العملية التي
          يكتبها فريق التحرير.
        </p>
        <p className="text-brand-cream/75">
          المقالات التعليمية ليست فتاوى شخصية ولا بديلاً عن سؤال أهل العلم. لا
          ننسب قولاً إلى القرآن أو السنة أو عالم بعينه من دون مصدر يمكن للقارئ
          الرجوع إليه، ونحذف الادعاءات التي لا نستطيع توثيقها بدلاً من ملء
          الصفحة بمعلومات غير مؤكدة.
        </p>
      </Card>

      <Card className="space-y-4 leading-9">
        <h2 className="text-2xl font-bold text-brand-gold">الأصالة والمراجعة البشرية</h2>
        <p className="text-brand-cream/75">
          نكتب الأدلة والمقالات لتخدم قارئاً حقيقياً يحتاج إلى فهم وتطبيق، لا
          لمجرد زيادة عدد الصفحات. نراجع المادة لغوياً وتحريرياً، ونميز بين
          النص المنقول والشرح الذي يكتبه فريق المنصة. قد نستخدم أدوات تقنية
          للمساعدة في الفهرسة أو المسودة، لكن لا ننشر نصاً دينياً أو نسبة علمية
          دون مراجعة بشرية ومصدر قابل للتحقق. إذا لم تكتمل المادة أو تعذر إثبات
          معلومة، نؤجل نشرها بدلاً من ملء الصفحة بتكرار أو ادعاء.
        </p>
        <p className="text-brand-cream/75">
          لا يوجد حد مضمون لعدد الكلمات أو الصفحات يضمن قبول الإعلانات. معيارنا
          هو الفائدة والوضوح والدقة وتجربة القراءة، مع تحديث المصادر عند تغيرها
          وإخفاء الصفحات الناقصة من الفهرسة العامة حتى تكتمل مراجعتها.
        </p>
      </Card>

      <Card className="space-y-4 leading-9">
        <h2 className="text-2xl font-bold text-brand-gold">كيف نكتب مادة نافعة؟</h2>
        <p className="text-brand-cream/75">نبدأ من سؤال واضح يهم القارئ، ثم نرتب الإجابة من التعريف إلى السياق ثم الخطوة العملية. نستخدم عناوين وفقرات قصيرة وروابط داخلية تساعد على الانتقال بين القرآن والأذكار والقصص والمقالات، ونبتعد عن العناوين المبالغ فيها أو الوعود التي لا يمكن قياسها.</p>
        <p className="text-brand-cream/75">عند وجود اختلاف في العرض أو المصطلح، نوضح طبيعة الاختلاف بدل إخفائه. وعند تعذر التحقق من معلومة، نذكر حدودها أو نحذفها. هذه المنهجية تحمي القارئ من الخلط بين التعليم العام والحكم الشرعي الملزم، وتحافظ على تجربة قراءة صادقة.</p>
      </Card>

      <Card className="space-y-4 leading-9">
        <h2 className="text-2xl font-bold text-brand-gold">طريقة التوثيق</h2>
        <ol className="list-decimal space-y-3 pe-6 text-brand-cream/75">
          <li>
            نحافظ على النص الأصلي في موضعه ولا نخلط بين الاقتباس والتفسير.
          </li>
          <li>
            نذكر اسم المصدر أو الكتاب أو الجهة عند توفره، ونضع رابطاً مباشراً
            للمصدر في المقالات التي تحتوي على مراجع.
          </li>
          <li>
            نوضح عندما تكون المعلومة تاريخية أو تعليمية عامة، ولا نقدمها على
            أنها حكم شرعي ملزم.
          </li>
          <li>
            نراجع الروابط والبيانات المنشورة دورياً، ونضع المادة قيد المراجعة
            عندما يكون النص ناقصاً أو المصدر غير كافٍ.
          </li>
        </ol>
      </Card>

      <Card className="space-y-4 leading-9">
        <h2 className="text-2xl font-bold text-brand-gold">
          التصحيح وحقوق النشر
        </h2>
        <p className="text-brand-cream/75">
          إذا وجدت خطأ في نص أو نسبة أو رابط أو لاحظت مادة لا تحترم حقوق النشر،
          أرسل عنوان الصفحة وموضع المشكلة ومرجع التصحيح عبر{" "}
          <Link href="/contact" className="text-brand-gold underline">
            صفحة التواصل
          </Link>
          . نتحقق من البلاغ ونصحح المادة أو نخفيها عند الحاجة، ولا نعتبر كثرة
          الصفحات أهم من دقة المعلومة.
        </p>
      </Card>

      <Card className="space-y-4 leading-9">
        <h2 className="text-2xl font-bold text-brand-gold">
          الخصوصية والإعلانات
        </h2>
        <p className="text-brand-cream/75">
          أي إعلانات أو أدوات قياس مستقبلية تخضع لسياسة الخصوصية وإعدادات
          الموافقة المتاحة للزائر. راجع{" "}
          <Link href="/privacy" className="text-brand-gold underline">
            سياسة الخصوصية
          </Link>{" "}
          و
          <Link href="/terms" className="text-brand-gold underline">
            الشروط والأحكام
          </Link>{" "}
          لمعرفة كيفية التعامل مع البيانات وخدمات الطرف الثالث.
        </p>
      </Card>

      <p className="text-center text-sm leading-7 text-brand-cream/55">
        آخر تحديث: 5 سبتمبر 2026 — منصة ذِكرٌ
      </p>
    </Container>
  );
}
