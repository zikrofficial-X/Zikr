"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Session, User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { SITE_CATALOG } from "@/lib/navigation/catalog";
import { useLanguage } from "./language-provider";

type MobileNavProps = { isAuthenticated?: boolean };

type IconName = string;

function resolveIcon(name?: IconName): LucideIcon {
  if (!name) return Icons.Circle;
  const candidate = (Icons as unknown as Record<string, unknown>)[name];
  return (typeof candidate === "function" || (typeof candidate === "object" && candidate !== null)) ? (candidate as LucideIcon) : Icons.Circle;
}

const utilityLinks = [
  { href: "/about", ar: "عن المنصة", en: "About ZIKR", icon: "Info" },
  { href: "/platform", ar: "دليل الاستخدام", en: "Platform guide", icon: "BookOpenCheck" },
  { href: "/faq", ar: "الأسئلة الشائعة", en: "Frequently asked questions", icon: "CircleHelp" },
  { href: "/contact", ar: "تواصل معنا", en: "Contact us", icon: "Mail" },
  { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy policy", icon: "ShieldCheck" },
  { href: "/editorial-policy", ar: "المصادر ومعايير التحرير", en: "Sources & editorial policy", icon: "FileCheck2" },
  { href: "/terms", ar: "الشروط والأحكام", en: "Terms", icon: "ClipboardList" },
];

const bottomLinks = [
  { href: "/", ar: "الرئيسية", en: "Home", icon: "House" },
  { href: "/quran", ar: "القرآن", en: "Quran", icon: "BookOpen" },
  { href: "/adhkar", ar: "الأذكار", en: "Adhkar", icon: "MoonStar" },
  { href: "/prayer-times", ar: "الصلاة", en: "Prayer", icon: "Clock3" },
];

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

export function MobileNav({ isAuthenticated = false }: MobileNavProps) {
  const pathname = usePathname() ?? "/";
  const { isEnglish, dir } = useLanguage();
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [menuQuery, setMenuQuery] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  const activeGroupId = useMemo(
    () =>
      SITE_CATALOG.find((group) =>
        group.items.some((item) => isCurrentPath(pathname, item.href)),
      )?.id ?? null,
    [pathname],
  );

  const searchNeedle = menuQuery.trim().toLocaleLowerCase(isEnglish ? "en" : "ar");
  const filteredGroups = useMemo(
    () =>
      SITE_CATALOG.map((group) => {
        const groupMatches = [
          group.ar,
          group.en,
          group.descriptionAr,
          group.descriptionEn,
        ].some((value) => value.toLocaleLowerCase(isEnglish ? "en" : "ar").includes(searchNeedle));
        const visibleItems = groupMatches
          ? group.items
          : group.items.filter((item) =>
              [item.ar, item.en, item.descriptionAr, item.descriptionEn]
                .some((value) => value.toLocaleLowerCase(isEnglish ? "en" : "ar").includes(searchNeedle)),
            );
        return { ...group, visibleItems };
      }).filter((group) => !searchNeedle || group.visibleItems.length > 0),
    [isEnglish, searchNeedle],
  );
  const filteredUtilityLinks = useMemo(
    () => utilityLinks.filter((item) =>
      [item.ar, item.en].some((value) =>
        value.toLocaleLowerCase(isEnglish ? "en" : "ar").includes(searchNeedle),
      ),
    ),
    [isEnglish, searchNeedle],
  );

  useEffect(() => {
    if (activeGroupId) setExpandedGroup(activeGroupId);
  }, [activeGroupId]);

  useEffect(() => {
    setOpen(false);
    setMenuQuery("");
  }, [pathname]);
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      setAuthResolved(true);
      return;
    }

    const supabase = createClient();
    let alive = true;

    const syncUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (alive) setUser(currentUser);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setAuthResolved(true);
      }
    };

    void syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (!alive) return;
        setUser(session?.user ?? null);
        setAuthResolved(true);
      },
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    searchInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (menuButton && menuButton.offsetParent !== null) menuButton.focus();
    };
  }, [open]);

  const showAuthenticated = authResolved ? Boolean(user) : isAuthenticated;
  const isNavigationExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/kids");

  if (isNavigationExcluded) return null;

  return (
    <>
      {open ? (
        <>
          <button
            type="button"
            aria-label={isEnglish ? "Close navigation menu" : "إغلاق قائمة التنقل"}
            className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-navigation-dialog"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-dialog-title"
            dir={dir}
            className="fixed inset-y-0 end-0 z-[60] flex h-[100dvh] max-h-[100dvh] w-[min(23rem,92vw)] flex-col overflow-hidden border-s border-brand-gold/20 bg-brand-emeraldDeep shadow-2xl outline-none lg:hidden"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-brand-gold/15 px-5 py-4">
              <div>
                <p id="mobile-navigation-dialog-title" className="text-xl font-bold text-brand-gold">ذِكرٌ</p>
                <p className="mt-1 text-xs text-brand-cream/60">
                  {isEnglish ? "Explore the platform" : "استكشف أقسام المنصة"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-gold/15 text-brand-gold hover:bg-brand-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold"
                aria-label={isEnglish ? "Close" : "إغلاق"}
              >
                <Icons.X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <div className="mb-4 rounded-2xl border border-brand-gold/15 bg-black/20 p-3">
                <label htmlFor="mobile-platform-menu-search" className="mb-2 block text-xs font-semibold text-brand-gold">
                  {isEnglish ? "Find a section or tool" : "ابحث عن قسم أو أداة"}
                </label>
                <div className="flex items-center gap-2">
                  <Icons.Search className="h-4 w-4 shrink-0 text-brand-cream/45" aria-hidden="true" />
                  <input
                    ref={searchInputRef}
                    id="mobile-platform-menu-search"
                    type="search"
                    value={menuQuery}
                    onChange={(event) => setMenuQuery(event.target.value)}
                    placeholder={isEnglish ? "Quran, prayer, stories…" : "القرآن، الصلاة، القصص…"}
                    autoComplete="off"
                    className="min-w-0 min-h-11 flex-1 bg-transparent text-sm text-brand-cream outline-none placeholder:text-brand-cream/35"
                  />
                  {menuQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="min-h-9 rounded-lg px-2 text-xs text-brand-gold hover:bg-brand-gold/10"
                    >
                      {isEnglish ? "Clear" : "مسح"}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mb-4 rounded-2xl border border-brand-gold/15 bg-brand-gold/5 p-3">
                {showAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Icons.UserCircle2 className="h-5 w-5 text-brand-gold" aria-hidden="true" />
                    <Link href="/profile" onClick={() => setOpen(false)} className="min-h-10 flex-1 content-center text-sm font-semibold text-brand-gold">
                      {isEnglish ? "My profile" : "الملف الشخصي"}
                    </Link>
                    <form action={logoutAction}>
                      <button type="submit" className="rounded-lg px-3 py-2 text-xs text-brand-cream/70 hover:bg-white/5 hover:text-brand-gold">
                        {isEnglish ? "Sign out" : "تسجيل الخروج"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="flex min-h-10 items-center gap-2 text-sm font-bold text-brand-gold">
                    <Icons.LogIn className="h-5 w-5" aria-hidden="true" />
                    {isEnglish ? "Sign in" : "تسجيل الدخول"}
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                {filteredGroups.map((group) => {
                  const GroupIcon = resolveIcon(group.icon);
                  const expanded = searchNeedle.length > 0 || expandedGroup === group.id;
                  const active = group.id === activeGroupId;

                  return (
                    <section key={group.id} className="overflow-hidden rounded-2xl border border-brand-cream/10 bg-black/15">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpandedGroup(expanded ? null : group.id)}
                        className={[
                          "flex min-h-14 w-full items-center gap-3 px-3 py-3 text-start transition-colors",
                          active ? "bg-brand-gold/10 text-brand-gold" : "text-brand-cream hover:bg-white/[.03]",
                        ].join(" ")}
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-gold/15 bg-brand-gold/5 text-brand-gold">
                          <GroupIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{isEnglish ? group.en : group.ar}</span>
                          <span className="mt-0.5 block text-[11px] text-brand-cream/50">
                            {isEnglish ? group.descriptionEn : group.descriptionAr}
                          </span>
                        </span>
                        <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-brand-cream/10 px-2 py-1 text-[10px] tabular-nums text-brand-cream/65">
                          {group.visibleItems.length}
                        </span>
                        <Icons.ChevronDown className={["h-4 w-4 shrink-0 transition-transform", expanded ? "rotate-180 text-brand-gold" : "text-brand-cream/50"].join(" ")} aria-hidden="true" />
                      </button>

                      {expanded ? (
                        <div className="space-y-1 border-t border-brand-cream/10 p-2">
                          {group.visibleItems.map((item) => {
                            const ItemIcon = resolveIcon(item.icon);
                            const current = isCurrentPath(pathname, item.href);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                aria-current={current ? "page" : undefined}
                                className={[
                                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                                  current ? "bg-brand-gold/12 font-bold text-brand-gold" : "text-brand-cream/75 hover:bg-white/[.04] hover:text-brand-gold",
                                ].join(" ")}
                              >
                                <ItemIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span className="min-w-0 flex-1">{isEnglish ? item.en : item.ar}</span>
                                <span className="text-[10px] text-brand-cream/40">{isEnglish ? "Open" : "فتح"}</span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              <section className="mt-5 rounded-2xl border border-brand-gold/15 bg-brand-gold/[.04] p-3">
                <h2 className="mb-2 px-2 text-xs font-bold tracking-wide text-brand-gold">
                  {isEnglish ? "Platform information" : "معلومات المنصة والمساعدة"}
                </h2>
                <div className="grid grid-cols-1 gap-1">
                  {filteredUtilityLinks.map((item) => {
                    const Icon = resolveIcon(item.icon);
                    const current = isCurrentPath(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={current ? "page" : undefined}
                        className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm text-brand-cream/75 hover:bg-white/[.04] hover:text-brand-gold"
                      >
                        <Icon className="h-4 w-4 text-brand-gold/80" aria-hidden="true" />
                        {isEnglish ? item.en : item.ar}
                      </Link>
                    );
                  })}
                </div>
              </section>
              {filteredGroups.length === 0 && filteredUtilityLinks.length === 0 ? (
                <p role="status" className="mt-5 rounded-xl border border-brand-cream/10 p-4 text-center text-sm text-brand-cream/55">
                  {isEnglish ? "No matching sections were found." : "لا توجد أقسام مطابقة لعبارة البحث."}
                </p>
              ) : null}
            </div>
          </nav>
        </>
      ) : null}

      <nav
        data-mobile-nav
        aria-label={isEnglish ? "Primary mobile navigation" : "التنقل السفلي"}
        dir={dir}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-gold/20 bg-brand-emeraldDeep/95 shadow-[0_-8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {bottomLinks.map((item) => {
            const Icon = resolveIcon(item.icon);
            const current = isCurrentPath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={[
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold transition-colors",
                  current ? "bg-brand-gold/10 text-brand-gold" : "text-brand-cream/65 hover:text-brand-gold",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{isEnglish ? item.en : item.ar}</span>
              </Link>
            );
          })}
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls="mobile-navigation-dialog"
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold text-brand-cream/65 transition-colors hover:bg-brand-gold/8 hover:text-brand-gold"
          >
            <Icons.Menu className="h-5 w-5" aria-hidden="true" />
            <span>{isEnglish ? "More" : "المزيد"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
