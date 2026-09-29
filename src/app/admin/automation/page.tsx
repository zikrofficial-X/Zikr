export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminCount, supabaseServerAdminRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "الأتمتة والمهام | الأدمن" };

const JOB_TABLES = [
  ["content_agent_queue", "طابور وكيل المحتوى"],
  ["content_agent_runs", "تشغيلات وكيل المحتوى"],
  ["video_generation_requests", "طلبات توليد الفيديو"],
  ["social_publish_queue", "طابور النشر الاجتماعي"],
] as const;

type QueueStatus = { status: string };

async function readCount(table: string) {
  try {
    return { count: await supabaseServerAdminCount(table), state: "available" as const };
  } catch {
    return { count: null, state: "unavailable" as const };
  }
}

export default async function AdminAutomationPage() {
  await requireAdminPermission("system.manage");

  const jobs = await Promise.all(
    JOB_TABLES.map(async ([table, label]) => ({
      table,
      label,
      ...(await readCount(table)),
    })),
  );

  const [videoQueue, socialQueue] = await Promise.all([
    supabaseServerAdminRequest<QueueStatus[]>(
      "/rest/v1/video_generation_requests?select=status&order=created_at.desc&limit=500",
      { method: "GET" },
    ).catch(() => []),
    supabaseServerAdminRequest<QueueStatus[]>(
      "/rest/v1/social_publish_queue?select=status&order=created_at.desc&limit=500",
      { method: "GET" },
    ).catch(() => []),
  ]);

  const countStatus = (rows: QueueStatus[], status: string) => rows.filter((row) => row.status === status).length;

  return (
    <Container className="py-10 space-y-8" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">AUTOMATION OPS</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">الأتمتة والتشغيل</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/50">
          هذه الصفحة تعرض فقط الطوابير الموجودة فعليًا في الإنتاج. لا تُظهر جداول أو وظائف غير موجودة كأنها صفر.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {jobs.map((job) => (
          <div key={job.table} className={`rounded-2xl border p-5 ${job.state === "available" ? "border-brand-gold/10 bg-black/15" : "border-red-500/20 bg-red-500/5"}`}>
            <p className="text-xs text-brand-cream/40">{job.label}</p>
            <p className="mt-2 font-mono text-xs text-brand-cream/30" dir="ltr">{job.table}</p>
            <p className="mt-3 text-3xl font-bold text-brand-gold">
              {job.count === null ? "غير متاح" : job.count.toLocaleString("ar-EG")}
            </p>
            <p className="mt-1 text-xs text-brand-cream/30">{job.state === "available" ? "متاح" : "تعذر الاستعلام"}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-brand-gold">طابور توليد الفيديو</h2>
            <Link href="/admin/videos" className="text-xs text-brand-gold/70 hover:text-brand-gold">فتح الطابور</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["pending", "قيد الانتظار"],
              ["processing", "قيد التنفيذ"],
              ["completed", "مكتمل"],
              ["failed", "فشل"],
            ].map(([status, label]) => (
              <div key={status} className="rounded-xl border border-brand-gold/8 bg-black/10 p-3">
                <p className="text-xs text-brand-cream/35">{label}</p>
                <p className="mt-1 text-xl font-bold text-brand-cream">{countStatus(videoQueue, status)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-brand-gold">طابور النشر الاجتماعي</h2>
            <Link href="/admin/social" className="text-xs text-brand-gold/70 hover:text-brand-gold">فتح مركز النشر</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["queued", "في الانتظار"],
              ["processing", "قيد التنفيذ"],
              ["published", "نُشر"],
              ["failed", "فشل"],
            ].map(([status, label]) => (
              <div key={status} className="rounded-xl border border-brand-gold/8 bg-black/10 p-3">
                <p className="text-xs text-brand-cream/35">{label}</p>
                <p className="mt-1 text-xl font-bold text-brand-cream">{countStatus(socialQueue, status)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/10 p-5 text-sm leading-7 text-brand-cream/50">
        التشغيل التلقائي للفيديو والنشر الاجتماعي يتم بواسطة العامل الخارجي المخصص للمشروع. مركز الإدارة يراقب الحالات ويسمح بالوصول إلى الطوابير الفعلية، بينما لا ينشئ جدولة مكررة من داخل لوحة الإدارة.
      </section>
    </Container>
  );
}
