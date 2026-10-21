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
  const [content, scheduled] = await Promise.all([getManagedContent(), getScheduledContent()]);
  const publishedCount = content.filter((c) => c.published).length;
  return (
    <Container className="py-10 space-y-10 text-right">
      <section className="space-y-2"><h1 className="text-3xl font-bold text-brand-gold">إدارة المحتوى</h1><p className="arabic-muted leading-7">نشر وإخفاء وحذف كل محتوى الموقع: القصص، المقالات، المسابقات، خطط الحفظ، والرسائل المثبتة</p></section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card><p className="text-sm arabic-muted">إجمالي العناصر</p><strong className="text-3xl text-brand-gold">{content.length}</strong><p className="mt-1 text-xs text-brand-cream/45">جرد المحتوى الحالي</p></Card><Card><p className="text-sm arabic-muted">منشور</p><strong className="text-3xl text-emerald-300">{publishedCount}</strong><p className="mt-1 text-xs text-brand-cream/45">متاح للزوار</p></Card><Card><p className="text-sm arabic-muted">مسودة / مخفي</p><strong className="text-3xl text-amber-200">{content.length - publishedCount}</strong><p className="mt-1 text-xs text-brand-cream/45">يحتاج مراجعة أو قرار</p></Card><Card><p className="text-sm arabic-muted">في قائمة الجدولة</p><strong className="text-3xl text-sky-200">{scheduled.length}</strong><p className="mt-1 text-xs text-brand-cream/45">سينشرها العامل تلقائياً</p></Card></section>
      <div className="flex gap-3"><Link href="/admin/editorial" className="rounded-lg border border-brand-gold/30 px-4 py-2 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors">فتح سير التحرير</Link></div>
      <section className="space-y-4"><SectionHeader title="مساحة العمل التحريرية" subtitle={`${content.length} عنصر · ${scheduled.length} مجدول`} />{content.length === 0 ? <Card className="p-8 text-center"><p className="arabic-muted">لا يوجد محتوى في هذا الجرد حاليًا.</p></Card> : <ContentConsole content={content} scheduled={scheduled} />}</section>
    </Container>
  );
}
