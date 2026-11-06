export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminAnalytics } from "@/features/admin/services/analytics";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { TrafficRevenuePanel } from "@/features/admin/components/traffic-revenue-panel";
import Link from "next/link";
import { getYouTubePublishingConnectionHealth } from "@/features/social/services/youtube-publishing-health";

export const metadata: Metadata = { title: "تحليلات المنصة | إدارة ذِكر" };

export default async function AnalyticsPage() {
  await requireAdminPermission("analytics.read");
  const [data, youtube] = await Promise.all([getAdminAnalytics(), getYouTubePublishingConnectionHealth()]);
  const visibleData = {
    ...data,
    topArticles: data.topArticles.filter((article) => article.views > 0),
  };
  return (
    <Container className="space-y-8 py-10 text-right">
      <header className="rounded-3xl border border-brand-gold/15 bg-gradient-to-br from-brand-gold/10 via-black/20 to-black/5 p-6 md:p-8">
        <p className="text-xs tracking-[0.2em] text-brand-cream/55">مركز القراءة التشغيلية</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">تحليلات المنصة</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/65">راقب نشاط فريق الإدارة، زيارات صفحات اللوحة، وأداء المحتوى من مكان واحد. الأرقام غير المتاحة تبقى واضحة ولا تتحول إلى أصفار مصطنعة.</p>
      </header>
      <div className="min-w-0 overflow-x-auto grid-cols-2">
        <AnalyticsDashboard data={visibleData} />
      </div>
      <section className="rounded-2xl border border-brand-gold/15 bg-black/15 p-5 text-right">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-gold">إحصائيات قناة YouTube — قراءة فقط</h2>
            <p className="mt-1 text-sm text-brand-cream/55">{youtube.channelName ?? youtube.message}</p>
          </div>
          <Link href="/api/admin/social/youtube/connect" className="rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
            {youtube.status === "connected" ? "إعادة ربط القراءة" : "ربط قناة YouTube"}
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs text-brand-cream/40">المشتركون</p>
            <p className="mt-1 text-xl font-bold text-brand-cream">{youtube.subscribers?.toLocaleString("ar-EG-u-nu-latn") ?? "غير متاح"}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs text-brand-cream/40">المشاهدات</p>
            <p className="mt-1 text-xl font-bold text-brand-cream">{youtube.totalViews?.toLocaleString("ar-EG-u-nu-latn") ?? "غير متاح"}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs text-brand-cream/40">الفيديوهات</p>
            <p className="mt-1 text-xl font-bold text-brand-cream">{youtube.videoCount?.toLocaleString("ar-EG-u-nu-latn") ?? "غير متاح"}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-6 text-brand-cream/40">يطلب الربط صلاحيات قراءة القناة وتقارير Analytics فقط. لا يطلب إذن رفع أو تعديل أو حذف فيديوهات.</p>
      </section>
      <TrafficRevenuePanel />
    </Container>
  );
}
