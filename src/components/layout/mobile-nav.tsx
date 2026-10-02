"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session, User } from "@supabase/supabase-js";
import { logoutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "./language-provider";

const allLinks = [
  { href: "/quran", label: "القرآن الكريم", labelEn: "Holy Quran" },
  { href: "/hadith", label: "الأحاديث", labelEn: "Hadith" },
  { href: "/adhkar", label: "الأذكار", labelEn: "Adhkar" },
  { href: "/dua", label: "الأدعية", labelEn: "Dua" },
  { href: "/tasbeeh", label: "التسبيح", labelEn: "Tasbeeh" },
  { href: "/wird", label: "الورد اليومي وختم القرآن", labelEn: "Daily Wird & Khatm" },
  { href: "/prayer-times", label: "مواقيت الصلاة", labelEn: "Prayer Times" },
  { href: "/zakat", label: "الزكاة والتذكير", labelEn: "Zakat" },
  { href: "/qibla", label: "القبلة", labelEn: "Qibla" },
  { href: "/prophets", label: "قصص الأنبياء", labelEn: "Prophets" },
  { href: "/companions", label: "الصحابة", labelEn: "Companions" },
  { href: "/scholars", label: "العلماء", labelEn: "Scholars" },
  { href: "/stories", label: "القصص الإسلامية", labelEn: "Islamic Stories" },
  { href: "/articles", label: "المقالات", labelEn: "Articles" },
  { href: "/videos", label: "الفيديوهات", labelEn: "Videos" },
  { href: "/youtube", label: "قناة يوتيوب", labelEn: "YouTube" },
  { href: "/radio", label: "إذاعة القرآن", labelEn: "Quran Radio" },\n  { href: "/audio", label: "مكتبة الصوت", labelEn: "Audio Library" },\n  { href: "/sections", label: "دليل الأقسام", labelEn: "Sections Guide" },
  { href: "/spiritual-ai", label: "الرفيق الروحاني", labelEn: "Spiritual AI" },
  { href: "/memorization", label: "الحفظ", labelEn: "Memorization" },
  { href: "/poetry", label: "الشعر", labelEn: "Poetry" },
  { href: "/kids", label: "قسم الأطفال", labelEn: "Kids" },
  { href: "/battles", label: "الغزوات", labelEn: "Battles" },
  { href: "/conquests", label: "الفتوحات", labelEn: "Conquests" },
  { href: "/search", label: "البحث", labelEn: "Search" },
  { href: "/offline-library", label: "المكتبة الأوفلاين", labelEn: "Offline library" },
  { href: "/platform#android-download-title", label: "تحميل تطبيق Android", labelEn: "Download Android app" },
];

type MobileNavProps = { isAuthenticated?: boolean };

export function MobileNav({ isAuthenticated = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const { isEnglish, dir } = useLanguage();

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      setAuthResolved(true);
      return;
    }

    const supabase = createClient();

    const syncUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setAuthResolved(true);
    };

    void syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
        setAuthResolved(true);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const showAuthenticated = authResolved ? Boolean(user) : isAuthenticated;

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-brand-gold/10 transition-colors"
        aria-label={open ? (isEnglish ? "Close menu" : "إغلاق القائمة") : (isEnglish ? "Open menu" : "فتح القائمة")}
        aria-expanded={open}
      >
        <span className={`block h-0.5 w-5 bg-brand-gold transition-all duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`block h-0.5 w-5 bg-brand-gold transition-all duration-200 ${open ? "opacity-0" : ""}`} />
        <span className={`block h-0.5 w-5 bg-brand-gold transition-all duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>

      {open && <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <nav
        className={`fixed top-0 end-0 z-[60] h-dvh max-h-dvh w-[min(18rem,calc(100vw-1rem))] bg-brand-emeraldDeep border-s border-brand-gold/15 shadow-xl md:hidden transition-all duration-300 ease-in-out overflow-y-auto overscroll-contain touch-pan-y ${open ? "translate-x-0 visible pointer-events-auto" : dir === "rtl" ? "translate-x-full invisible pointer-events-none" : "-translate-x-full invisible pointer-events-none"}`}
        aria-label={isEnglish ? "Primary navigation" : "القائمة الرئيسية"}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-gold/15">
          <span className="text-xl font-bold text-brand-gold">ذِكرٌ</span>
          <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-gold/10 transition-colors" aria-label={isEnglish ? "Close" : "إغلاق"}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-gold/70">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="py-3 px-3">
          {showAuthenticated ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className="mb-2 flex items-center rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-sm font-semibold text-brand-gold hover:bg-brand-gold/20 transition-all">
                {isEnglish ? "My profile" : "الملف الشخصي"}
              </Link>
              <form action={logoutAction} className="mb-2">
                <button type="submit" className="flex w-full items-center rounded-lg border border-brand-cream/15 px-4 py-3 text-sm font-semibold text-brand-cream/75 transition-all hover:border-brand-gold/30 hover:bg-brand-gold/10 hover:text-brand-gold">
                  {isEnglish ? "Sign out" : "تسجيل الخروج"}
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setOpen(false)} className="mb-2 flex items-center rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-sm font-semibold text-brand-gold hover:bg-brand-gold/20 transition-all">
              {isEnglish ? "Sign in" : "تسجيل الدخول"}
            </Link>
          )}

          {allLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex items-center px-4 py-2.5 rounded-lg text-sm text-brand-cream/70 hover:text-brand-gold hover:bg-brand-gold/8 transition-all">
              {isEnglish ? link.labelEn : link.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
