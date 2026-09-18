export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "مصادر المحتوى | الأدمن" };

type Source = { id: string; name: string; source_type: string; base_url: string | null; reference: string | null; author: string | null; publisher: string | null; license: string | null; authority_level: number; verified: boolean; updated_at: string };

export default async function AdminSourcesPage() {
  await requireAdminPermission("sources.manage");
  const sources = await supabaseServerAdminRequest<Source[]>("/rest/v1/content_sources?select=id,name,source_type,base_url,reference,author,publisher,license,authority_level,verified,updated_at&order=authority_level.desc,name.asc&limit=300", { method: "GET" }).catch(() => []);
  return <Container className="py-10 space-y-6" dir="rtl"><header><p className="text-xs tracking-[0.2em] text-brand-cream/30">SOURCE GOVERNANCE</p><h1 className="mt-2 text-3xl font-bold text-brand-gold">مصادر المحتوى</h1><p className="mt-2 text-sm leading-7 text-brand-cream/50">جرد المصادر، المرجعية، الحقوق، ودرجة السلطة قبل اعتماد المحتوى.</p></header><div className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-black/20"><tr>{['المصدر','النوع','المرجعية','المؤلف/الناشر','الترخيص','السلطة','التحقق'].map(h=><th key={h} className="px-4 py-3 text-right text-brand-gold/70">{h}</th>)}</tr></thead><tbody>{sources.map(s=><tr key={s.id} className="border-t border-brand-gold/8"><td className="px-4 py-3 font-medium text-brand-cream/80">{s.name}</td><td className="px-4 py-3 text-brand-cream/45">{s.source_type}</td><td className="px-4 py-3 text-brand-cream/45">{s.reference ?? s.base_url ?? '—'}</td><td className="px-4 py-3 text-brand-cream/45">{[s.author,s.publisher].filter(Boolean).join(' · ') || '—'}</td><td className="px-4 py-3 text-brand-cream/45">{s.license ?? '—'}</td><td className="px-4 py-3 text-brand-gold">{s.authority_level}</td><td className="px-4 py-3">{s.verified ? <span className="text-emerald-300">موثّق</span> : <span className="text-amber-300">غير موثّق</span>}</td></tr>)}</tbody></table></div>{sources.length===0&&<p className="p-8 text-center text-sm text-brand-cream/40">لا توجد مصادر مسجلة.</p>}</div></Container>;
}
