import { requireAdminPermission } from "@/features/admin/services/admin";
import { readAdminRows } from "@/features/admin/services/safe-read";
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs";

export const dynamic = "force-dynamic";

type QueueRow = { id?: string; status?: string; created_at?: string; updated_at?: string; error_message?: string | null };
type QueueCard = { key: string; title: string; href: string; rows: QueueRow[]; ok: boolean; statuses: string[] };

async function loadQueue(path: string) {
  return readAdminRows<QueueRow>(path);
}

function statusLabel(status: string) {
  return ({ pending: "انتظار", queued: "انتظار", processing: "معالجة", retry_wait: "إعادة المحاولة", partial: "جزئي", failed: "فشل", published: "منشور", completed: "مكتمل" } as Record<string, string>)[status] ?? status;
}

function QueueCard({ queue }: { queue: QueueCard }) {
  const counts = queue.statuses.map((status) => [status, queue.rows.filter((row) => row.status === status).length] as const);
  const failed = queue.rows.filter((row) => row.status === "failed").length;
  return (
    <section className="rounded-3xl border border-brand-gold/10 bg-black/15 p-5" aria-labelledby={`${queue.key}-heading`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${queue.key}-heading`} className="text-lg font-bold text-brand-gold">{queue.title}</h2>
          <p className="mt-1 text-xs text-brand-cream/40">{queue.ok ? `${queue.rows.length} عنصر في آخر قراءة` : "تعذر قراءة الطابور"}</p>
        </div>
        <a href={queue.href} className="rounded-xl border border-brand-gold/20 px-3 py-2 text-xs text-brand-gold hover:bg-brand-gold/10">فتح المركز</a>
      </div>
      {!queue.ok ? (
        <div role="alert" className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-sm text-amber-100/80">البيانات غير متاحة حاليًا، ولم يتم تحويلها إلى أصفار.</div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {counts.map(([status, count]) => <div key={status} className={`rounded-xl border p-3 ${status === "failed" ? "border-red-400/25 bg-red-400/[0.06] text-red-100" : "border-brand-gold/8 bg-black/10 text-brand-cream"}`}><p className="text-[11px] opacity-60">{statusLabel(status)}</p><p className="mt-1 text-2xl font-bold tabular-nums">{count.toLocaleString("ar-EG-u-nu-latn")}</p></div>)}
          </div>
          <p className={`mt-4 text-xs ${failed ? "text-red-200" : "text-emerald-200/75"}`}>{failed ? `${failed} عنصر يحتاج إلى تدخل` : "لا يوجد فشل مسجل في القراءة الحالية"}</p>
        </>
      )}
    </section>
  );
}

export default async function AdminQueuesPage() {
  await requireAdminPermission("dashboard.view");
  const [video, social, content, translation] = await Promise.all([
    loadQueue("/rest/v1/video_generation_requests?select=id,status,created_at,updated_at,error_message&order=created_at.desc&limit=200"),
    loadQueue("/rest/v1/social_publish_queue?select=id,status,created_at,updated_at,error_message&order=created_at.desc&limit=200"),
    loadQueue("/rest/v1/content_publish_queue?select=id,status,created_at,updated_at,error_message&order=created_at.desc&limit=200"),
    loadQueue("/rest/v1/content_translation_queue?select=id,status,created_at,updated_at,error_message&order=created_at.desc&limit=200"),
  ]);
  const queues: QueueCard[] = [
    { key: "video", title: "طابور الفيديو", href: "/admin/video/requests", rows: video.rows, ok: video.ok, statuses: ["pending", "processing", "retry_wait", "failed"] },
    { key: "social", title: "طابور النشر الاجتماعي", href: "/admin/social", rows: social.rows, ok: social.ok, statuses: ["queued", "processing", "partial", "failed"] },
    { key: "content", title: "طابور نشر المحتوى", href: "/admin/editorial", rows: content.rows, ok: content.ok, statuses: ["queued", "processing", "published", "failed"] },
    { key: "translation", title: "طابور الترجمة", href: "/admin/content", rows: translation.rows, ok: translation.ok, statuses: ["queued", "processing", "completed", "failed"] },
  ];
  return <div className="mx-auto max-w-[1800px] space-y-6 p-4 md:p-8" dir="rtl">
    <AdminBreadcrumbs current="مركز الطوابير" />
    <header><p className="text-xs tracking-[0.18em] text-brand-cream/30">OPERATIONS QUEUE CENTER</p><h1 className="mt-2 text-3xl font-bold text-brand-gold">مركز الطوابير</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/50">قراءة موحدة للطوابير التشغيلية مع إبقاء حالة البيانات غير المتاحة واضحة.</p></header>
    <div className="grid gap-4 xl:grid-cols-2">{queues.map((queue) => <QueueCard key={queue.key} queue={queue} />)}</div>
  </div>;
}
