export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { requireAdminPermission } from '@/features/admin/services/admin';
import { getManagedContent } from '@/features/admin/services/content';
import { safeDeleteContentAction, safeTogglePublishAction } from '../content-actions';

export const metadata: Metadata = { title: 'إدارة المحتوى | الأدمن' };



export default async function ContentPage() {
  await requireAdminPermission('content.manage');
  const content = await getManagedContent();
  const publishedCount = content.filter((c) => c.published).length;
  return (
    <Container className="py-10 space-y-10 text-right">
      <section className="space-y-2"><h1 className="text-3xl font-bold text-brand-gold">إدارة المحتوى</h1><p className="arabic-muted leading-7">نشر وإخفاء وحذف كل محتوى الموقع: القصص، المقالات، المسابقات، خطط الحفظ، والرسائل المثبتة</p></section>
      <section className="grid gap-4 md:grid-cols-3"><Card><p className="text-sm arabic-muted">إجمالي العناصر</p><strong className="text-3xl text-brand-gold">{content.length}</strong></Card><Card><p className="text-sm arabic-muted">منشور</p><strong className="text-3xl text-brand-gold">{publishedCount}</strong></Card><Card><p className="text-sm arabic-muted">مسودة / مخفي</p><strong className="text-3xl text-brand-gold">{content.length - publishedCount}</strong></Card></section>
      <div className="flex gap-3"><Link href="/admin/editorial" className="rounded-lg border border-brand-gold/30 px-4 py-2 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors">فتح سير التحرير</Link></div>
      <section className="space-y-4"><SectionHeader title="كل المحتوى" subtitle={`${content.length} عنصر`} />{content.length === 0 ? <Card className="p-8 text-center"><p className="arabic-muted">لا يوجد محتوى في هذا الجرد حاليًا. أنشئ المحتوى من الوحدة التحريرية/المختصة ثم سيظهر هنا للمراجعة.</p></Card> : <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-sm text-right"><thead><tr className="border-b border-brand-gold/15 bg-black/20"><th className="px-5 py-3 text-brand-gold/70 font-semibold">العنوان</th><th className="px-5 py-3 text-brand-gold/70 font-semibold w-28">النوع</th><th className="px-5 py-3 text-brand-gold/70 font-semibold w-24">الحالة</th><th className="px-5 py-3 text-brand-gold/70 font-semibold w-24">المشاهدات</th><th className="px-5 py-3 text-brand-gold/70 font-semibold w-32">التاريخ</th><th className="px-5 py-3 text-brand-gold/70 font-semibold w-56">الإجراءات</th></tr></thead><tbody>{content.map((item) => <tr key={`${item.table}-${item.id}`} className="border-b border-brand-gold/8 hover:bg-brand-gold/5 transition-colors"><td className="px-5 py-3 text-brand-cream/80 font-medium">{item.title}</td><td className="px-5 py-3"><Badge variant="outline" className="text-xs">{item.type}</Badge></td><td className="px-5 py-3"><Badge variant={item.published ? 'secondary' : 'outline'} className={item.published ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}>{item.published ? 'منشور' : 'مسودة'}</Badge></td><td className="px-5 py-3 text-brand-cream/50 tabular-nums">{item.views > 0 ? item.views.toLocaleString('ar-EG-u-nu-latn') : '—'}</td><td className="px-5 py-3 text-brand-cream/50 text-xs">{new Date(item.created_at).toLocaleDateString('ar-EG-u-nu-latn')}</td><td className="px-5 py-3"><div className="flex items-center gap-2"><form action={safeTogglePublishAction}><input type="hidden" name="table" value={item.table} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="updatedAt" value={item.updated_at} /><input type="hidden" name="next" value={item.published ? 'false' : 'true'} /><Button size="sm" variant="outline" type="submit">{item.published ? 'إخفاء' : 'نشر'}</Button></form><form action={safeDeleteContentAction}><input type="hidden" name="table" value={item.table} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="updatedAt" value={item.updated_at} /><Button size="sm" variant="ghost" type="submit" className="text-red-300 hover:text-red-200">حذف</Button></form></div></td></tr>)}</tbody></table></div></Card>}</section>
    </Container>
  );
}
