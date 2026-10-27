import Link from "next/link";
import { Activity, ArrowUpLeft, BarChart3, CheckCircle2, Clock3, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AdminAnalytics } from "@/features/admin/services/analytics";

const format = (value: number | null) =>
  value === null ? "غير متاح" : value.toLocaleString("ar-EG-u-nu-latn");

const formatDuration = (milliseconds: number | null) => {
  if (milliseconds === null) return "غير متاح";
  const seconds = milliseconds / 1000;
  return seconds >= 60 ? `${(seconds / 60).toFixed(1)} د` : `${seconds.toFixed(1)} ث`;
};

const CONTENT_STATS: Array<{ key: string; label: string }> = [
  { key: "articles", label: "المقالات" },
  { key: "stories", label: "القصص" },
  { key: "duas", label: "الأدعية" },
  { key: "prophets", label: "الأنبياء" },
  { key: "companions", label: "الصحابة" },
  { key: "scholars", label: "العلماء" },
  { key: "videos", label: "الفيديوهات" },
  { key: "quran_surahs", label: "السور القرآنية" },
];

export function AnalyticsDashboard({ data }: { data: AdminAnalytics }) {
  const maxActivity = Math.max(...data.activityByDay.map((item) => item.count), 1);
  const maxRouteViews = Math.max(...data.routeViews.map((item) => item.views), 1);
  const contentStats = CONTENT_STATS.map((item) => ({ ...item, value: data.stats[item.key] ?? null }));
  const maxContentCount = Math.max(
    ...contentStats.map((item) => (item.value === null ? 0 : item.value)),
    1,
  );
  const metrics = [
    { label: "المستخدمون المسجلون", value: data.userCount, note: "إجمالي الحسابات", icon: Users, tone: "gold" },
    { label: "مستخدمون نفذوا إجراءً", value: data.activeUsers, note: "من آخر 500 عملية تدقيق خلال 7 أيام", icon: Activity, tone: "emerald" },
    { label: "زيارات لوحة التحكم", value: data.dashboardVisits, note: "آخر 7 أيام · حتى 500 سجل", icon: Eye, tone: "sky" },
    {
      label: "مشاهدات أعلى مقال",
      value: data.topArticlesAvailable ? (data.topArticles[0]?.views ?? 0) : null,
      note: data.topArticlesAvailable ? (data.topArticles[0]?.title ?? "لا توجد مقالات منشورة") : "تعذر تحميل بيانات المقالات",
      icon: BarChart3,
      tone: "amber",
    },
  ];

  return (
    <div className="space-y-7" dir="rtl">
      {data.unavailable.length ? (
        <div role="status" className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100/80">
          بعض مصادر التحليلات غير متاحة حالياً: {data.unavailable.join("، ")}. لم يتم استبدالها بأرقام تقديرية أو أصفار غير مؤكدة.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="مؤشرات المنصة">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => (
          <Card key={label} className="relative overflow-hidden p-5">
            <div
              className={
                "absolute inset-x-0 top-0 h-1 " +
                (tone === "emerald"
                  ? "bg-emerald-400"
                  : tone === "sky"
                    ? "bg-sky-400"
                    : tone === "amber"
                      ? "bg-amber-300"
                      : "bg-brand-gold")
              }
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-brand-cream/55">{label}</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-brand-cream">{format(value)}</p>
                <p className="mt-1 line-clamp-2 text-xs text-brand-cream/45">{note}</p>
              </div>
              <span className="rounded-xl border border-brand-gold/15 bg-brand-gold/10 p-2 text-brand-gold">
                <Icon size={17} />
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section aria-labelledby="template-performance-heading">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-gold/10 px-5 py-4">
            <div>
              <h2 id="template-performance-heading" className="flex items-center gap-2 font-bold text-brand-gold">
                <Clock3 size={17} /> أداء القوالب البصرية
              </h2>
              <p className="mt-1 text-xs leading-5 text-brand-cream/45">
                متوسط زمن الرندر المسجل في Supabase لكل scene · آخر ١٠٠٠ طلب
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-400/20 text-emerald-200/80">قياس فعلي</Badge>
          </div>
          {!data.templatePerformanceAvailable ? (
            <p className="p-8 text-center text-sm leading-7 text-amber-100/70">تعذر تحميل قياسات القوالب حالياً. ستبقى البيانات غير مؤكدة بدلاً من عرض أرقام تقديرية.</p>
          ) : !data.templatePerformance.length ? (
            <div className="p-8 text-center">
              <p className="text-sm text-brand-cream/60">لا توجد قياسات مسجلة بعد.</p>
              <p className="mt-2 text-xs leading-6 text-brand-cream/35">ستظهر القوالب هنا بعد اكتمال تشغيلات التوليد القادمة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-right text-sm">
                <thead className="bg-white/[0.03] text-xs text-brand-cream/45">
                  <tr>
                    <th className="px-5 py-3 font-medium">القالب</th>
                    <th className="px-4 py-3 font-medium">متوسط الرندر</th>
                    <th className="px-4 py-3 font-medium">الأسرع / الأبطأ</th>
                    <th className="px-4 py-3 font-medium">الطلبات المقاسة</th>
                    <th className="px-4 py-3 font-medium">النجاح</th>
                    <th className="px-5 py-3 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gold/8">
                  {data.templatePerformance.map((item) => {
                    const successRate = item.totalRequests ? Math.round((item.completedRequests / item.totalRequests) * 100) : 0;
                    const averageRatio = item.averageRenderDurationMs && data.templatePerformance[0]?.averageRenderDurationMs
                      ? Math.min(100, Math.max(8, (item.averageRenderDurationMs / data.templatePerformance[0].averageRenderDurationMs) * 100))
                      : 0;
                    return (
                      <tr key={item.scene} className="text-brand-cream/70">
                        <td className="px-5 py-4">
                          <p className="font-mono text-sm text-brand-cream" dir="ltr">{item.scene}</p>
                          <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-brand-gold/80" style={{ width: `${averageRatio}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold tabular-nums text-brand-gold">{formatDuration(item.averageRenderDurationMs)}</td>
                        <td className="px-4 py-4 text-xs tabular-nums text-brand-cream/55">
                          {formatDuration(item.fastestRenderDurationMs)} <span className="px-1 text-brand-cream/25">/</span> {formatDuration(item.slowestRenderDurationMs)}
                        </td>
                        <td className="px-4 py-4 tabular-nums">{format(item.measuredRenders)} <span className="text-xs text-brand-cream/35">من {format(item.totalRequests)}</span></td>
                        <td className="px-4 py-4 tabular-nums">{successRate}%</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-200/75"><CheckCircle2 size={14} /> {item.failedRequests ? `${format(item.failedRequests)} فشل` : "مستقر"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-gold">إيقاع الزيارات</h2>
              <p className="mt-1 text-xs text-brand-cream/45">آخر 7 أيام تقويمية حسب UTC · حتى 500 سجل</p>
            </div>
            <Badge variant="outline" className="border-brand-gold/20">أسبوعي</Badge>
          </div>
          <div className="mt-7 flex h-44 items-end gap-2 sm:gap-4">
            {data.activityByDay.map((item, index) => {
              const width = item.count === 0 ? 0 : Math.max(8, (item.count / maxActivity) * 100);
              return (
                <div key={item.label + "-" + index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] tabular-nums text-brand-cream/45">{format(item.count)}</span>
                  <div className="flex h-full w-full max-w-10 items-end overflow-hidden rounded-t-lg bg-white/5">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand-gold/40 to-brand-gold transition-all"
                      style={{ height: String(width) + "%" }}
                      aria-label={item.label + ": " + format(item.count)}
                    />
                  </div>
                  <span className="text-[11px] text-brand-cream/55">{item.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-brand-cream/35">
            الأرقام تخص زيارات صفحات الإدارة المسجلة فقط، وليست زيارات الموقع العامة.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand-gold">أكثر المسارات زيارة</h2>
              <p className="mt-1 text-xs text-brand-cream/45">من عينة آخر 500 زيارة خلال 7 أيام</p>
            </div>
            <ArrowUpLeft size={18} className="text-brand-gold/70" />
          </div>
          <div className="mt-5 space-y-3">
            {data.routeViews.length ? (
              data.routeViews.map((item) => {
                const width = item.views <= 0 ? 0 : Math.max(8, (item.views / maxRouteViews) * 100);
                return (
                  <div key={item.route}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-mono text-brand-cream/65" dir="ltr">{item.route}</span>
                      <span className="tabular-nums text-brand-gold">{format(item.views)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-sky-300/80" style={{ width: String(width) + "%" }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-brand-cream/50">لا توجد زيارات مسجلة خلال الفترة المحددة.</p>
            )}
          </div>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="content-inventory-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="content-inventory-heading" className="text-xl font-bold text-brand-gold">جرد المحتوى حسب القسم</h2>
            <p className="mt-1 text-sm leading-6 text-brand-cream/45">
              عدد السجلات الموجودة في كل جدول. هذه الأعداد تشمل المنشور والمسودات معاً، ولا تعني أن كل عنصر جاهز للنشر.
            </p>
          </div>
          <Link href="/admin/content" className="text-xs text-brand-gold hover:underline">إدارة المحتوى</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {contentStats.map((item) => {
            const width = item.value === null || item.value <= 0 ? 0 : Math.max(3, (item.value / maxContentCount) * 100);
            return (
              <Card key={item.key} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-brand-cream/65">{item.label}</p>
                  <p className="text-xl font-bold tabular-nums text-brand-cream">{format(item.value)}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-300/75" style={{ width: String(width) + "%" }} />
                </div>
                <p className="mt-2 text-[11px] text-brand-cream/35">
                  {item.value === null ? "تعذر قراءة المصدر" : "سجلات قاعدة البيانات"}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-x-auto p-0">
          <div className="flex items-center justify-between border-b border-brand-gold/10 px-5 py-4">
            <div>
              <h2 className="font-bold text-brand-gold">الأداء التحريري</h2>
              <p className="mt-1 text-xs text-brand-cream/45">أفضل المقالات المنشورة حسب المشاهدات</p>
            </div>
            <Link href="/admin/content" className="text-xs text-brand-gold hover:underline">إدارة المحتوى</Link>
          </div>
          <div className="divide-y divide-brand-gold/8">
            {data.topArticles.map((article, index) => {
              const width = article.views <= 0 ? 0 : Math.max(7, (article.views / Math.max(data.topArticles[0]?.views || 1, 1)) * 100);
              return (
                <div key={article.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-6 text-xs text-brand-gold/70">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-brand-cream/80">{article.title}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-300/70" style={{ width: String(width) + "%" }} />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-brand-cream/55">{format(article.views)}</span>
                </div>
              );
            })}
            {!data.topArticles.length ? (
              <p className="p-8 text-center text-sm text-brand-cream/50">
                {data.topArticlesAvailable ? "لا توجد مقالات منشورة لعرضها." : "تعذر تحميل أداء المقالات؛ تحقق من اتصال قاعدة البيانات."}
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-brand-gold">قراءة سريعة</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-brand-cream/65">
            <p className="rounded-xl border border-brand-gold/10 bg-black/15 p-3">
              زيارات لوحة الإدارة تقيس استخدام صفحات الأدمن، ولا تمثل عدد زوار الموقع أو جلسات المستخدمين العامة.
            </p>
            <p className="rounded-xl border border-sky-400/15 bg-sky-400/5 p-3 text-sky-100/70">
              مقياس المستخدمين النشطين يعتمد على حسابات نفذت إجراءً إدارياً مسجلاً خلال آخر 7 أيام، وليس على مجرد فتح الموقع.
            </p>
            <p className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-emerald-100/70">
              مخطط توزيع المحتوى يقارن عدد السجلات فقط. راجع حالة النشر والمراجعة قبل اعتبار القسم مكتملاً.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
