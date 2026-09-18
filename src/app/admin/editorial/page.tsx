export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { changeEditorialReviewStatusAction, publishApprovedContentAction } from "../editorial-actions";

export const metadata: Metadata = { title: "سير العمل التحريري | الأدمن" };

type Row = {
  id: string;
  title_ar: string;
  title_en: string | null;
  review_status: string;
  published: boolean;
  source_id: string | null;
  updated_at: string;
  author_name: string | null;
  reviewer_name: string | null;
};

const STATUS = ["draft", "editorial_review", "scholarly_review", "approved", "rejected"] as const;
const label: Record<string, string> = {
  draft: "مسودة",
  editorial_review: "مراجعة تحريرية",
  scholarly_review: "مراجعة شرعية",
  approved: "معتمد",
  rejected: "مرفوض",
};

export default async function AdminEditorialPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireAdminPermission("knowledge.manage");
  const params = searchParams ? await searchParams : {};
  const rows = await supabaseServerAdminRequest<Row[]>(
    "/rest/v1/content_library?select=id,title_ar,title_en,review_status,published,source_id,updated_at,author_name,reviewer_name&order=updated_at.desc&limit=200",
    { method: "GET" },
  ).catch(() => []);
  const pending = rows.filter((row) => row.review_status !== "approved" && !row.published).length;
  const approved = rows.filter((row) => row.review_status === "approved" && !row.published).length;
  const published = rows.filter((row) => row.published).length;

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">EDITORIAL WORKFLOW</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">السير التحريري</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">مسودة ← مراجعة تحريرية ← مراجعة شرعية ← اعتماد ← نشر. النشر لا يتم إلا بعد الاعتماد وربط مصدر.</p>
      </header>

      {params.error && (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {params.error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">بانتظار المراجعة</p>
          <p className="mt-2 text-3xl font-bold text-amber-200">{pending}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">معتمد وبانتظار النشر</p>
          <p className="mt-2 text-3xl font-bold text-emerald-200">{approved}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">منشور</p>
          <p className="mt-2 text-3xl font-bold text-brand-cream">{published}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-black/20">
              <tr>
                {["العنوان", "الحالة", "الكاتب", "المراجع", "المصدر", "آخر تعديل", "الإجراء"].map((h) => (
                  <th key={h} className="px-4 py-3 text-right text-brand-gold/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-brand-gold/8">
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-cream/80">{row.title_ar}</div>
                    {row.title_en && <div className="mt-1 text-xs text-brand-cream/30">{row.title_en}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-brand-gold/15 px-2 py-1 text-xs text-brand-cream/60">{label[row.review_status] ?? row.review_status}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-cream/45">{row.author_name ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-cream/45">{row.reviewer_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {row.source_id ? (
                      <span className="text-emerald-300">مرتبط</span>
                    ) : (
                      <span className="text-amber-300">مطلوب قبل النشر</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-cream/40">{new Date(row.updated_at).toLocaleString("ar-EG")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {STATUS.map((next) => (
                        <form key={next} action={changeEditorialReviewStatusAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="updatedAt" value={row.updated_at} />
                          <input type="hidden" name="status" value={next} />
                          <button type="submit" className="rounded-lg border border-brand-gold/10 px-2.5 py-1.5 text-xs text-brand-gold/80 hover:bg-brand-gold/10">{label[next]}</button>
                        </form>
                      ))}
                      {row.review_status === "approved" && !row.published && (
                        <form action={publishApprovedContentAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="updatedAt" value={row.updated_at} />
                          <button type="submit" disabled={!row.source_id} className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-200 disabled:cursor-not-allowed disabled:opacity-30">
                            {row.source_id ? "نشر" : "اربط المصدر أولًا"}
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-brand-cream/40">لا توجد عناصر في مكتبة المحتوى.</p>}
      </section>
    </Container>
  );
}
