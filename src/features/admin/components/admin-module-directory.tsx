"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Search, Star, X } from "lucide-react";

type NavigationItem = { href: string; label: string };
type NavigationGroup = { key: string; label: string; items: readonly NavigationItem[] };
type DirectoryModule = NavigationItem & { groupKey: string; groupLabel: string };

const FAVORITES_KEY = "zikr-admin-module-favorites-v1";
const RECENTS_KEY = "zikr-admin-module-recents-v1";

function readStringList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("ar");

export function AdminModuleDirectory({ groups }: { groups: readonly NavigationGroup[] }) {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const modules = useMemo<DirectoryModule[]>(
    () => groups.flatMap((group) => group.items.map((item) => ({
      ...item, groupKey: group.key, groupLabel: group.label,
    }))),
    [groups],
  );
  const moduleByHref = useMemo(
    () => new Map(modules.map((item) => [item.href, item])),
    [modules],
  );

  useEffect(() => {
    setFavorites(readStringList(window.localStorage.getItem(FAVORITES_KEY)));
    setRecent(readStringList(window.localStorage.getItem(RECENTS_KEY)).slice(0, 5));
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && (
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      ));
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape") {
        setQuery("");
        if (document.activeElement === searchRef.current) searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const toggleFavorite = (href: string) => {
    setFavorites((current) => {
      const next = current.includes(href)
        ? current.filter((item) => item !== href)
        : [href, ...current];
      try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* session-only fallback */ }
      return next;
    });
  };

  const recordRecent = (href: string) => {
    setRecent((current) => {
      const next = [href, ...current.filter((item) => item !== href)].slice(0, 5);
      try { window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* non-critical preference */ }
      return next;
    });
  };

  const normalizedQuery = normalize(query);
  const visibleGroups = useMemo(
    () => groups.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        (groupFilter === "all" || group.key === groupFilter) &&
        (!normalizedQuery ||
          normalize(item.label).includes(normalizedQuery) ||
          normalize(item.href).includes(normalizedQuery) ||
          normalize(group.label).includes(normalizedQuery)),
      ),
    })).filter((group) => group.items.length > 0),
    [groups, groupFilter, normalizedQuery],
  );

  const favoritesList = favorites.map((href) => moduleByHref.get(href))
    .filter((item): item is DirectoryModule => Boolean(item));
  const recentList = recent.map((href) => moduleByHref.get(href))
    .filter((item): item is DirectoryModule => Boolean(item));
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const visible = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);

  const renderCards = (items: readonly DirectoryModule[]) => (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const favorite = favorites.includes(item.href);
        return (
          <div key={item.href} className="flex min-w-0 items-stretch gap-1 rounded-xl border border-brand-gold/10 bg-black/15 transition hover:border-brand-gold/25 hover:bg-brand-gold/5">
            <Link href={item.href} onClick={() => recordRecent(item.href)} className="min-w-0 flex-1 rounded-xl px-3 py-3 text-right outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60" dir="rtl">
              <span className="block break-words text-sm font-semibold text-brand-cream/80">{item.label}</span>
              <span className="mt-1 block truncate font-mono text-[10px] text-brand-cream/30" dir="ltr">{item.href}</span>
              <span className="mt-1 block text-[10px] text-brand-gold/50">{item.groupLabel}</span>
            </Link>
            <button type="button" onClick={() => toggleFavorite(item.href)} aria-pressed={favorite}
              aria-label={favorite ? "إزالة " + item.label + " من المفضلة" : "إضافة " + item.label + " إلى المفضلة"}
              title={favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
              className="m-1 inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg text-brand-gold/60 transition hover:bg-brand-gold/10 hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60">
              <Star size={15} aria-hidden="true" className={favorite ? "fill-brand-gold text-brand-gold" : ""} />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="space-y-4" dir="rtl" aria-labelledby="admin-module-directory-title">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.14em] text-brand-cream/35">مساحة العمل</p>
          <h2 id="admin-module-directory-title" className="mt-1 text-xl font-bold text-brand-gold">دليل أقسام الإدارة</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-brand-cream/45">
            ابحث باسم الصفحة أو مسارها، ثبّت أقسامك المفضلة، وارجع إلى آخر الصفحات التي فتحتها.
          </p>
        </div>
        <span className="rounded-full border border-brand-gold/15 px-3 py-1.5 text-xs text-brand-cream/50">{total} صفحة متاحة لدورك</span>
      </header>

      <div className="rounded-2xl border border-brand-gold/12 bg-black/15 p-3 sm:p-4">
        <label className="relative block">
          <span className="sr-only">البحث في أقسام الإدارة</span>
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-cream/35" />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم الصفحة أو مسارها أو مجموعتها..." aria-keyshortcuts="Control+K Meta+K /"
            autoComplete="off" className="w-full rounded-xl border border-brand-gold/15 bg-black/25 py-3 pl-11 pr-10 text-sm text-brand-cream outline-none placeholder:text-brand-cream/30 focus:border-brand-gold/40 focus:ring-2 focus:ring-brand-gold/10" />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="مسح البحث"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-brand-cream/50 hover:bg-brand-gold/10 hover:text-brand-gold">
              <X size={14} aria-hidden="true" />
            </button>
          ) : <kbd className="absolute left-3 top-1/2 -translate-y-1/2 rounded border border-brand-gold/15 px-1.5 py-0.5 text-[10px] text-brand-cream/30">Ctrl K</kbd>}
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="تصفية صفحات الإدارة حسب المجموعة">
          <button type="button" onClick={() => setGroupFilter("all")} aria-pressed={groupFilter === "all"}
            className={"shrink-0 rounded-full border px-3 py-2 text-xs transition " + (groupFilter === "all" ? "border-brand-gold/35 bg-brand-gold/10 text-brand-gold" : "border-brand-gold/10 text-brand-cream/50 hover:text-brand-gold")}>كل الأقسام</button>
          {groups.map((group) => (
            <button key={group.key} type="button" onClick={() => setGroupFilter(group.key)} aria-pressed={groupFilter === group.key}
              className={"shrink-0 rounded-full border px-3 py-2 text-xs transition " + (groupFilter === group.key ? "border-brand-gold/35 bg-brand-gold/10 text-brand-gold" : "border-brand-gold/10 text-brand-cream/50 hover:text-brand-gold")}>{group.label}</button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-brand-cream/35" aria-live="polite">
          {normalizedQuery || groupFilter !== "all" ? "يعرض " + visible + " من " + total + " صفحة." : "اختصار البحث: Ctrl+K أو / · اضغط Escape لمسح البحث"}
        </p>
      </div>

      {!normalizedQuery && groupFilter === "all" && favoritesList.length > 0 ? (
        <section className="space-y-2" aria-labelledby="admin-favorites-title">
          <div className="flex items-center gap-2"><Star size={15} aria-hidden="true" className="fill-brand-gold text-brand-gold" /><h3 id="admin-favorites-title" className="font-semibold text-brand-cream">المفضلة</h3><span className="text-[11px] text-brand-cream/30">{favoritesList.length}</span></div>
          {renderCards(favoritesList)}
        </section>
      ) : null}

      {!normalizedQuery && groupFilter === "all" && recentList.length > 0 ? (
        <section className="space-y-2" aria-labelledby="admin-recent-title">
          <div className="flex items-center gap-2"><Clock3 size={15} aria-hidden="true" className="text-brand-gold/75" /><h3 id="admin-recent-title" className="font-semibold text-brand-cream">تم فتحها مؤخراً</h3><span className="text-[11px] text-brand-cream/30">آخر {recentList.length}</span></div>
          {renderCards(recentList)}
        </section>
      ) : null}

      <div className="space-y-5">
        {visibleGroups.map((group) => {
          const cards = group.items.map((item) => moduleByHref.get(item.href))
            .filter((item): item is DirectoryModule => Boolean(item));
          return (
            <section key={group.key} className="space-y-2" aria-labelledby={"admin-module-group-" + group.key}>
              <div className="flex items-center justify-between gap-3">
                <h3 id={"admin-module-group-" + group.key} className="font-semibold text-brand-cream">{group.label}</h3>
                <span className="rounded-full border border-brand-gold/10 px-2.5 py-1 text-[10px] text-brand-cream/40">{cards.length} صفحة</span>
              </div>
              {renderCards(cards)}
            </section>
          );
        })}
        {visible === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-gold/15 px-4 py-10 text-center" role="status">
            <Search size={21} aria-hidden="true" className="mx-auto text-brand-cream/30" />
            <p className="mt-3 text-sm font-semibold text-brand-cream/60">لا توجد صفحات مطابقة</p>
            <p className="mt-1 text-xs text-brand-cream/35">جرّب كلمة مختلفة أو اعرض كل الأقسام.</p>
            <button type="button" onClick={() => { setQuery(""); setGroupFilter("all"); }} className="mt-3 rounded-lg border border-brand-gold/20 px-3 py-2 text-xs text-brand-gold hover:bg-brand-gold/10">إعادة تعيين البحث</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
