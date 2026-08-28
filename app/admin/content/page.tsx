export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { requireAdmin } from '@/lib/services/admin';
import { createClient } from '@/lib/supabase/server';
import { deleteContentAction, togglePublishAction } from '../actions';

export const metadata: Metadata = {
  title: 'إدارة المحتوى | الأدمن',
};

interface ContentRow {
  id: string;
  title?: string | null;
  published?: boolean | null;
  is_active?: boolean | null;
  views?: number | null;
  created_at: string;
}

interface ContentItem {
  id: string;
  title: string;
  published: boolean;
  views: number;
  created_at: string;
  type: string;
  table: 'stories' | 'articles' | 'competitions' | 'memorization_plans' | 'pinned_messages';
}

async function getManagedContent(): Promise<ContentItem[]> {
  try {
    const supabase = await createClient();

    const [storiesRes, articlesRes, competitionsRes, plansRes, pinnedRes] = await Promise.all([
      supabase
        .from('stories')
        .select('id, title, published, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('articles')
        .select('id, title, published, views, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('competitions')
        .select('id, title, published, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('memorization_plans')
        .select('id, title, published, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('pinned_messages')
        .select('id, title, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const items: ContentItem[] = [
      ...((storiesRes.data ?? []) as ContentRow[]).map((s) => ({
        id: s.id, title: s.title ?? 'بدون عنوان', published: s.published ?? false, views: 0,
        created_at: s.created_at, type: 'قصة', table: 'stories' as const,
      })),
      ...((articlesRes.data ?? []) as ContentRow[]).map((a) => ({
        id: a.id, title: a.title ?? 'بدون عنوان', published: a.published ?? false, views: a.views ?? 0,
        created_at: a.created_at, type: 'مقالة', table: 'articles' as const,
      })),
      ...((competitionsRes.data ?? []) as ContentRow[]).map((c) => ({
        id: c.id, title: c.title ?? 'بدون عنوان', published: c.published ?? false, views: 0,
        created_at: c.created_at, type: 'مسابقة', table: 'competitions' as const,
      })),
      ...((plansRes.data ?? []) as ContentRow[]).map((p) => ({
        id: p.id, title: p.title ?? 'بدون عنوان', published: p.published ?? false, views: 0,
        created_at: p.created_at, type: 'خطة حفظ', table: 'memorization_plans' as const,
      })),
      ...((pinnedRes.data ?? []) as ContentRow[]).map((m) => ({
        id: m.id, title: m.title ?? 'رسالة مثبتة', published: m.is_active ?? false, views: 0,
        created_at: m.created_at, type: 'رسالة مثبتة', table: 'pinned_messages' as const,
      })),
    ];

    return items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch {
    return [];
  }
}

export default async function ContentPage() {
  await requireAdmin();
  const content = await getManagedContent();
  const publishedCount = content.filter((c) => c.published).length;

  return (
    <Container className="py-10 space-y-10 text-right">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-gold">إدارة المحتوى</h1>
        <p className="arabic-muted leading-7">
          نشر وإخفاء وحذف كل محتوى الموقع: القصص، المقالات، المسابقات، خطط الحفظ، والرسائل المثبتة
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm arabic-muted">إجمالي العناصر</p>
          <strong className="text-3xl text-brand-gold">{content.length}</strong>
        </Card>
        <Card>
          <p className="text-sm arabic-muted">منشور</p>
          <strong className="text-3xl text-brand-gold">{publishedCount}</strong>
        </Card>
        <Card>
          <p className="text-sm arabic-muted">مسودة / مخفي</p>
          <strong className="text-3xl text-brand-gold">{content.length - publishedCount}</strong>
        </Card>
      </section>

      <div className="flex gap-3">
        <Link
          href="/admin"
          className="rounded-lg border border-brand-gold/30 px-4 py-2 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors"
        >
          إضافة محتوى جديد
        </Link>
      </div>

      <section className="space-y-4">
        <SectionHeader title="كل المحتوى" subtitle={`${content.length} عنصر`} />

        {content.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="arabic-muted">لا يوجد محتوى بعد. ابدأ بإضافة قصص أو مقالات من لوحة التحكم الرئيسية.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-brand-gold/15 bg-black/20">
                    <th className="px-5 py-3 text-brand-gold/70 font-semibold">العنوان</th>
                    <th className="px-5 py-3 text-brand-gold/70 font-semibold w-28">النوع</th>
                    <th className="px-5 py-3 text-brand-gold/70 font-semibold w-24">الحالة</th>
                    <th className="px-5 py-3 text-brand-gold/70 font-semibold w-24">المشاهدات</th>
                    <th className="px-5 py-3 text-brand-gold/70 font-semibold w-32">التاريخ</th>
                    <th className="px-5 py-3 text-brand-gold/70 font-semibold w-56">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((item) => (
                    <tr
                      key={`${item.table}-${item.id}`}
                      className="border-b border-brand-gold/8 hover:bg-brand-gold/5 transition-colors"
                    >
                      <td className="px-5 py-3 text-brand-cream/80 font-medium">{item.title}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={item.published ? 'secondary' : 'outline'}
                          className={item.published ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}
                        >
                          {item.published ? 'منشور' : 'مسودة'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-brand-cream/50 tabular-nums">
                        {item.views > 0 ? item.views.toLocaleString('ar-EG') : '—'}
                      </td>
                      <td className="px-5 py-3 text-brand-cream/50 text-xs">
                        {new Date(item.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <form action={togglePublishAction}>
                            <input type="hidden" name="table" value={item.table} />
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="next" value={item.published ? 'false' : 'true'} />
                            <Button size="sm" variant="outline" type="submit">
                              {item.published ? 'إخفاء' : 'نشر'}
                            </Button>
                          </form>
                          <form action={deleteContentAction}>
                            <input type="hidden" name="table" value={item.table} />
                            <input type="hidden" name="id" value={item.id} />
                            <Button
                              size="sm"
                              variant="ghost"
                              type="submit"
                              className="text-red-300 hover:text-red-200"
                            >
                              حذف
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </Container>
  );
}
