import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

const contactEmail = "zikrmediaofficial@gmail.com";

export const metadata: Metadata = pageMetadata({
  title: "حذف بيانات المستخدم",
  description:
    "كيفية طلب حذف البيانات المرتبطة باستخدام Facebook مع منصة ZIKR.",
  path: "/data-deletion",
});

export default function DataDeletionPage() {
  const subject = encodeURIComponent("طلب حذف بيانات Facebook من ZIKR");
  const body = encodeURIComponent(
    "أرغب في طلب حذف البيانات المرتبطة باستخدام Facebook مع منصة ZIKR.\n\n" +
      "البريد الإلكتروني المرتبط بحساب ZIKR (إن وجد):\n" +
      "رابط صفحة Facebook أو معرّفها (إن وجد):\n" +
      "تفاصيل إضافية تساعد في التحقق من الطلب:\n",
  );
  const mailto = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

  return (
    <Container className="max-w-4xl space-y-8 py-12" dir="rtl">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl font-bold text-brand-gold">حذف بيانات المستخدم</h1>
        <p className="arabic-muted">آخر تحديث: 21 أكتوبر 2026</p>
        <p className="mx-auto max-w-2xl leading-8 arabic-muted">
          يمكنك طلب حذف البيانات المرتبطة باستخدام Facebook مع منصة ZIKR من خلال
          الخطوات الموضحة في هذه الصفحة.
        </p>
      </header>

      <Card className="space-y-4 p-6 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">كيفية تقديم طلب الحذف</h2>
        <ol className="list-decimal space-y-2 pe-6 arabic-muted">
          <li>اضغط على زر «إرسال طلب حذف البيانات» لفتح رسالة بريد إلكتروني جاهزة.</li>
          <li>اذكر البريد الإلكتروني المرتبط بحسابك إن وجد، ورابط صفحة Facebook أو معرّفها إن كان الطلب متعلقًا بربط الصفحة.</li>
          <li>أرسل الطلب من بريد يمكنك الوصول إليه حتى نتمكن من التواصل معك والتحقق من ملكيته عند الحاجة.</li>
        </ol>
        <p className="arabic-muted">
          لا ترسل كلمة مرور Facebook أو Access Token أو App Secret. لا نطلب هذه المعلومات لإتمام طلب الحذف.
        </p>
        <a
          href={mailto}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-gold px-5 py-3 font-semibold text-black transition hover:opacity-90"
        >
          إرسال طلب حذف البيانات
        </a>
      </Card>

      <Card className="space-y-4 p-6 leading-8">
        <h2 className="text-2xl font-semibold text-brand-gold">ما الذي يحدث بعد الطلب؟</h2>
        <p className="arabic-muted">
          سنراجع الطلب ونتحقق من ملكيته عند الحاجة، ثم نحذف البيانات المرتبطة التي
          يمكن حذفها وفق أنظمة ZIKR والتزاماتها القانونية والأمنية. قد نحتفظ بحد أدنى
          من السجلات عندما يكون الاحتفاظ بها مطلوبًا قانونيًا أو ضروريًا لأمن الخدمة.
          سنتواصل معك عبر البريد إذا احتجنا معلومات إضافية أو لتأكيد إتمام الطلب.
        </p>
        <p className="arabic-muted">
          طلب حذف بيانات ZIKR لا يحذف بياناتك من Facebook نفسه. لإدارة البيانات
          الموجودة لدى Meta، استخدم إعدادات حسابك أو أدوات الخصوصية التي توفرها Meta.
        </p>
      </Card>

      <p className="text-center leading-8 arabic-muted">
        لمزيد من التفاصيل، راجع{" "}
        <Link href="/privacy" className="text-brand-gold underline">
          سياسة الخصوصية
        </Link>
        . للتواصل المباشر:{" "}
        <a href={`mailto:${contactEmail}`} className="text-brand-gold underline">
          {contactEmail}
        </a>
        .
      </p>
    </Container>
  );
}
