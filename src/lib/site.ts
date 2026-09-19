/**
 * Canonical production origin. Single source of truth for every fallback —
 * override per environment with NEXT_PUBLIC_SITE_URL.
 */
export const PRODUCTION_URL = "https://zikrmediaofficial.vercel.app";

export function enforceCanonicalProductionUrl(value?: string): string {
  if (!value) return PRODUCTION_URL;

  try {
    const origin = new URL(value).origin;
    if (process.env.VERCEL_ENV === "production") return PRODUCTION_URL;
    return origin;
  } catch {
    return PRODUCTION_URL;
  }
}

export const siteConfig = {
  name: "ZIKR | ذِكرٌ",
  shortName: "ZIKR",
  description:
    "ZIKR - منصة إسلامية شاملة للقرآن الكريم، الأحاديث النبوية، قصص الأنبياء، ومواقيت الصلاة بتجربة حديثة ومتكاملة.",
  url: enforceCanonicalProductionUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "ar_SA",
  dir: "rtl" as const,
};

export const defaultOgImage = "/branding/og-image.png";

import type { Metadata } from "next";

/**
 * Utility/account/search screens are not intended to be SEO landing pages.
 * Public editorial/content sections remain indexable so their substantive
 * content can be discovered by search engines.
 */
const NOINDEX_PATHS = new Set([
  "/search",
  "/qibla",
  "/prayer-times",
  "/tasbeeh",
  "/memorization",
  "/wird",
  "/zakat",
  "/offline-library",
  "/settings",
  "/favorites",
  "/profile",
  "/spiritual-ai",
  "/radio",
  "/youtube",
  "/reciters",
  "/tawasheeh",
  "/kids/puzzle",
  "/kids/progress",
  "/kids/games",
  "/kids/audio",
  "/kids/achievements",
]);

function isNoindexPath(path: string): boolean {
  const normalized = path.split("?")[0].replace(/\/$/, "") || "/";
  return Array.from(NOINDEX_PATHS).some(
    blockedPath =>
      normalized === blockedPath || normalized.startsWith(`${blockedPath}/`),
  );
}

