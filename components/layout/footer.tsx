"use client";

import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, Scroll, Star } from "lucide-react";
import { useLanguage } from "./language-provider";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/zikrmediaofficial1";

export function Footer() {
  const { isEnglish } = useLanguage();

  const copy = isEnglish
    ? {
        description:
          "A complete spiritual platform connecting Muslims with the Book of Allah and the Sunnah through a modern, premium, and accessible experience.",
        sections: "Platform Sections",
        tools: "Smart Tools",
        legal: "Legal & Platform",
        copyright: `© ${new Date().getFullYear()} ZIKR | ذِكرٌ — Built with care to serve the Muslim ummah. All rights reserved.`,
      }
    : {
        description:
          "منصة روحانية شاملة تهدف لربط المسلم بكتاب الله وسنة رسوله ﷺ عبر تجربة تقنية حديثة، فاخرة، وميسرة للجميع.",
        sections: "أقسام المنصة",
        tools: "أدوات ذكية",
        legal: "قانوني وتقني",
        copyright: `© ${new Date().getFullYear()} ZIKR | ذِكرٌ — صُنع بحب لخدمة الأمة الإسلامية. جميع الحقوق محفوظة.`,
      };

  const sectionLinks = [
    { href: "/quran", ar: "القرآن الكريم", en: "Holy Quran" },
    { href: "/hadith", ar: "الأحاديث النبوية", en: "Prophetic Hadith" },
    { href: "/adhkar", ar: "حصن المسلم", en: "Fortress of the Muslim" },
    { href: "/prophets", ar: "قصص الأنبياء", en: "Stories of the Prophets" },
    { href: "/scholars", ar: "تراجم العلماء", en: "Scholar Biographies" },
  ];
  const toolLinks = [
    { href: "/prayer-times", ar: "مواقيت الصلاة", en: "Prayer Times" },
    { href: "/memorization", ar: "مساعد الحفظ", en: "Memorization Assistant" },
    {
      href: "/spiritual-ai",
      ar: "الرفيق الروحاني AI",
      en: "Spiritual AI Companion",
    },
    { href: "/poetry", ar: "ديوان الشعر", en: "Poetry Collection" },
    { href: "/search", ar: "البحث الشامل", en: "Universal Search" },
  ];
  const legalLinks = [
    { href: "/about", ar: "عن المنصة", en: "About" },
    { href: "/platform", ar: "دليل المنصة", en: "Platform Guide" },
    { href: "/faq", ar: "الأسئلة الشائعة", en: "FAQ" },
    { href: "/contact", ar: "تواصل معنا", en: "Contact" },
    { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy Policy" },
    {
      href: "/editorial-policy",
      ar: "معايير التحرير والمصادر",
      en: "Editorial standards",
    },
    { href: "/terms", ar: "الشروط والأحكام", en: "Terms" },
    { href: "/profile", ar: "الملف الشخصي", en: "My Profile" },
  ];

  return (
    <footer className="mt-24 border-t border-brand-gold/10 py-20 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/branding/pattern.svg')] opacity-[0.02] pointer-events-none" />
      <Container className="relative grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10 md:grid-cols-4 md:gap-12">
        <div className="col-span-2 space-y-5 md:col-span-1 md:space-y-6">
          <h3 className="text-2xl font-bold text-brand-gold">ZIKR | ذِكرٌ</h3>
          <p className="max-w-sm text-sm leading-7 text-brand-cream/75">
            {copy.description}
          </p>
          <div className="flex gap-4 pt-2 items-center">
            <BookOpen className="h-5 w-5 text-brand-gold/65 hover:text-brand-gold cursor-pointer transition-colors" />
            <Scroll className="h-5 w-5 text-brand-gold/65 hover:text-brand-gold cursor-pointer transition-colors" />
            <Star className="h-5 w-5 text-brand-gold/65 hover:text-brand-gold cursor-pointer transition-colors" />
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isEnglish ? "Facebook page" : "صفحة الفيسبوك"}
              className="text-brand-gold/65 hover:text-brand-gold transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.252h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold text-brand-gold uppercase tracking-widest">
            {copy.sections}
          </h3>
          <ul className="space-y-3 text-sm">
            {sectionLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-brand-cream/75 underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
                >
                  {isEnglish ? link.en : link.ar}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold text-brand-gold uppercase tracking-widest">
            {copy.tools}
          </h3>
          <ul className="space-y-3 text-sm">
            {toolLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-brand-cream/75 underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
                >
                  {isEnglish ? link.en : link.ar}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold text-brand-gold uppercase tracking-widest">
            {copy.legal}
          </h3>
          <ul className="space-y-3 text-sm">
            {legalLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-brand-cream/75 underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
                >
                  {isEnglish ? link.en : link.ar}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={FACEBOOK_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cream/75 underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
              >
                {isEnglish ? "Facebook Page" : "صفحة الفيسبوك"}
              </a>
            </li>
            <li className="pt-4">
              <Badge
                variant="outline"
                className="border-brand-gold/20 text-brand-gold/40 text-[10px]"
              >
                Version 1.2.5
              </Badge>
            </li>
          </ul>
        </div>
      </Container>

      <Container className="relative mt-16 border-t border-brand-gold/15 pt-8 text-center text-xs text-brand-cream/60 sm:mt-20 sm:pt-10">
        <p dir={isEnglish ? "ltr" : "rtl"}>{copy.copyright}</p>
      </Container>
    </footer>
  );
}
