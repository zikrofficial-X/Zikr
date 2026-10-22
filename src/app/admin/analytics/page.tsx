export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminAnalytics } from "@/features/admin/services/analytics";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = { title: "تحليلات المنصة | إدارة ذِكر" };

export default async function AnalyticsPage() {
  await requireAdminPermission("analytics.read");
  const data = await getAdminAnalytics();
  const topArticles = data.topArticles.filter((article) => article.views > 0);
  return (
    <Container className="space-y-8 py-10 text-right">
      <header className="rounded-3xl border border-brand-gold/15 bg-gradient-to-br from-brand-gold/10 via-black/20 to-black/5 p-6 md:p-8">
        <p className="text-xs tracking-[0.2em] text-brand-cream/55">مركز القراءة التشغيلية</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">تحليلات المنصة</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/65">راقب نشاط فريق الإدارة، زيارات صفحات اللوحة، وأداء المحتوى من مكان واحد. الأرقام غير المتاحة تبقى واضحة ولا تتحول إلى أصفار مصطنعة.</p>
      </header>
      <AnalyticsDashboard data={{ ...data, topArticles }} />
    </Container>
  );
}
