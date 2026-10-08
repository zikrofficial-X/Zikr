export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Fragment } from "react";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import type { AdminAuditRow } from "@/features/admin/services/platform";

export const metadata: Metadata = { title: "سجل الإدارة | الأدمن" };

function outcomeClass(outcome: AdminAuditRow["outcome"]) {
  if (outcome === "success") return "text-emerald-300";
  if (outcome === "denied") return "text-amber-300";
  return "text-red-300";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; outcome?: string }>;
}) {
  await requireAdminPermission("audit.read");
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLocaleLowerCase();
  const outcomeFilter =
    params.outcome === "success" || params.outcome === "denied" || params.outcome === "failed"
      ? params.outcome
      : "";

  let rows: AdminAuditRow[] = [];
  let loadFailed = false;
  try {
    rows = await supabaseServerAdminRequest<AdminAuditRow[]>(
      "/rest/v1/admin_audit_events?select=id,action,permission,resource_type,resource_id,outcome,request_id,metadata,created_at,actor_user_id&order=created_at.desc&limit=300",
      { method: "GET" },
    );
  } catch {
    loadFailed = true;
  }

  const filteredRows = rows.filter((row) => {
    if (outcomeFilter && row.outcome !== outcomeFilter) return false;
    if (!query) return true;
    return [
      row.action,
      row.permission,
      row.resource_type,
      row.resource_id,
      row.request_id,
      row.actor_user_id,
    ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
  });

  return (
    <Container className="space-y-6 py-10" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.18em] text-brand-cream/30">الأمن والتدقيق</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">سجل الإدارة المركزي</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">
          سجل append-only للعمليات الإدارية مع البحث والتصفية ومعاينة metadata دون تعديل السجل الأصلي.
        </p>
      </header>

      <form method="get" className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="ابحث بالإجراء أو المورد أو الطلب…"
          className="rounded-xl border border-brand-gold/15 bg-black/15 px-4 py-3 text-sm text-brand-cream outline-none focus:border-brand-gold/40"
        />
        <select name="outcome" defaultValue={outcomeFilter} className="rounded-xl border border-brand-gold/15 bg-black/15 px-4 py-3 text-sm text-brand-cream">
          <option value="">كل النتائج</option>
          <option value="success">ناجح</option>
          <option value="denied">مرفوض</option>
          <option value="failed">فشل</option>
        </select>
        <button type="submit" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-5 py-3 text-sm font-semibold text-brand-gold">
          تصفية
        </button>
      </form>

      <p className="text-xs text-brand-cream/35">
        {loadFailed ? "تعذر تحميل سجل التدقيق." : `المعروض: ${filteredRows.length} من ${rows.length}`}
      </p>

      <div className="overflow-hidden rounded-2xl border border-brand-gold/10 bg-black/15">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-black/25 text-brand-gold/70">
              <tr>
                {["التاريخ", "الإجراء", "الصلاحية", "المورد", "النتيجة", "معرّف الطلب"].map((header) => (
                  <th key={header} className="px-4 py-3 text-right font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <Fragment key={row.id}>
                  <tr className="border-t border-brand-gold/8">
                    <td className="px-4 py-3 text-xs text-brand-cream/50">{new Date(row.created_at).toLocaleString("ar-EG-u-nu-latn")}</td>
                    <td className="px-4 py-3 font-medium text-brand-cream/85">{row.action}</td>
                    <td className="px-4 py-3 text-brand-cream/50">{row.permission ?? "—"}</td>
                    <td className="px-4 py-3 text-brand-cream/45">{row.resource_type ?? "—"}{row.resource_id ? ` / ${row.resource_id}` : ""}</td>
                    <td className={`px-4 py-3 font-semibold ${outcomeClass(row.outcome)}`}>{row.outcome}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-brand-cream/35">{row.request_id ?? "—"}</td>
                  </tr>
                  <tr className="border-t border-brand-gold/5 bg-black/10">
                    <td colSpan={6} className="px-4 py-2">
                      <details>
                        <summary className="cursor-pointer text-[11px] text-brand-cream/30">عرض metadata</summary>
                        <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-5 text-brand-cream/35">
                          {JSON.stringify(row.metadata ?? {}, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {loadFailed ? (
          <p role="alert" className="p-8 text-center text-sm text-red-200/85">
            تعذر قراءة سجل التدقيق من قاعدة البيانات. هذا لا يعني أن السجل فارغ.
          </p>
        ) : filteredRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-brand-cream/40">لا توجد أحداث مطابقة.</p>
        ) : null}
      </div>
    </Container>
  );
}
