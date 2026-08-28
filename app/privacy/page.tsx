import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = pageMetadata({
  title: "سياسة الخصوصية",
  description:
    "سياسة خصوصية منصة ZIKR وبيان التعامل مع البيانات والحسابات والتكاملات الخارجية.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container className="max-w-4xl space-y-8 py-12">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-brand-gold">سياسة الخصوصية</h1>
        <p className="arabic-muted">آخر تحديث: 15 أغسطس 2026</p>
      </section>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">
          البيانات التي قد نعالجها
        </h2>
        <p className="arabic-muted">
          قد تستخدم المنصة بيانات الحساب الأساسية مثل البريد الإلكتروني ومعرّف
          المستخدم لتفعيل تسجيل الدخول والمفضلة وميزات المتابعة. لا ينبغي إدخال
          بيانات حساسة في حقول عامة أو في البحث.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">
          ملفات تعريف الارتباط والجلسات
        </h2>
        <p className="arabic-muted">
          تستخدم المنصة ملفات ارتباط ضرورية لإدارة جلسات الدخول وحماية الصفحات
          الخاصة. قد تعتمد بعض الميزات على خدمات خارجية مثل Supabase أو YouTube
          أو خدمات ذكاء اصطناعي عند تفعيلها.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">
          الإعلانات وشركاء الطرف الثالث
        </h2>
        <p className="arabic-muted">
          قد تعرض المنصة إعلانات مقدمة من Google AdSense أو شركاء إعلانيين
          آخرين. يستخدم موردو الطرف الثالث، بما في ذلك Google، ملفات تعريف
          الارتباط لعرض الإعلانات بناءً على زياراتك السابقة لهذا الموقع أو
          لمواقع أخرى على الإنترنت.
        </p>
        <p className="arabic-muted">
          يتيح استخدام Google لملفات تعريف الارتباط الإعلانية (DART cookies)
          لها ولشركائها عرض إعلانات لمستخدمينا استناداً إلى زيارتهم لموقعنا و/أو
          مواقع أخرى على الإنترنت. يمكنك إلغاء الاشتراك في الإعلانات
          المخصصة من خلال زيارة{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-gold underline"
          >
            إعدادات إعلانات Google
          </a>
          {" "}أو من خلال{" "}
          <a
            href="https://optout.aboutads.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-gold underline"
          >
            صفحة الاختيار من الإعلانات المخصصة
          </a>
          .
        </p>
        <p className="arabic-muted">
          عند تفعيل رسالة الموافقة من حساب الناشر، قد يعرض الموقع نظام Google
          Funding Choices لتمكين المستخدمين من مراجعة خيارات الخصوصية والموافقة
          على استخدام البيانات الإعلانية وفق المنطقة والقوانين المعمول بها.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">
          خصوصية الأطفال
        </h2>
        <p className="arabic-muted">
          قسم الأطفال في المنصة مخصص للمحتوى التعليمي فقط ولا يجمع أي بيانات
          شخصية من الأطفال. لا نطلب من الأطفال تسجيل الدخول أو تقديم أي
          معلومات شخصية للوصول إلى المحتوى التعليمي.
        </p>
      </Card>

      <Card className="space-y-4 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">
          حقوق المستخدم
        </h2>
        <p className="arabic-muted">
          يمكنك تسجيل الخروج في أي وقت. عند الحاجة إلى حذف بيانات الحساب أو
          مراجعتها يجب التواصل مع فريق تشغيل المنصة وفق قنوات الدعم المعتمدة عند
          النشر. يمكنك أيضاً تعطيل ملفات تعريف الارتباط من إعدادات متصفحك،
          علماً بأن ذلك قد يؤثر على بعض ميزات الموقع.
        </p>
      </Card>
    </Container>
  );
}
