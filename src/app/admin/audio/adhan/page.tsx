import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdhanRow = {
  id: string;
  title: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  is_primary: boolean;
  updated_at: string | null;
};

export default async function AudioAdhanPage() {
  await requireAdminPermission("audio.manage");
  const rows = await supabaseServerAdminRequest<AdhanRow[]>(
    "/rest/v1/site_audio_assets?kind=eq.adhan&select=id,title,storage_path,mime_type,size_bytes,is_primary,updated_at&order=is_primary.desc,created_at.desc&limit=100",
    { method: "GET" },
  ).catch(() => []);

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/audio" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مركز الصوت</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">AUDIO / ADHAN</p>
        <h1 className="text-3xl font-bold text-brand-gold">مكتبة الأذان</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          الأذان هنا من مكتبة الصوت البشرية العامة. الصفحة تعرض الحالة والملفات الأولية من site_audio_assets بدل الاعتماد على مسار صوت منفصل.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">ملفات الأذان</p><p className="mt-2 text-3xl font-bold text-brand-gold">{rows.length}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">الأساسي</p><p className="mt-2 text-3xl font-bold text-emerald-300">{rows.filter((row) => row.is_primary).length}</p></div>
        <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-5"><p className="text-xs text-brand-cream/35">المصدر</p><p className="mt-2 text-sm font-semibold text-sky-200" dir="ltr">site_audio_assets</p></div>
      </section>

      <section className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-brand-cream">{row.title}</h2>
                <p className="mt-1 text-xs text-brand-cream/35" dir="ltr">{row.mime_type} · {Math.round(row.size_bytes / 1024)} KB</p>
              </div>
              {row.is_primary ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-[11px] text-emerald-200">أساسي</span> : <span className="rounded-full border border-brand-gold/10 px-3 py-1 text-[11px] text-brand-cream/40">بديل</span>}
            </div>
            <p className="mt-3 break-all font-mono text-xs text-brand-cream/35" dir="ltr">{row.storage_path}</p>
            <p className="mt-2 text-[11px] text-brand-cream/25">آخر تحديث: {row.updated_at ? new Date(row.updated_at).toLocaleString("ar-EG-u-nu-latn") : "—"}</p>
          </article>
        ))}
        {rows.length === 0 && <p className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-6 text-center text-sm text-amber-200">لا توجد ملفات أذان مسجلة في الكتالوج الحالي.</p>}
      </section>

      <Link href="/admin/site-audio" className="inline-flex rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">إدارة كل الصوت</Link>
    </Container>
  );
}
