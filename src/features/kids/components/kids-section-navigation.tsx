"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/layout/language-provider";
import { KIDS_SECTION_LINKS } from "@/features/kids/data/navigation";
import { GAME_REGISTRY } from "@/lib/games/registry";

export function KidsSectionNavigation() {
  const { isEnglish } = useLanguage();
  const pathname = usePathname() ?? "/";
  const routeSlug = pathname.startsWith("/kids/")
    ? pathname.slice("/kids/".length).split("/")[0]
    : "";
  const isRegisteredGame = routeSlug in GAME_REGISTRY;

  return (
    <nav
      dir={isEnglish ? "ltr" : "rtl"}
      aria-label={isEnglish ? "Kids section navigation" : "التنقل داخل قسم الأطفال"}
      className="border-b border-brand-cream/10 bg-[#061b24]"
    >
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-5 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" role="list">
          {KIDS_SECTION_LINKS.map((item) => {
            const current =
              pathname === item.href ||
              (item.id === "games" && (pathname.startsWith("/kids/games") || isRegisteredGame));
            return (
              <div role="listitem" key={item.id} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  title={isEnglish ? item.descriptionEn : item.descriptionAr}
                  className={[
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
                    current
                      ? "border-brand-gold/60 bg-brand-gold/15 text-brand-gold"
                      : "border-brand-cream/10 bg-white/[.03] text-brand-cream/75 hover:border-brand-gold/40 hover:text-brand-gold",
                  ].join(" ")}
                >
                  <span aria-hidden="true" className="text-base">{item.icon}</span>
                  <span>{isEnglish ? item.labelEn : item.labelAr}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
