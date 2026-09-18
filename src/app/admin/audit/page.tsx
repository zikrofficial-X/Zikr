export const dynamic = "force-dynamic";

import type { Metadata } from "next";
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

export default async function AdminAuditPage() {
  await requireAdminPermission("audit.read");
  const rows = await supabaseServerAdminRequest<AdminAuditRow[]>(
    "/rest/v1/admin_audit_events?select=id,action,permission,resource_type,resource_id,outcome,request_id,metadata,created_at,actor_user_id&order=created_at.desc&limit=200",
    { method: "GET" },
  ).catch(() => []);

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">ADMIN SECURITY</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">سجل الإدارة المركزي</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">سجل append-only للعمليات الإدارية، مع النتيجة، الصلاحية، المورد، ومعرّف الطلب.</p>
      </header>

      <div className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-black/25 text-brand-gold/70">
              <tr>
                {['التاريخ','الإجراء','الصلاحية','المورد','النتيجة','Request ID'].map((h) => <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-brand-gold/8">
                  <td className="px-4 py-3 text-brand-cream/50 text-xs">{new Date(row.created_at).toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 text-brand-cream/85 font-medium">{row.action}</td>
                  <td className="px-4 py-3 text-brand-cream/50">{row.permission ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-cream/45">{row.resource_type ?? '—'}{row.resource_id ? ` / ${row.resource_id}` : ''}</td>
                  <td className={`px-4 py-3 font-semibold ${outcomeClass(row.outcome)}`}>{row.outcome}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-brand-cream/35">{row.request_id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-brand-cream/40">لا توجد أحداث إدارية مسجلة.</p>}
      </div>
    </Container>
  );
}
