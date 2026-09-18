export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/lib/services/admin';
import { supabaseServerAdminCount } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'تحليلات التطبيق | الأدمن',
};

interface TopArticle {
  id: string;
  title: string;
  views: number;
  slug: string;
}

async function getContentStats() {
  const tables = ['articles', 'stories', 'duas', 'prophets', 'companions', 'scholars', 'videos', 'quran_surahs'] as const;
  const counts = await Promise.all(tables.map((t) => supabaseServerAdminCount(t)));
  return Object.fromEntries(tables.map((t, i) => [t, counts[i]]));
}

async function getTopArticles(): Promise<TopArticle[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('articles')
      .select('id, title, views, slug')
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(10);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getUserCount(): Promise<number> {
  return supabaseServerAdminCount('profiles');
}

export default async function AnalyticsPage() {
  await requireAdmin();

  const [stats, topArticles, userCount] = await Promise.all([
    getContentStats(),
    getTopArticles(),
    getUserCount(),
  ]);

  const contentCards = [
    { label: 'المستخدمون', value: userCount, note: 'حساب مسجل' },
    { label: 'المقالات', value: stats.articles, note: 'مقالة منشورة' },
    { label: 'القصص', value: stats.stories, note: 'قصة إسلامية' },
    { label: 'الأدعية', value: stats.duas, note: 'دعاء مأثور' },
    { label: 'الأنبياء', value: stats.prophets, note: 'قصة نبي' },
    { label: 'الصحابة', value: stats.companions, note: 'صحابي' },
    { label: 'العلماء', value: stats.scholars, note: 'ترجمة عالم' },
    { label: 'الفيديوهات', value: stats.videos, note: 'فيديو' },
  ];

  return (
    <Container className="py-10 space-y-10 text-right">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-gold">تحليلات التطبيق</h1>
        <p className="arabic-muted leading-7">إحصائيات شاملة عن المحتوى والمستخدمين</p>
      </section>

      {/* Content Stats Grid */}
      <section className="space-y-4">
        <SectionHeader title="إحصائيات المحتوى" subtitle="عدد العناصر في قاعدة البيانات" />
        <div className="grid gap-4 md:grid-cols-4">
          {contentCards.map((card) => (
            <Card key={card.label} className="text-center space-y-2 py-6">
              <p className="text-4xl font-bold text-brand-gold tabular-nums">
                {card.value.toLocaleString('ar-EG')}
              </p>
              <p className="text-sm font-semibold text-brand-cream/80">{card.label}</p>
              <p className="text-xs text-brand-cream/40">{card.note}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Top Articles */}
      {topArticles.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="المقالات الأكثر مشاهدة" subtitle="ترتيب حسب عدد المشاهدات" />
          <Card className="overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-brand-gold/15">
                  <th className="px-4 py-3 text-brand-gold/70 font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-brand-gold/70 font-semibold w-32">المشاهدات</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.map((article, idx) => (
                  <tr key={article.id} className="border-b border-brand-gold/8 hover:bg-brand-gold/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-brand-gold/40 text-xs tabular-nums w-5">{idx + 1}</span>
                        <span className="text-brand-cream/80">{article.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {article.views.toLocaleString('ar-EG')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {topArticles.length === 0 && (
        <Card className="p-8 text-center">
          <p className="arabic-muted">لا توجد بيانات مشاهدات بعد. سيتم تحديث البيانات تلقائياً عند زيارة المستخدمين للمقالات.</p>
        </Card>
      )}

      {/* Navigation */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 space-y-2 hover:border-brand-gold/40 transition-colors">
          <h3 className="text-lg font-bold text-brand-gold">إدارة المستخدمين</h3>
          <p className="text-sm arabic-muted">عرض وإدارة جميع الحسابات والأدوار</p>
          <a href="/admin/users" className="text-sm text-brand-gold hover:underline">الذهاب للإدارة</a>
        </Card>
        <Card className="p-5 space-y-2 hover:border-brand-gold/40 transition-colors">
          <h3 className="text-lg font-bold text-brand-gold">إدارة الفيديوهات</h3>
          <p className="text-sm arabic-muted">مزامنة يوتيوب وإدارة الفيديوهات</p>
          <a href="/admin/videos" className="text-sm text-brand-gold hover:underline">الذهاب للإدارة</a>
        </Card>
        <Card className="p-5 space-y-2 hover:border-brand-gold/40 transition-colors">
          <h3 className="text-lg font-bold text-brand-gold">إدارة المحتوى</h3>
          <p className="text-sm arabic-muted">نشر وتعديل جميع أنواع المحتوى</p>
          <a href="/admin/content" className="text-sm text-brand-gold hover:underline">الذهاب للإدارة</a>
        </Card>
      </section>
    </Container>
  );
}
