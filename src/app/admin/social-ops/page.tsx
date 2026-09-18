export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "عمليات النشر الاجتماعي | الأدمن" };

type QueueRow = { id: string; content_type: string; content_id: string | null; title: string; target_platforms: string[]; status: string; scheduled_at: string | null; published_at: string | null; error_message: string | null; created_at: string; updated_at: string };

const statusLabel: Record<string,string> = { queued:"في الطابور", processing:"قيد التنفيذ", published:"منشور", partial:"جزئي", failed:"فشل" };

export default async function AdminSocialOpsPage() {
  await requireAdminPermission("social.manage");
  const queue = await supabaseServerAdminRequest<QueueRow[]>("/rest/v1/social_publish_queue?select=id,content_type,content_id,title,target_platforms,status,scheduled_at,published_at,error_message,created_at,updated_at&order=created_at.desc&limit=250", { method: "GET" }).catch(() => []);
  const counts = Object.fromEntries(Object.keys(statusLabel).map(s => [s, queue.filter(q=>q.status===s).length]));
  return <Container className="py-10 space-y-6" dir="rtl"><header><p className="text-xs tracking-[0.2em] text-brand-cream/30">SOCIAL OPERATIONS</p><h1 className="mt-2 text-3xl font-bold text-brand-gold">مركز النشر الاجتماعي</h1><p className="mt-2 text-sm leading-7 text-brand-cream/50">مراقبة طابور Facebook / Reels / YouTube، المواعيد، حالات التنفيذ، والأخطاء.</p><div className="mt-3"><Link href="/admin/social" className="text-xs text-brand-gold">فتح أدوات السوشيال الحالية →</Link></div></header><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(statusLabel).map(([key,label])=><div key={key} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-4"><p className="text-xs text-brand-cream/35">{label}</p><p className="mt-2 text-2xl font-bold text-brand-cream">{counts[key] ?? 0}</p></div>)}</section><div className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-sm"><thead className="bg-black/20"><tr>{['العنوان','النوع','المنصات','الحالة','الموعد','النشر','الخطأ','آخر تحديث'].map(h=><th key={h} className="px-4 py-3 text-right text-brand-gold/70">{h}</th>)}</tr></thead><tbody>{queue.map(q=><tr key={q.id} className="border-t border-brand-gold/8"><td className="px-4 py-3 text-brand-cream/80 font-medium">{q.title}</td><td className="px-4 py-3 text-brand-cream/45">{q.content_type}</td><td className="px-4 py-3 text-brand-cream/45">{q.target_platforms.join(' · ')}</td><td className="px-4 py-3"><span className={q.status==='failed'?'text-red-300':q.status==='published'?'text-emerald-300':'text-brand-cream/60'}>{statusLabel[q.status] ?? q.status}</span></td><td className="px-4 py-3 text-xs text-brand-cream/40">{q.scheduled_at ? new Date(q.scheduled_at).toLocaleString('ar-EG') : 'فوري'}</td><td className="px-4 py-3 text-xs text-brand-cream/40">{q.published_at ? new Date(q.published_at).toLocaleString('ar-EG') : '—'}</td><td className="px-4 py-3 max-w-[280px] truncate text-red-200/60">{q.error_message ?? '—'}</td><td className="px-4 py-3 text-xs text-brand-cream/35">{new Date(q.updated_at).toLocaleString('ar-EG')}</td></tr>)}</tbody></table></div>{queue.length===0&&<p className="p-8 text-center text-sm text-brand-cream/40">طابور النشر فارغ.</p>}</div></Container>;
}
