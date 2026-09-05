import dynamic from "next/dynamic";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AuthNavActions } from "./auth-nav-actions";
import { LanguageToggle } from "./language-toggle";
import { LanguageAwareNav, type NavLink } from "./language-aware-nav";

const MobileNav = dynamic(
  () => import("./mobile-nav").then((module) => module.MobileNav),
  { ssr: false },
);

const links: NavLink[] = [
  { href: "/quran", label: "القرآن", labelEn: "Quran" },
  { href: "/hadith", label: "الأحاديث", labelEn: "Hadith" },
  { href: "/stories", label: "القصص", labelEn: "Stories" },
  { href: "/adhkar", label: "الأذكار", labelEn: "Adhkar" },
  { href: "/dua", label: "الأدعية", labelEn: "Dua" },
  { href: "/wird", label: "الورد", labelEn: "Wird" },
  { href: "/prayer-times", label: "الصلاة", labelEn: "Prayer" },
  { href: "/zakat", label: "الزكاة", labelEn: "Zakat" },
  { href: "/qibla", label: "القبلة", labelEn: "Qibla" },
  { href: "/prophets", label: "الأنبياء", labelEn: "Prophets" },
  { href: "/companions", label: "الصحابة", labelEn: "Companions" },
  { href: "/scholars", label: "العلماء", labelEn: "Scholars" },
  { href: "/spiritual-ai", label: "الروحاني", labelEn: "Spiritual AI" },
  { href: "/kids", label: "الأطفال", labelEn: "Kids" },
  { href: "/search", label: "بحث", labelEn: "Search" },
  {
    href: "/platform#android-download-title",
    label: "تحميل التطبيق",
    labelEn: "Download app",
  },
];

export async function Navbar() {
  let user = null;
  let isAdmin = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;

      if (user) {
        // A missing profile row must not erase a valid auth session from the UI.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        isAdmin = profile?.role === "admin";
      }
    } catch (error) {
      // Keep the authenticated user even if an optional profile lookup fails.
      console.error("[v0] Navbar auth lookup failed:", error);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-gold/15 bg-brand-emeraldDeep/90 backdrop-blur-md">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="ZIKR - الرئيسية"
        >
          <span className="text-2xl font-bold text-brand-gold tracking-tight group-hover:opacity-80 transition-opacity">
            ذِكرٌ
          </span>
          <span className="hidden sm:block text-xs text-brand-gold/40 font-mono tracking-widest pt-1">
            ZIKR
          </span>
        </Link>

        <LanguageAwareNav links={links} />

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/settings"
            aria-label="الإعدادات"
            className="rounded-md p-2 text-brand-cream/60 transition-colors hover:text-brand-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>
          <MobileNav isAuthenticated={Boolean(user)} />
          <AuthNavActions initialUser={user} initialIsAdmin={isAdmin} />
        </div>
      </Container>
    </header>
  );
}
