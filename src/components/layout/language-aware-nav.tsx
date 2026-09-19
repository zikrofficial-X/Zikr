'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from './language-provider';

export type NavLink = { href: string; label: string; labelEn: string };

export function LanguageAwareNav({ links }: { links: NavLink[] }) {
  const { isEnglish } = useLanguage();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Use default (Arabic) during SSR to match server rendering
  const shouldShowEnglish = isHydrated ? isEnglish : false;
  const ariaLabel = shouldShowEnglish ? 'Primary navigation' : 'القائمة الرئيسية';

  return (
    <nav className="hidden flex-wrap justify-end gap-x-4 gap-y-2 md:flex" aria-label={ariaLabel}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-brand-cream/70 transition-colors hover:text-brand-gold"
        >
          {shouldShowEnglish ? link.labelEn : link.label}
        </Link>
      ))}
    </nav>
  );
}
