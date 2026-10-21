export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { requireAdminPermission } from '@/features/admin/services/admin';
import { getAdminAnalytics } from '@/features/admin/services/analytics';

export const metadata: Metadata = {
  title: 'تحليلات المنصة | إدارة ذِكر',
};

export default async function AnalyticsPage() {
  await requireAdminPermission("analytics.read");

  const { stats, topArticles, userCount } = await getAdminAnalytics();
  const rankedArticles = topArticles.filter((article) => article.views > 0).slice(0, 10);

  const contentCards = [
    { label: 'المستخدمون', value: userCount, note: 'حساب مسجل' },
    { label: 'المقالات', value: stats.articles, note: 'سجل في قاعدة البيانات' },
    { label: 'القصص', value: stats.stories, note: 'سجل في قاعدة البيانات' },
    { label: 'الأدعية', value: stats.duas, note: 'سجل في قاعدة البيانات' },
    { label: 'الأنبياء', value: stats.prophets, note: 'سجل في قاعدة البيانات' },
    { label: 'الصحابة', value: stats.companions, note: 'سجل في قاعدة البيانات' },
    { label: 'العلماء', value: stats.scholars, note: 'سجل في قاعدة البيانات' },
    { label: 'الفيديوهات', value: stats.videos, note: 'سجل في قاعدة البيانات' },
  ];

  return (
    <Container className="py-10 space-y-10 text-right">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-gold">تحليلات التطبيق</h1>
        <p className="arabic-muted leading-7">أرقام فعلية من قاعدة الإنتاج، مع فصل واضح بين العدّ التشغيلي وبيانات المشاهدة.</p>
      </section>

      {/* Content Stats Grid */}
      <section className="space-y-4">
        <SectionHeader title="إحصائيات المحتوى" subtitle="عدد العناصر في قاعدة البيانات" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {contentCards.map((card) => (
            <Card key={card.label} className="text-center space-y-2 py-6">
              <p className="text-4xl font-bold text-brand-gold tabular-nums">
                {card.value.toLocaleString('ar-EG-u-nu-latn')}
              </p>
              <p className="text-sm font-semibold text-brand-cream/80">{card.label}</p>
              <p className="text-xs text-brand-cream/40">{card.note}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Top Articles */}
      {rankedArticles.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="المقالات الأكثر مشاهدة" subtitle="ترتيب حسب عدد المشاهدات" />
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-[420px] w-full text-sm text-right">
              <thead>
                <tr className="border-b border-brand-gold/15">
                  <th className="px-4 py-3 text-brand-gold/70 font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-brand-gold/70 font-semibold w-32">المشاهدات</th>
                </tr>
              </thead>
              <tbody>
                {rankedArticles.map((article, idx) => (
                  <tr key={article.id} className="border-b border-brand-gold/8 hover:bg-brand-gold/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-brand-gold/40 text-xs tabular-nums w-5">{idx + 1}</span>
                        <span className="text-brand-cream/80">{article.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {article.views.toLocaleString('ar-EG-u-nu-latn')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        </section>
      )}

      {rankedArticles.length === 0 && (
        <Card className="p-8 text-center">
          <p className="arabic-muted">لا توجد مشاهدات مسجلة للمقالات حتى الآن؛ لن نعرض قائمة ترتيب قبل وجود بيانات مشاهدة فعلية.</p>
        </Card>
      )}

    </Container>
  );
}
