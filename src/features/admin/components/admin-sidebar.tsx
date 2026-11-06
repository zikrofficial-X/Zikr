"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Baby,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Clapperboard,
  Database,
  FilePenLine,
  FileText,
  FolderOpen,
  Gamepad2,
  HeartPulse,
  Headphones,
  Image,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  ListChecks,
  ListTodo,
  Mic2,
  PanelsTopLeft,
  PenLine,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  SearchCheck,
  ScrollText,
  Send,
  Settings2,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Swords,
  Tags,
  Users,
  UsersRound,
  Volume2,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: string };
export type AdminNavGroup = { key: string; group: string; icon: string; items: AdminNavItem[] };

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  baby: Baby,
  "badge-check": BadgeCheck,
  "bar-chart-3": BarChart3,
  bell: Bell,
  "book-open": BookOpen,
  bookmark: Bookmark,
  clapperboard: Clapperboard,
  database: Database,
  "file-pen-line": FilePenLine,
  "file-text": FileText,
  "folder-open": FolderOpen,
  "gamepad-2": Gamepad2,
  "heart-pulse": HeartPulse,
  headphones: Headphones,
  image: Image,
  layers: Layers,
  "layout-dashboard": LayoutDashboard,
  "layout-template": LayoutTemplate,
  library: Library,
  "list-checks": ListChecks,
  "list-todo": ListTodo,
  "mic-2": Mic2,
  "panels-top-left": PanelsTopLeft,
  "pen-line": PenLine,
  radio: Radio,
  "refresh-cw": RefreshCw,
  rocket: Rocket,
  search: Search,
  "search-check": SearchCheck,
  "scroll-text": ScrollText,
  send: Send,
  "settings-2": Settings2,
  "share-2": Share2,
  shield: Shield,
  "shield-check": ShieldCheck,
  smartphone: Smartphone,
  swords: Swords,
  tags: Tags,
  users: Users,
  "users-round": UsersRound,
  "volume-2": Volume2,
  "wand-sparkles": WandSparkles,
};

function resolveIcon(name: string | undefined, fallback: LucideIcon = Activity) {
  return (name && ICONS[name]) || fallback;
}

export function AdminIcon({ name, size = 16, strokeWidth = 1.8, className }: { name?: string; size?: number; strokeWidth?: number; className?: string }) {
  const Icon = resolveIcon(name);
  return createElement(Icon, { size, strokeWidth, "aria-hidden": true, className });
}

