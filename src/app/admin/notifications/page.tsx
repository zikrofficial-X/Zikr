export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { createAdminNotificationAction, markAdminNotificationsReadAction } from "@/app/admin/system-actions";

export const metadata: Metadata = { title: "تنبيهات الإدارة | الأدمن" };

type NotificationRow = { id: string; title: string; body: string; type: string | null; read: boolean; metadata: Record<string, unknown> | null; created_at: string };

export default async function AdminNotificationsPage() {
  await requireAdminPermission("notifications.manage");
  const rows = await supabaseServerAdminRequest<NotificationRow[]>(
    "/rest/v1/notifications?select=id,title,body,type,read,metadata,created_at&user_id=is.null&order=created_at.desc&limit=100",
    { method: "GET" },
  ).catch(() => []);

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-brand-cream/30">إدارة التنبيهات</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-gold">تنبيهات الإدارة</h1>
          <p className="mt-2 text-sm leading-7 text-brand-cream/50">قناة تشغيلية للتنبيهات العامة الخاصة بالإدارة، مع سجل تدقيق.</p>
        </div>
        <form action={markAdminNotificationsReadAction}><button className="rounded-xl border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">تحديد الكل كمقروء</button></form>
      </header>

      <form action={createAdminNotificationAction} className="grid gap-3 rounded-2xl border border-brand-gold/10 bg-black/15 p-5 md:grid-cols-2">
        <input name="title" required placeholder="عنوان التنبيه" className="rounded-xl border border-brand-gold/10 bg-black/20 px-3 py-2.5 text-sm text-brand-cream" />
        <input name="type" defaultValue="admin" placeholder="النوع" className="rounded-xl border border-brand-gold/10 bg-black/20 px-3 py-2.5 text-sm text-brand-cream" />
        <textarea name="body" required placeholder="نص التنبيه" rows={3} className="md:col-span-2 rounded-xl border border-brand-gold/10 bg-black/20 px-3 py-2.5 text-sm text-brand-cream" />
        <input name="link" placeholder="رابط اختياري مثل /admin/health" className="rounded-xl border border-brand-gold/10 bg-black/20 px-3 py-2.5 text-sm text-brand-cream" />
        <button type="submit" className="rounded-xl border border-brand-gold/25 px-4 py-2.5 text-sm font-semibold text-brand-gold hover:bg-brand-gold/10">إنشاء تنبيه</button>
      </form>

      <section className="space-y-3">
        {rows.map((row) => {
          const link = typeof row.metadata?.link === "string" ? row.metadata.link : null;
          return <article key={row.id} className={`rounded-2xl border p-4 ${row.read ? 'border-brand-gold/8 bg-black/10' : 'border-brand-gold/20 bg-brand-gold/5'}`}>
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-brand-cream">{row.title}</h2><time className="text-[11px] text-brand-cream/30">{new Date(row.created_at).toLocaleString('ar-EG-u-nu-latn')}</time></div>
            <p className="mt-2 text-sm leading-7 text-brand-cream/55">{row.body}</p>
            {link && <a className="mt-2 inline-block text-xs text-brand-gold" href={link}>فتح الرابط</a>}
          </article>;
        })}
        {rows.length === 0 && <p className="rounded-2xl border border-brand-gold/10 p-8 text-center text-sm text-brand-cream/40">لا توجد تنبيهات.</p>}
      </section>
    </Container>
  );
}
