export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/lib/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "SEO وAdSense | الأدمن" };

type Setting = { key: string; value: Record<string, unknown> };

export default async function AdminSeoPage() {
  await requireAdminPermission("settings.manage");
  const settings = await supabaseServerAdminRequest<Setting[]>(
    "/rest/v1/site_settings?select=key,value&key=in.(homepage,seo,branding,social)&limit=20",
    { method: "GET" },
  ).catch(() => []);
  const articles = await supabaseServerAdminRequest<Array<{ id: string }>>("/rest/v1/articles?select=id&published=eq.true&limit=1000", { method: "GET" }).catch(() => []);
  const stories = await supabaseServerAdminRequest<Array<{ id: string }>>("/rest/v1/stories?select=id&published=eq.true&limit=1000", { method: "GET" }).catch(() => []);
  const library = await supabaseServerAdminRequest<Array<{ id: string }>>("/rest/v1/content_library?select=id&published=eq.true&limit=1000", { method: "GET" }).catch(() => []);

  const hasSetting = (key: string) => settings.some((item) => item.key === key);
  const checks = [
    ["Homepage metadata", hasSetting("homepage"), "site_settings/homepage"],
    ["SEO settings", hasSetting("seo"), "site_settings/seo"],
    ["Social metadata", hasSetting("social"), "site_settings/social"],
    ["Published articles", articles.length > 0, `${articles.length} منشور`],
    ["Published stories", stories.length > 0, `${stories.length} منشور`],
    ["Published library content", library.length > 0, `${library.length} منشور`],
  ] as const;

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header><p className="text-xs tracking-[0.2em] text-brand-cream/30">SEO / ADSENSE</p><h1 className="mt-2 text-3xl font-bold text-brand-gold">SEO والجاهزية للمونتزة</h1><p className="mt-2 text-sm leading-7 text-brand-cream/50">مركز تدقيق سريع لأساسيات العنوان، المحتوى المنشور، والسوشيال، مع روابط مباشرة للأصول العامة.</p></header>
      <div className="grid gap-3 md:grid-cols-2">
        {checks.map(([name, ok, detail]) => <div key={name} className={`rounded-2xl border p-5 ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-brand-cream">{name}</h2><span className={ok ? 'text-emerald-300' : 'text-amber-300'}>{ok ? 'OK' : 'راجع'}</span></div><p className="mt-2 text-xs text-brand-cream/40">{detail}</p></div>)}
      </div>
      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><h2 className="font-semibold text-brand-gold">الأصول العامة</h2><div className="mt-3 flex flex-wrap gap-2"><Link href="/sitemap.xml" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">Sitemap</Link><Link href="/robots.txt" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">Robots</Link><Link href="/" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">الموقع</Link></div></section>
    </Container>
  );
}
