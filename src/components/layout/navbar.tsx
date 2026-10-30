import Link from "next/link";
import { Settings } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MobileNav } from "./mobile-nav";
import { AuthNavActions } from "./auth-nav-actions";
import { LanguageToggle } from "./language-toggle";
import { LanguageAwareNav, type NavLink } from "./language-aware-nav";
import { getRequestLocale } from "@/lib/i18n/server";
import { getCatalogItem } from "@/lib/navigation/catalog";

const PRIMARY_NAVIGATION_HREFS = [
  "/quran",
  "/adhkar",
  "/prayer-times",
  "/stories",
  "/audio",
  "/kids",
] as const;

const links: NavLink[] = [
  ...PRIMARY_NAVIGATION_HREFS.map((href) => {
    const item = getCatalogItem(href);
    return {
      href,
      label: item?.ar ?? href,
      labelEn: item?.en ?? href,
      icon: item?.icon,
    };
  }),
  { href: "/sections", label: "كل الأقسام", labelEn: "All sections", icon: "Grid3X3" },
];

export async function Navbar() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        isAdmin = profile?.role === "admin";
      }
    } catch (error) {
      console.error("[navbar] Auth lookup failed:", error);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-gold/15 bg-brand-emeraldDeep/95 backdrop-blur-md">
      <Container className="flex min-h-16 items-center justify-between gap-3 py-2">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2"
          aria-label={isEnglish ? "ZIKR - Home" : "ذِكرٌ - الرئيسية"}
        >
          <span className="text-2xl font-bold tracking-tight text-brand-gold transition-opacity group-hover:opacity-80">
            {isEnglish ? "ZIKR" : "ذِكرٌ"}
          </span>
          <span className="hidden pt-1 font-mono text-xs tracking-widest text-brand-gold/55 sm:block">
            ZIKR
          </span>
        </Link>

        <LanguageAwareNav links={links} />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageToggle />
          <Link
            href="/settings"
            aria-label={isEnglish ? "Settings" : "الإعدادات"}
            className="rounded-xl p-2 text-brand-cream/75 transition-colors hover:bg-brand-gold/8 hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold"
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
