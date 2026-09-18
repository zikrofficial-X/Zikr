export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/lib/services/admin";
import { supabaseServerAdminCount } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "الأتمتة والمهام | الأدمن" };

const JOB_TABLES = [
  ['content_agent_queue', 'طابور وكيل المحتوى'],
  ['content_agent_runs', 'تشغيلات وكيل المحتوى'],
  ['social_publish_queue', 'طابور النشر الاجتماعي'],
  ['social_sync_jobs', 'وظائف المزامنة الاجتماعية'],
  ['video_generation_requests', 'طلبات توليد الفيديو'],
  ['render_jobs', 'وظائف التصيير'],
  ['tasks', 'مهام النظام'],
] as const;

async function safeCount(table: string) {
  try {
    return await supabaseServerAdminCount(table);
  } catch {
    return 0;
  }
}

export default async function AdminAutomationPage() {
  await requireAdminPermission("system.manage");
  const jobs = await Promise.all(JOB_TABLES.map(async ([table, label]) => [table, label, await safeCount(table)] as const));

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header><p className="text-xs tracking-[0.2em] text-brand-cream/30">AUTOMATION OPS</p><h1 className="mt-2 text-3xl font-bold text-brand-gold">الأتمتة والمهام</h1><p className="mt-2 text-sm leading-7 text-brand-cream/50">جرد طبقات الأتمتة الحالية: المحتوى، السوشيال، توليد الفيديو، التصيير، ومهام النظام.</p></header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map(([table, label, count]) => <div key={table} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-sm text-brand-cream/65">{label}</p><p className="mt-2 text-3xl font-bold text-brand-gold">{count.toLocaleString('ar-EG')}</p><p className="mt-1 font-mono text-[11px] text-brand-cream/25">{table}</p></div>)}
      </section>
      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><h2 className="font-semibold text-brand-gold">قاعدة التشغيل</h2><p className="mt-2 text-sm leading-7 text-brand-cream/50">كل وظيفة آلية يجب أن تبقى قابلة للتدقيق، قابلة لإعادة المحاولة بأمان، وغير قابلة لإحداث نشر مكرر. الطوابير الحالية تعتمد على مفاتيح automation_key وحالات المعالجة الموجودة في المخطط.</p></section>
    </Container>
  );
}
