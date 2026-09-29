export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "مصادر المحتوى | الأدمن" };

type Source = {
  id: string;
  name_ar: string;
  name_en: string | null;
  source_type: string;
  url: string | null;
  license: string | null;
  attribution: string | null;
  authority_level: number;
  verified: boolean;
  notes: string | null;
  updated_at: string;
};

export default async function AdminSourcesPage() {
  await requireAdminPermission("sources.manage");

  const sources = await supabaseServerAdminRequest<Source[]>(
    "/rest/v1/content_sources?select=id,name_ar,name_en,source_type,url,license,attribution,authority_level,verified,notes,updated_at&order=authority_level.desc,name_ar.asc&limit=300",
    { method: "GET" },
  ).catch((error) => {
    console.error("[admin/sources] failed to load sources:", error);
    return [];
  });

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">SOURCE GOVERNANCE</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">مصادر المحتوى</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">
          جرد المصادر والحقوق ودرجة السلطة قبل اعتماد المحتوى للنشر.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">إجمالي المصادر</p>
          <p className="mt-2 text-3xl font-bold text-brand-gold">{sources.length.toLocaleString("ar-EG")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
          <p className="text-xs text-brand-cream/35">مصادر موثقة</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">
            {sources.filter((source) => source.verified).length.toLocaleString("ar-EG")}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
          <p className="text-xs text-brand-cream/35">تحتاج مراجعة</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">
            {sources.filter((source) => !source.verified).length.toLocaleString("ar-EG")}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-black/20">
              <tr>
                {["المصدر", "النوع", "الرابط", "الحقوق/النسب", "السلطة", "التحقق", "آخر تحديث"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-right text-brand-gold/70">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-t border-brand-gold/8 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-cream/85">{source.name_ar || source.name_en || "بدون اسم"}</div>
                    {source.name_en && <div className="mt-1 text-xs text-brand-cream/35" dir="ltr">{source.name_en}</div>}
                  </td>
                  <td className="px-4 py-3 text-brand-cream/45">{source.source_type || "—"}</td>
                  <td className="px-4 py-3 max-w-[280px]">
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="block truncate text-brand-gold/70 hover:text-brand-gold" dir="ltr">
                        {source.url}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-cream/45">
                    {[source.license, source.attribution].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-brand-gold">{source.authority_level}</td>
                  <td className="px-4 py-3">
                    {source.verified ? <span className="text-emerald-300">موثّق</span> : <span className="text-amber-300">غير موثّق</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-cream/40">
                    {source.updated_at ? new Date(source.updated_at).toLocaleString("ar-EG") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sources.length === 0 && (
          <p className="p-8 text-center text-sm text-brand-cream/40">لا توجد مصادر مسجلة حاليًا.</p>
        )}
      </section>
    </Container>
  );
}