/**
 * Build consistent page metadata with canonical URL, Open Graph, and Twitter cards.
 * Use for every public page to avoid inheriting the root canonical.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const { title, description, path } = opts;
  const shouldNoindex = opts.noindex ?? isNoindexPath(path);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: shouldNoindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      locale: siteConfig.locale,
      siteName: siteConfig.shortName,
      images: [{ url: defaultOgImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

export type AppRoute = {
  path: string;
  label: string;
  sitemap: {
    changeFrequency:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    priority: number;
  };
  nav?: "primary" | "more";
  footer?: "platform" | "tools" | "legal";
};

export const appRoutes = [
  { path: "/", label: "الرئيسية", sitemap: { changeFrequency: "weekly", priority: 1 } },
  { path: "/mushaf", label: "المصحف", sitemap: { changeFrequency: "monthly", priority: 0.95 }, nav: "primary", footer: "platform" },
  { path: "/quran", label: "القرآن", sitemap: { changeFrequency: "monthly", priority: 0.9 }, nav: "more", footer: "platform" },
  { path: "/hadith", label: "الأحاديث", sitemap: { changeFrequency: "monthly", priority: 0.9 }, nav: "primary", footer: "platform" },
  { path: "/stories", label: "القصص", sitemap: { changeFrequency: "weekly", priority: 0.8 }, nav: "primary" },
  { path: "/scholars", label: "العلماء", sitemap: { changeFrequency: "monthly", priority: 0.8 }, nav: "primary", footer: "platform" },
  { path: "/prayer-times", label: "مواقيت الصلاة", sitemap: { changeFrequency: "daily", priority: 0.7 }, nav: "primary", footer: "tools" },
  { path: "/qibla", label: "القبلة", sitemap: { changeFrequency: "monthly", priority: 0.6 }, nav: "more" },
  { path: "/adhkar", label: "الأذكار", sitemap: { changeFrequency: "weekly", priority: 0.8 }, nav: "more", footer: "platform" },
  { path: "/dua", label: "الدعاء", sitemap: { changeFrequency: "weekly", priority: 0.8 }, footer: "platform" },
  { path: "/duas", label: "موسوعة الأدعية", sitemap: { changeFrequency: "weekly", priority: 0.8 }, footer: "platform" },
  { path: "/tasbeeh", label: "التسبيح", sitemap: { changeFrequency: "weekly", priority: 0.6 }, nav: "more" },
  { path: "/prophets", label: "قصص الأنبياء", sitemap: { changeFrequency: "monthly", priority: 0.8 }, footer: "platform" },
  { path: "/articles", label: "المقالات", sitemap: { changeFrequency: "daily", priority: 0.8 } },
  { path: "/knowledge", label: "مركز المعرفة", sitemap: { changeFrequency: "monthly", priority: 0.7 }, footer: "platform" },
  { path: "/videos", label: "الفيديوهات", sitemap: { changeFrequency: "daily", priority: 0.8 } },
  { path: "/youtube", label: "يوتيوب", sitemap: { changeFrequency: "daily", priority: 0.7 }, nav: "more" },
  { path: "/kids", label: "الأطفال", sitemap: { changeFrequency: "weekly", priority: 0.7 } },
  { path: "/memorization", label: "الحفظ", sitemap: { changeFrequency: "weekly", priority: 0.6 }, nav: "more", footer: "tools" },
  { path: "/wird", label: "الورد اليومي", sitemap: { changeFrequency: "weekly", priority: 0.6 }, footer: "tools" },
  { path: "/zakat", label: "الزكاة", sitemap: { changeFrequency: "monthly", priority: 0.6 }, footer: "tools" },
  { path: "/spiritual-ai", label: "الرفيق الروحاني", sitemap: { changeFrequency: "weekly", priority: 0.6 }, nav: "more", footer: "tools" },
  { path: "/poetry", label: "الشعر", sitemap: { changeFrequency: "weekly", priority: 0.6 }, nav: "more", footer: "tools" },
  { path: "/competitions", label: "مسابقات", sitemap: { changeFrequency: "weekly", priority: 0.6 }, nav: "more" },
  { path: "/radio", label: "الإذاعة", sitemap: { changeFrequency: "weekly", priority: 0.6 }, nav: "more" },
  { path: "/reciters", label: "القراء", sitemap: { changeFrequency: "monthly", priority: 0.7 } },
  { path: "/tafsir", label: "التفسير", sitemap: { changeFrequency: "monthly", priority: 0.7 } },
  { path: "/companions", label: "الصحابة", sitemap: { changeFrequency: "monthly", priority: 0.7 } },
  { path: "/battles", label: "الغزوات", sitemap: { changeFrequency: "monthly", priority: 0.6 } },
  { path: "/conquests", label: "الفتوحات", sitemap: { changeFrequency: "monthly", priority: 0.6 } },
  { path: "/tawasheeh", label: "التواشيح", sitemap: { changeFrequency: "weekly", priority: 0.6 } },
  { path: "/search", label: "بحث", sitemap: { changeFrequency: "daily", priority: 0.7 }, nav: "more", footer: "tools" },
  { path: "/offline-library", label: "مكتبة الأوفلاين", sitemap: { changeFrequency: "weekly", priority: 0.5 }, footer: "tools" },
  { path: "/settings", label: "الإعدادات", sitemap: { changeFrequency: "monthly", priority: 0.4 }, footer: "tools" },
  { path: "/favorites", label: "المفضلة", sitemap: { changeFrequency: "weekly", priority: 0.4 }, nav: "more" },
  { path: "/profile", label: "الملف الشخصي", sitemap: { changeFrequency: "weekly", priority: 0.4 } },
  { path: "/about", label: "عن المنصة", sitemap: { changeFrequency: "yearly", priority: 0.5 }, footer: "legal" },
  { path: "/contact", label: "تواصل معنا", sitemap: { changeFrequency: "yearly", priority: 0.5 }, footer: "legal" },
  { path: "/platform", label: "دليل المنصة", sitemap: { changeFrequency: "yearly", priority: 0.4 }, footer: "legal" },
  { path: "/faq", label: "الأسئلة الشائعة", sitemap: { changeFrequency: "yearly", priority: 0.4 }, footer: "legal" },
  { path: "/privacy", label: "سياسة الخصوصية", sitemap: { changeFrequency: "yearly", priority: 0.3 }, footer: "legal" },
  { path: "/editorial-policy", label: "معايير التحرير والمصادر", sitemap: { changeFrequency: "yearly", priority: 0.5 }, footer: "legal" },
  { path: "/terms", label: "الشروط والأحكام", sitemap: { changeFrequency: "yearly", priority: 0.3 }, footer: "legal" },
] as const satisfies readonly AppRoute[];

export const staticRoutes = appRoutes.map(route => route.path);
export const navigationRoutes = appRoutes.filter(route => "nav" in route);
export const footerRoutes = appRoutes.filter(route => "footer" in route);
