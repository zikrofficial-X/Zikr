"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getCatalogItem } from "@/lib/navigation/catalog";
import { useLanguage } from "./language-provider";
import { BookOpen, Scroll, Star } from "lucide-react";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/zikrmediaofficial1";
const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@zikrmediaofficial";
const APP_VERSION = "1.1.8";

type FooterSocialLinks = {
  facebookPageUrl?: string | null;
  youtubeChannelUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  xUrl?: string | null;
};

type FooterLink = { href: string; ar: string; en: string };

function safeExternalUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function catalogLink(href: string): FooterLink {
  const item = getCatalogItem(href);
  return {
    href,
    ar: item?.ar ?? href,
    en: item?.en ?? href,
  };
}

const sectionLinks = [
  "/quran",
  "/hadith",
  "/adhkar",
  "/prophets",
  "/scholars",
  "/audio",
  "/kids",
  "/sections",
].map((href) =>
  href === "/sections"
    ? { href, ar: "دليل الأقسام", en: "All sections" }
    : catalogLink(href),
);

const toolLinks = [
  "/prayer-times",
  "/memorization",
  "/spiritual-ai",
  "/search",
  "/offline-library",
  "/profile",
].map(catalogLink);

const supportLinks: FooterLink[] = [
  { href: "/about", ar: "عن المنصة", en: "About ZIKR" },
  { href: "/platform", ar: "دليل الاستخدام", en: "Platform guide" },
  { href: "/faq", ar: "الأسئلة الشائعة", en: "Frequently asked questions" },
  { href: "/contact", ar: "تواصل معنا", en: "Contact us" },
];

const legalLinks: FooterLink[] = [
  { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy policy" },
  { href: "/editorial-policy", ar: "المصادر ومعايير التحرير", en: "Sources & editorial policy" },
  { href: "/terms", ar: "الشروط والأحكام", en: "Terms and conditions" },
  { href: "/data-deletion", ar: "حذف البيانات", en: "Data deletion" },
];

export function Footer({ socialLinks }: { socialLinks?: FooterSocialLinks }) {
  const { isEnglish } = useLanguage();
  const facebookUrl = safeExternalUrl(socialLinks?.facebookPageUrl) ?? FACEBOOK_PAGE_URL;
  const youtubeUrl = safeExternalUrl(socialLinks?.youtubeChannelUrl) ?? YOUTUBE_CHANNEL_URL;
  const instagramUrl = safeExternalUrl(socialLinks?.instagramUrl);
  const xUrl = safeExternalUrl(socialLinks?.xUrl ?? socialLinks?.twitterUrl);

  const copy = isEnglish
    ? {
        description:
          "A source-aware Islamic platform for Quran, remembrance, learning and everyday worship.",
        sections: "Platform sections",
        tools: "Tools & account",
        support: "About & support",
        legal: "Policies",
        copyright: `© ${new Date().getFullYear()} ZIKR | ذِكرٌ — All rights reserved.`,
      }
    : {
        description:
          "منصة إسلامية منظمة للقرآن والذكر والتعلّم والعبادات اليومية، مع توضيح المصادر وتسهيل الوصول إلى الأدوات.",
        sections: "أقسام المنصة",
        tools: "الأدوات والحساب",
        support: "عن المنصة والمساعدة",
        legal: "السياسات",
        copyright: `© ${new Date().getFullYear()} ZIKR | ذِكرٌ — جميع الحقوق محفوظة.`,
      };

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-brand-gold/15 bg-black py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[url('/branding/pattern.svg')] opacity-[0.02]" />
      <Container className="relative grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-5">
        <div className="col-span-2 space-y-4 lg:col-span-1">
          <Link href="/" className="inline-flex text-2xl font-bold text-brand-gold">
            ZIKR | ذِكرٌ
          </Link>
          <p className="max-w-sm text-sm leading-7 text-brand-cream/75">
            {copy.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <Link href="/quran" aria-label={isEnglish ? "Quran" : "القرآن الكريم"} className="rounded-lg p-2 text-brand-gold/80 hover:bg-brand-gold/10 hover:text-brand-gold">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href="/hadith" aria-label={isEnglish ? "Hadith" : "الحديث الشريف"} className="rounded-lg p-2 text-brand-gold/80 hover:bg-brand-gold/10 hover:text-brand-gold">
              <Scroll className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href="/adhkar" aria-label={isEnglish ? "Adhkar" : "الأذكار"} className="rounded-lg p-2 text-brand-gold/80 hover:bg-brand-gold/10 hover:text-brand-gold">
              <Star className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 py-2 text-brand-cream/70 hover:bg-brand-gold/10 hover:text-brand-gold">
              Facebook
            </a>
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 py-2 text-brand-cream/70 hover:bg-brand-gold/10 hover:text-brand-gold">
              YouTube
            </a>
            {instagramUrl ? <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 py-2 text-brand-cream/70 hover:bg-brand-gold/10 hover:text-brand-gold">Instagram</a> : null}
            {xUrl ? <a href={xUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 py-2 text-brand-cream/70 hover:bg-brand-gold/10 hover:text-brand-gold">X</a> : null}
          </div>
          <Badge variant="outline" className="border-brand-gold/20 text-[10px] text-brand-gold/70">
            Version {APP_VERSION}
          </Badge>
        </div>

        <FooterColumn title={copy.sections} links={sectionLinks} isEnglish={isEnglish} />
        <FooterColumn title={copy.tools} links={toolLinks} isEnglish={isEnglish} />
        <FooterColumn title={copy.support} links={supportLinks} isEnglish={isEnglish} />
        <FooterColumn title={copy.legal} links={legalLinks} isEnglish={isEnglish} />
      </Container>

      <Container className="relative mt-10 border-t border-brand-gold/15 pt-6 text-center text-xs text-brand-cream/60 sm:mt-12 sm:pt-8">
        <p dir={isEnglish ? "ltr" : "rtl"}>{copy.copyright}</p>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  isEnglish,
}: {
  title: string;
  links: FooterLink[];
  isEnglish: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-brand-gold">
        {title}
      </h2>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-8 items-center text-brand-cream/75 underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
            >
              {isEnglish ? link.en : link.ar}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
