import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = pageMetadata({
  title: "سياسة الخصوصية",
  description:
    "سياسة خصوصية منصة ZIKR وبيان التعامل مع البيانات والحسابات والكوكيز والإعلانات وخدمات الطرف الثالث.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container className="max-w-4xl space-y-8 py-12" dir="rtl">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-brand-gold">سياسة الخصوصية</h1>
        <p className="arabic-muted">آخر تحديث: 5 سبتمبر 2026</p>
      </section>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">البيانات التي قد نعالجها</h2>
        <p className="arabic-muted">
          قد تستخدم المنصة بيانات الحساب الأساسية مثل البريد الإلكتروني ومعرّف المستخدم لتفعيل تسجيل الدخول والمفضلة وميزات المتابعة. لا ينبغي إدخال كلمات مرور أو بيانات مالية أو صحية أو أي معلومات حساسة في حقول البحث أو المحتوى العام.
        </p>
        <p className="arabic-muted">
          قد تُعالج بيانات تقنية محدودة مثل نوع المتصفح والصفحات التي تفتحها وأحداث الأداء والأخطاء لتشغيل الموقع وتحسينه. يستخدم نموذج التواصل البيانات التي ترسلها للرد على رسالتك ومراجعة البلاغ. لا نبيع هذه البيانات كمنتج إعلاني.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">ملفات تعريف الارتباط والجلسات</h2>
        <p className="arabic-muted">
          تستخدم المنصة ملفات ارتباط وتقنيات تخزين ضرورية لإدارة جلسات تسجيل الدخول وحماية الصفحات الخاصة وحفظ بعض تفضيلات الاستخدام. قد تعتمد بعض الوظائف على خدمات خارجية مثل Supabase وYouTube ومزودي الصوت أو الذكاء الاصطناعي عند تفعيلها.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">الإعلانات وخدمات Google والطرف الثالث</h2>
        <p className="arabic-muted">
          قد تعرض المنصة إعلانات عبر Google AdSense أو مزودين آخرين بعد تفعيل الإعلانات ومراجعة الموقع. قد تستخدم هذه الخدمات ملفات تعريف ارتباط وتقنيات مشابهة لمعالجة بيانات مرتبطة بالإعلان والقياس وفق إعدادات الخصوصية والموافقة المعمول بها.
        </p>
        <p className="arabic-muted">
          في المناطق التي تتطلب موافقة على استخدام الكوكيز أو البيانات لأغراض الإعلانات، نستخدم آلية موافقة مناسبة وفق إعدادات Google والسياسات المطبقة. يستطيع المستخدم تعديل اختيارات الخصوصية عبر رسالة الموافقة أو إعدادات الخصوصية المتاحة على الموقع، وقد يؤدي رفض بعض أنواع التخزين إلى تعطيل وظائف غير أساسية.
        </p>
        <p className="arabic-muted">
          يمكن للمستخدم مراجعة معلومات Google المتعلقة باستخدام البيانات في الإعلانات من خلال صفحة مسؤولية بيانات الأعمال، كما يمكنه إدارة تفضيلات الإعلانات من حساب Google أو الأدوات التي توفرها Google. لمزيد من التفاصيل عن متطلبات الموافقة الأوروبية، يُرجى مراجعة صفحة الرسائل الأوروبية في حساب الناشر.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">خصوصية الأطفال</h2>
        <p className="arabic-muted">
          قسم الأطفال مخصص للمحتوى التعليمي ولا نطلب من الأطفال إنشاء حساب أو إدخال بيانات شخصية للوصول إلى المحتوى العام. ينبغي للوالدين أو الأوصياء متابعة استخدام الطفل للإنترنت والأدوات الرقمية، خصوصاً عند الانتقال إلى خدمات خارجية مثل YouTube.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">حقوق المستخدم وطلبات البيانات</h2>
        <p className="arabic-muted">
          يمكنك تسجيل الخروج في أي وقت. لطلب الوصول إلى بيانات حسابك أو تصحيحها أو حذفها، أرسل البريد المستخدم في الحساب ووصف الطلب إلى
          <a href="mailto:zikrmediaofficial@gmail.com" className="mx-1 text-brand-gold underline">
            zikrmediaofficial@gmail.com
          </a>
          . قد نطلب التحقق من ملكية الحساب قبل تنفيذ الطلب، ونحتفظ بالسجلات التي يلزم الاحتفاظ بها لأسباب أمنية أو قانونية فقط.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">تحديثات السياسة</h2>
        <p className="arabic-muted">
          قد تتغير هذه السياسة عند إضافة ميزات أو خدمات خارجية أو متطلبات قانونية جديدة. يظهر تاريخ آخر تحديث في أعلى الصفحة، وسنحاول توضيح التغييرات المهمة بلغة واضحة. هذه السياسة تصف ممارسات المنصة بصورة عامة ولا تُغني عن مراجعة شروط مزودي الخدمات الخارجية.
        </p>
      </Card>
    </Container>
  );
}
