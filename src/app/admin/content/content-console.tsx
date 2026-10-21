"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scheduleContentPublishAction, cancelContentPublishAction, safeDeleteContentAction, safeTogglePublishAction } from "../content-actions";
import type { ManagedContentItem, ScheduledContentItem } from "@/features/admin/services/content";

type Props = { content: ManagedContentItem[]; scheduled: ScheduledContentItem[] };
const dateLabel = (value: string) => new Date(value).toLocaleString("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ContentConsole({ content, scheduled }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("الكل");
  const [status, setStatus] = useState("الكل");
  const [selected, setSelected] = useState<ManagedContentItem | null>(null);
  const types = ["الكل", ...new Set(content.map((item) => item.type))];
  const filtered = useMemo(() => content.filter((item) => {
    const matchesQuery = item.title.toLocaleLowerCase("ar").includes(query.trim().toLocaleLowerCase("ar"));
    const matchesType = type === "الكل" || item.type === type;
    const matchesStatus = status === "الكل" || (status === "منشور" ? item.published : !item.published);
    return matchesQuery && matchesType && matchesStatus;
  }), [content, query, status, type]);
  const scheduledByContent = new Map(scheduled.map((item) => [`${item.content_table}:${item.content_id}`, item]));

  return <div className="space-y-5" dir="rtl">
    <div className="grid gap-3 rounded-2xl border border-brand-gold/10 bg-black/15 p-4 lg:grid-cols-[1fr_auto_auto]">
      <label className="relative block"><Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-cream/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بعنوان المحتوى..." className="w-full rounded-xl border border-brand-gold/15 bg-black/20 py-2.5 pl-3 pr-10 text-sm text-brand-cream outline-none focus:border-brand-gold/40" /></label>
      <label className="flex items-center gap-2 rounded-xl border border-brand-gold/15 px-3 text-sm text-brand-cream/65"><Filter size={15} className="text-brand-gold" /><select value={type} onChange={(event) => setType(event.target.value)} className="bg-transparent py-2.5 outline-none">{types.map((item) => <option key={item} className="bg-[#071510]">{item}</option>)}</select></label>
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-brand-gold/15 bg-black/20 px-3 py-2.5 text-sm text-brand-cream outline-none"><option className="bg-[#071510]">الكل</option><option className="bg-[#071510]">منشور</option><option className="bg-[#071510]">مسودة</option></select>
    </div>

    <div className="flex items-center justify-between gap-3 text-xs text-brand-cream/50"><span>{filtered.length} عنصر مطابق</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />نشر مباشر <span className="mr-2 h-2 w-2 rounded-full bg-amber-300" />مجدول</span></div>
    <div className="overflow-hidden rounded-2xl border border-brand-gold/10 bg-black/15">
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-sm"><thead><tr className="border-b border-brand-gold/15 bg-black/20"><th className="px-5 py-3 text-brand-gold/70">العنصر</th><th className="px-4 py-3 text-brand-gold/70">الحالة</th><th className="px-4 py-3 text-brand-gold/70">الأداء</th><th className="px-4 py-3 text-brand-gold/70">آخر تحديث</th><th className="px-4 py-3 text-brand-gold/70">إجراء</th></tr></thead><tbody>{filtered.map((item) => {
        const queued = scheduledByContent.get(`${item.table}:${item.id}`);
        return <tr key={`${item.table}-${item.id}`} className="border-b border-brand-gold/8 transition hover:bg-brand-gold/5"><td className="px-5 py-4"><div className="max-w-[360px]"><p className="truncate font-semibold text-brand-cream/85">{item.title}</p><p className="mt-1 text-xs text-brand-cream/45">{item.type} · {item.table}</p></div></td><td className="px-4 py-4"><div className="flex flex-wrap gap-1.5"><Badge variant={item.published ? "secondary" : "outline"} className={item.published ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}>{item.published ? "منشور" : "مسودة"}</Badge>{queued ? <Badge variant="outline" className="border-sky-400/30 bg-sky-400/10 text-sky-200"><CalendarClock size={12} className="ml-1" />{dateLabel(queued.scheduled_at)}</Badge> : null}</div></td><td className="px-4 py-4 text-brand-cream/60 tabular-nums">{item.views ? item.views.toLocaleString("ar-EG-u-nu-latn") : "—"}<span className="mr-1 text-xs text-brand-cream/35">مشاهدة</span></td><td className="px-4 py-4 text-xs text-brand-cream/55">{dateLabel(item.updated_at)}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><form action={safeTogglePublishAction}><input type="hidden" name="table" value={item.table} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="updatedAt" value={item.updated_at} /><input type="hidden" name="next" value={item.published ? "false" : "true"} /><Button size="sm" variant="outline" type="submit">{item.published ? "إخفاء" : "نشر"}</Button></form>{!item.published && !queued ? <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(item)} className="text-sky-200 hover:text-sky-100"><CalendarClock size={14} className="ml-1" />جدولة</Button> : null}{queued ? <form action={cancelContentPublishAction}><input type="hidden" name="queueId" value={queued.id} /><Button size="sm" variant="ghost" type="submit" className="text-amber-200"><X size={14} className="ml-1" />إلغاء</Button></form> : null}<form action={safeDeleteContentAction}><input type="hidden" name="table" value={item.table} /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="updatedAt" value={item.updated_at} /><Button size="sm" variant="ghost" type="submit" className="text-red-300">حذف</Button></form></div></td></tr>;
      })}</tbody></table></div>
      {!filtered.length ? <div className="p-10 text-center text-sm text-brand-cream/50">لا توجد عناصر مطابقة لهذه الفلاتر.</div> : null}
    </div>

    {selected ? <div className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-sky-200/70">جدولة نشر آلي</p><h3 className="mt-1 text-lg font-bold text-brand-cream">{selected.title}</h3><p className="mt-1 text-sm text-brand-cream/50">سيقوم العامل الخلفي بنشر العنصر عند حلول الموعد.</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 text-brand-cream/50 hover:bg-white/5" aria-label="إغلاق"><X size={18} /></button></div><form action={scheduleContentPublishAction} className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="table" value={selected.table} /><input type="hidden" name="id" value={selected.id} /><label className="flex-1"><span className="mb-1 block text-xs text-brand-cream/55">موعد النشر</span><input required type="datetime-local" name="scheduledAt" min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} className="w-full rounded-xl border border-brand-gold/15 bg-black/30 px-3 py-2.5 text-sm text-brand-cream" /></label><Button type="submit" className="min-w-32"><Check size={15} className="ml-1" />حفظ الجدولة</Button></form></div> : null}
  </div>;
}
