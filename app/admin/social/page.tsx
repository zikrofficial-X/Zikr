export const dynamic = "force-dynamic";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import type { SocialPublishQueueItem } from "@/lib/services/social-publishing";

const statusLabels: Record<string, string> = {
  queued: "في الانتظار",
  processing: "قيد المعالجة",
  published: "نُشر",
  partial: "نشر جزئي",
  failed: "فشل",
};

const statusClasses: Record<string, string> = {
  queued: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  processing: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  partial: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  failed: "bg-red-500/15 text-red-300 border-red-500/25",
};

async function getQueue() {
  try {
    return (
      (await supabaseServerAdminRequest<SocialPublishQueueItem[]>(
        "/rest/v1/social_publish_queue?order=created_at.desc&limit=100"
      )) || []
    );
  } catch (error) {
    console.error("[admin/social] Failed to load social queue:", error);
    return [];
  }
}

export default async function AdminSocialPage() {
  await requireAdmin();
  const queue = await getQueue();
  const totals = queue.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Container className="space-y-8 py-10 text-right">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-gold">النشر التلقائي</h1>
        <p className="text-sm text-brand-cream/60" dir="rtl">
          متابعة طابور نشر البوستات والفيديوهات على الموقع وفيسبوك ويوتيوب.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {["queued", "processing", "published", "partial", "failed"].map(
          status => (
            <Card key={status} className="space-y-1">
              <p className="text-sm text-brand-cream/55">
                {statusLabels[status]}
              </p>
              <strong className="text-3xl text-brand-gold">
                {totals[status] ?? 0}
              </strong>
            </Card>
          )
        )}
      </section>

      <Card className="space-y-4 overflow-hidden">
        <h2 className="text-xl font-bold text-brand-gold">آخر عناصر الطابور</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-gold/20 text-brand-cream/60">
                <th className="pb-2 text-right">العنوان</th>
                <th className="pb-2 text-right">النوع</th>
                <th className="pb-2 text-right">المنصات</th>
                <th className="pb-2 text-right">الحالة</th>
                <th className="pb-2 text-right">الموعد</th>
                <th className="pb-2 text-right">الخطأ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gold/10">
              {queue.map(item => (
                <tr key={item.id} className="align-top hover:bg-black/10">
                  <td className="py-3 text-brand-cream">{item.title}</td>
                  <td className="py-3 text-brand-cream/60">
                    {item.content_type}
                  </td>
                  <td className="py-3 text-brand-cream/60">
                    {item.target_platforms.join("، ")}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${statusClasses[item.status] ?? statusClasses.failed}`}
                    >
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="py-3 text-brand-cream/50" dir="ltr">
                    {item.scheduled_at ?? "فوري"}
                  </td>
                  <td className="max-w-sm py-3 text-xs text-red-300/80">
                    {item.error_message ?? "—"}
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-brand-cream/45"
                  >
                    لا توجد عناصر في طابور النشر الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}
