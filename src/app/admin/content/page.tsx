export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { requireAdminPermission } from '@/features/admin/services/admin';
import { getManagedContent, getScheduledContent } from '@/features/admin/services/content';
import { ContentConsole } from './content-console';

export const metadata: Metadata = { title: 'إدارة المحتوى | الأدمن' };



export default async function ContentPage() {
  await requireAdminPermission('content.manage');
  const [contentRead, scheduledRead] = await Promise.all([getManagedContent(), getScheduledContent()]);
  const content = contentRead.items;
  const scheduled = scheduledRead.items;
  const complete = contentRead.available;
  const publishedCount = content.filter((c) => c.published).length;
  const contentCountLabel = complete ? String(content.length) : "غير مكتمل";
  const publishedCountLabel = complete ? String(publishedCount) : "غير مكتمل";
  const hiddenCountLabel = complete ? String(content.length - publishedCount) : "غير مكتمل";
  const scheduledCountLabel = scheduledRead.available ? String(scheduled.length) : "غير متاح";

  return (
    <Container className="py-10 space-y-10 text-right">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-gold">إدارة المحتوى</h1>
        <p className="arabic-muted leading-7">نشر وإخفاء وحذف كل محتوى الموقع: القصص، المقالات، المسابقات، خطط الحفظ، والرسائل المثبتة</p>
      </section>
      {!complete || !scheduledRead.available ? (
        <div role="alert" className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-sm leading-7 text-amber-100/85">
          بعض بيانات الإدارة غير متاحة حاليًا. الأرقام المعروضة ليست جردًا كاملًا، ولن يتم اعتبار المصدر الذي فشل فارغًا.
          {contentRead.failedSources.length ? <p className="mt-1 text-xs">مصادر المحتوى المتعذرة: {contentRead.failedSources.join("، ")}</p> : null}
          {!scheduledRead.available ? <p className="mt-1 text-xs">تعذر تحميل جدول النشر.</p> : null}
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-sm arabic-muted">إجمالي العناصر</p><strong className="text-3xl text-brand-gold">{contentCountLabel}</strong><p className="mt-1 text-xs text-brand-cream/45">جرد المحتوى الحالي</p></Card>
        <Card><p className="text-sm arabic-muted">منشور</p><strong className="text-3xl text-emerald-300">{publishedCountLabel}</strong><p className="mt-1 text-xs text-brand-cream/45">متاح للزوار</p></Card>
        <Card><p className="text-sm arabic-muted">مسودة / مخفي</p><strong className="text-3xl text-amber-200">{hiddenCountLabel}</strong><p className="mt-1 text-xs text-brand-cream/45">يحتاج مراجعة أو قرار</p></Card>
        <Card><p className="text-sm arabic-muted">في قائمة الجدولة</p><strong className="text-3xl text-sky-200">{scheduledCountLabel}</strong><p className="mt-1 text-xs text-brand-cream/45">سينشرها العامل تلقائياً</p></Card>
      </section>
      <div className="flex gap-3">
        <Link href="/admin/editorial" className="rounded-lg border border-brand-gold/30 px-4 py-2 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors">فتح سير التحرير</Link>
      </div>
      <section className="space-y-4">
        <SectionHeader title="مساحة العمل التحريرية" subtitle={complete ? `${content.length} عنصر · ${scheduledCountLabel} مجدول` : "بيانات جزئية — راجع تنبيه المصدر"} />
        {content.length > 0 ? (
          <ContentConsole content={content} scheduled={scheduled} />
        ) : complete ? (
          <Card className="p-8 text-center"><p className="arabic-muted">لا يوجد محتوى في هذا الجرد حاليًا.</p></Card>
        ) : (
          <Card className="p-8 text-center"><p className="arabic-muted">تعذر تأكيد خلو مكتبة المحتوى؛ تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.</p></Card>
        )}
      </section>
    </Container>
  );
}
