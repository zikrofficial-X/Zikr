"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Command, Search, X } from "lucide-react";

type AdminCommandItem = { href: string; label: string };
type AdminCommandGroup = { group: string; items: AdminCommandItem[] };

export function AdminCommandPalette({ groups }: { groups: AdminCommandGroup[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const normalized = query.trim().toLocaleLowerCase("ar");
  const results = useMemo(
    () => groups
      .flatMap((group) => group.items.map((item) => ({ ...item, group: group.group })))
      .filter((item) => !normalized || `${item.label} ${item.href} ${item.group}`.toLocaleLowerCase("ar").includes(normalized))
      .slice(0, 12),
    [groups, normalized],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0); }}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-gold/15 bg-black/15 px-3 py-2 text-xs text-brand-cream/55 transition hover:border-brand-gold/35 hover:text-brand-gold"
        aria-label="فتح البحث السريع في لوحة الإدارة"
      >
        <Search size={14} aria-hidden="true" />
        <span className="hidden sm:inline">بحث سريع</span>
        <kbd className="rounded border border-brand-gold/15 px-1.5 py-0.5 text-[10px] text-brand-cream/30">Ctrl K</kbd>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
          <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-brand-gold/20 bg-brand-emeraldDeep shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="admin-command-title" dir="rtl">
            <div className="flex items-center gap-3 border-b border-brand-gold/10 px-4 py-3">
              <Command size={18} className="shrink-0 text-brand-gold" aria-hidden="true" />
              <h2 id="admin-command-title" className="sr-only">البحث السريع في لوحة الإدارة</h2>
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم الصفحة أو المسار..." className="min-w-0 flex-1 bg-transparent text-sm text-brand-cream outline-none placeholder:text-brand-cream/35" autoComplete="off" />
              <button type="button" onClick={() => { setOpen(false); setQuery(""); }} className="rounded-lg p-2 text-brand-cream/45 hover:bg-brand-gold/10 hover:text-brand-gold" aria-label="إغلاق البحث السريع"><X size={16} /></button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.length ? results.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => { setOpen(false); setQuery(""); }} className="flex items-center justify-between rounded-xl px-3 py-3 text-right transition hover:bg-brand-gold/10" dir="rtl">
                  <span><span className="block text-sm font-semibold text-brand-cream/80">{item.label}</span><span className="mt-1 block text-[10px] text-brand-cream/35">{item.group} · <bdi dir="ltr">{item.href}</bdi></span></span>
                  <span className="text-brand-gold/45">↵</span>
                </Link>
              )) : <p className="px-3 py-10 text-center text-sm text-brand-cream/45">لا توجد صفحة مطابقة للبحث.</p>}
            </div>
            <p className="border-t border-brand-gold/10 px-4 py-2 text-[10px] text-brand-cream/30">اضغط Escape للإغلاق · البحث يلتزم بالصفحات المتاحة لدورك</p>
          </section>
        </div>
      ) : null}
    </>
  );
}