function isRouteMatch(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveHref(pathname: string, groups: AdminNavGroup[]) {
  return groups
    .flatMap((group) => group.items)
    .filter((item) => isRouteMatch(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function GroupHeading({ group, count }: { group: AdminNavGroup; count?: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 px-3 text-[10px] font-bold tracking-wide text-brand-gold/55" dir="rtl">
      <span className="inline-flex min-w-0 items-center gap-2">
        <AdminIcon name={group.icon} size={14} />
        <span className="truncate">{group.group}</span>
      </span>
      {count ? <span className="rounded-full border border-brand-gold/10 px-1.5 py-0.5 text-[9px] text-brand-cream/30">{group.items.length}</span> : null}
    </div>
  );
}

function NavItemLink({ item, active, compact = false }: { item: AdminNavItem; active: boolean; compact?: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-2.5 rounded-xl border text-sm transition-colors ${compact ? "px-2.5 py-2 text-xs" : "px-3 py-2.5"} ${active ? "border-brand-gold/25 bg-brand-gold/15 text-brand-gold" : "border-transparent text-brand-cream/60 hover:border-brand-gold/15 hover:bg-brand-gold/8 hover:text-brand-gold"}`}
      dir="rtl"
    >
      <AdminIcon name={item.icon} size={compact ? 14 : 16} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" aria-hidden="true" /> : null}
    </Link>
  );
}

export function AdminSidebar({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname, groups);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");
    if (!normalized) return groups;
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLocaleLowerCase("ar").includes(normalized)) }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-brand-gold/12 bg-black/35 lg:flex" style={{ backdropFilter: "blur(12px)", minHeight: "calc(100vh - 4rem)", position: "sticky", top: "4rem" }}>
      <div className="border-b border-brand-gold/10 px-5 py-5">
        <div className="flex items-center gap-3" dir="rtl">
          <span className="rounded-xl border border-brand-gold/20 bg-brand-gold/10 p-2 text-brand-gold"><LayoutDashboard size={18} aria-hidden="true" /></span>
          <div>
            <p className="text-sm font-bold text-brand-gold">لوحة التحكم الموحدة</p>
            <p className="mt-1 text-[11px] text-brand-cream/40">مركز إدارة وتشغيل منصة ذِكر</p>
          </div>
        </div>
      </div>
      <div className="px-4 pt-4">
        <label className="relative block">
          <span className="sr-only">البحث في أقسام الإدارة</span>
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-cream/35" />
          <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الأقسام..." aria-keyshortcuts="/" className="w-full rounded-xl border border-brand-gold/10 bg-black/20 py-2.5 pl-10 pr-10 text-sm text-brand-cream outline-none placeholder:text-brand-cream/30 focus:border-brand-gold/35" />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="مسح بحث أقسام الإدارة" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-cream/45 transition hover:bg-brand-gold/10 hover:text-brand-gold"><X size={14} aria-hidden="true" /></button> : <kbd className="absolute left-2 top-1/2 -translate-y-1/2 rounded border border-brand-gold/15 px-1.5 py-0.5 text-[10px] text-brand-cream/30">/</kbd>}
        </label>
        <p className="mt-2 text-[10px] text-brand-cream/25" aria-live="polite">{query ? `${filteredGroups.reduce((total, group) => total + group.items.length, 0)} نتيجة مطابقة` : "اضغط / للبحث السريع"}</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4" aria-label="التنقل الموحد في لوحة الإدارة">
        {filteredGroups.map((group) => (
          <section key={group.key} className="mb-5">
            <GroupHeading group={group} count />
            <ul className="space-y-1" role="list">
              {group.items.map((item) => <li key={item.href}><NavItemLink item={item} active={item.href === activeHref} /></li>)}
            </ul>
          </section>
        ))}
        {!filteredGroups.length ? <p className="rounded-xl border border-brand-gold/10 p-4 text-center text-xs text-brand-cream/45">لا توجد صفحة مطابقة للبحث.</p> : null}
      </nav>
      <div className="border-t border-brand-gold/10 px-4 py-4 text-center text-[10px] text-brand-cream/25" dir="rtl">صلاحيات حسب الدور · بيانات مباشرة · سجل تدقيق مركزي</div>
    </aside>
  );
}

export function AdminMobileNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname, groups);
  const activeGroup = useMemo(() => groups.find((group) => group.items.some((item) => item.href === activeHref)) ?? groups[0], [activeHref, groups]);
  const [open, setOpen] = useState<string | null>(activeGroup?.group ?? null);
  const [mobileQuery, setMobileQuery] = useState("");
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const filteredMobileGroups = useMemo(() => {
    const normalized = mobileQuery.trim().toLocaleLowerCase("ar");
    if (!normalized) return [];
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLocaleLowerCase("ar").includes(normalized) || item.href.toLocaleLowerCase("ar").includes(normalized)) }))
      .filter((group) => group.items.length > 0);
  }, [groups, mobileQuery]);

  useEffect(() => setOpen(activeGroup?.group ?? null), [activeGroup?.group]);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      event.preventDefault();
      mobileSearchInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <nav className="border-b border-brand-gold/15 bg-black/30 px-3 py-2 lg:hidden" aria-label="التنقل السريع في لوحة الإدارة">
      <div className="px-1 pb-2">
        <label className="relative block">
          <span className="sr-only">البحث في صفحات الإدارة على الهاتف</span>
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-cream/35" />
          <input ref={mobileSearchInputRef} value={mobileQuery} onChange={(event) => setMobileQuery(event.target.value)} placeholder="ابحث في صفحات الإدارة..." aria-label="البحث في صفحات الإدارة" aria-keyshortcuts="/" autoComplete="off" className="w-full rounded-xl border border-brand-gold/10 bg-black/20 py-2.5 pl-10 pr-10 text-sm text-brand-cream outline-none placeholder:text-brand-cream/30 focus:border-brand-gold/35" />
          {mobileQuery ? <button type="button" onClick={() => setMobileQuery("")} aria-label="مسح بحث صفحات الإدارة" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-cream/45 transition hover:bg-brand-gold/10 hover:text-brand-gold"><X size={14} aria-hidden="true" /></button> : null}
        </label>
      </div>
      <div className="flex items-center gap-2" dir="rtl">
        <label className="sr-only" htmlFor="admin-mobile-group">اختيار مجموعة الإدارة</label>
        <select id="admin-mobile-group" aria-label="اختيار مجموعة الإدارة" value={open ?? ""} onChange={(event) => { setMobileQuery(""); setOpen(event.target.value || null); }} className="min-w-0 flex-1 rounded-xl border border-brand-gold/15 bg-black/30 px-3 py-3 text-sm text-brand-cream outline-none focus:border-brand-gold/40">
          <option value="">اختر مجموعة الإدارة</option>
          {groups.map((group) => <option key={group.key} value={group.group}>{group.group} ({group.items.length})</option>)}
        </select>
        <Link href="/" className="shrink-0 rounded-xl border border-brand-gold/25 px-3 py-3 text-xs text-brand-gold/80 transition hover:bg-brand-gold/5">عرض الموقع</Link>
      </div>
      {mobileQuery.trim() ? (
        <div className="mt-2 space-y-3 rounded-xl border border-brand-gold/10 bg-black/20 p-2" role="region" aria-label="نتائج البحث في صفحات الإدارة">
          {filteredMobileGroups.length ? filteredMobileGroups.map((group) => <section key={group.key}><GroupHeading group={group} /><div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" dir="rtl">{group.items.map((item) => <NavItemLink key={item.href} item={item} active={item.href === activeHref} compact />)}</div></section>) : <p className="px-2 py-3 text-center text-xs text-brand-cream/45" role="status" dir="rtl">لا توجد صفحة مطابقة للبحث.</p>}
        </div>
      ) : open ? (
        <div className="mt-2 rounded-xl border border-brand-gold/10 bg-black/20 p-2">
          <div className="mb-2"><GroupHeading group={groups.find((group) => group.group === open) ?? groups[0]} /></div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" dir="rtl">{(groups.find((group) => group.group === open)?.items ?? []).map((item) => <NavItemLink key={item.href} item={item} active={item.href === activeHref} compact />)}</div>
        </div>
      ) : null}
    </nav>
  );
}
