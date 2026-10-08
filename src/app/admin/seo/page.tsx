export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "SEO وAdSense | الأدمن" };

type Setting = { key: string; value: Record<string, unknown> };

export default async function AdminSeoPage() {
  await requireAdminPermission("settings.manage");
  const read = async <T,>(path: string): Promise<{ rows: T[]; ok: boolean }> => {
    try {
      return { rows: await supabaseServerAdminRequest<T[]>(path, { method: "GET" }), ok: true };
    } catch {
      return { rows: [], ok: false };
    }
  };
  const [settingsRes, articlesRes, storiesRes, libraryRes] = await Promise.all([
    read<Setting>("/rest/v1/site_settings?select=key,value&key=in.(homepage,seo,branding,social)&limit=20"),
    read<{ id: string }>("/rest/v1/articles?select=id&published=eq.true&limit=1000"),
    read<{ id: string }>("/rest/v1/stories?select=id&published=eq.true&limit=1000"),
    read<{ id: string }>("/rest/v1/content_library?select=id&published=eq.true&limit=1000"),
  ]);
  const settings = settingsRes.rows;
  const articles = articlesRes.rows;
  const stories = storiesRes.rows;
  const library = libraryRes.rows;
  const countDetail = (res: { rows: { id: string }[]; ok: boolean }) =>
    !res.ok ? "تعذر قراءة البيانات" : res.rows.length >= 1000 ? "1000+ منشور" : `${res.rows.length} منشور`;

  const hasSetting = (key: string) => settings.some((item) => item.key === key);
  const checks = [
    ["Homepage metadata", settingsRes.ok && hasSetting("homepage"), settingsRes.ok ? "site_settings/homepage" : "تعذر قراءة الإعدادات"],
    ["SEO settings", settingsRes.ok && hasSetting("seo"), settingsRes.ok ? "site_settings/seo" : "تعذر قراءة الإعدادات"],
    ["Social metadata", settingsRes.ok && hasSetting("social"), settingsRes.ok ? "site_settings/social" : "تعذر قراءة الإعدادات"],
    ["Published articles", articlesRes.ok && articles.length > 0, countDetail(articlesRes)],
    ["Published stories", storiesRes.ok && stories.length > 0, countDetail(storiesRes)],
    ["Published library content", libraryRes.ok && library.length > 0, countDetail(libraryRes)],
  ] as const;

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header><p className="text-xs tracking-[0.2em] text-brand-cream/30">SEO والجاهزية للمونتزة</p><h1 className="mt-2 text-3xl font-bold text-brand-gold">SEO والجاهزية للمونتزة</h1><p className="mt-2 text-sm leading-7 text-brand-cream/50">مركز تدقيق سريع لأساسيات العنوان، المحتوى المنشور، والسوشيال، مع روابط مباشرة للأصول العامة.</p></header>
      <div className="grid gap-3 md:grid-cols-2">
        {checks.map(([name, ok, detail]) => <div key={name} className={`rounded-2xl border p-5 ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-brand-cream">{name}</h2><span className={ok ? 'text-emerald-300' : 'text-amber-300'}>{ok ? 'OK' : 'راجع'}</span></div><p className="mt-2 text-xs text-brand-cream/40">{detail}</p></div>)}
      </div>
      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><h2 className="font-semibold text-brand-gold">الأصول العامة</h2><div className="mt-3 flex flex-wrap gap-2"><Link href="/sitemap.xml" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">Sitemap</Link><Link href="/robots.txt" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">Robots</Link><Link href="/" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">الموقع</Link></div></section>
    </Container>
  );
}
