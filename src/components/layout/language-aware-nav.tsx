'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from './language-provider';

export type NavLink = { href: string; label: string; labelEn: string; icon?: string };

function resolveIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  const candidate = (Icons as unknown as Record<string, unknown>)[name];
  return (typeof candidate === 'function' || (typeof candidate === 'object' && candidate !== null)) ? (candidate as LucideIcon) : Icons.Circle;
}

export function LanguageAwareNav({ links }: { links: NavLink[] }) {
  const { isEnglish } = useLanguage();
  const pathname = usePathname() ?? '/';
  const ariaLabel = isEnglish ? 'Primary navigation' : 'القائمة الرئيسية';

  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] lg:flex"
      aria-label={ariaLabel}
    >
      {links.map((link) => {
        const Icon = resolveIcon(link.icon);
        const current =
          pathname === link.href ||
          (link.href !== '/' && pathname.startsWith(link.href + '/'));

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? 'page' : undefined}
            className={[
              'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-colors xl:gap-2 xl:px-2.5 xl:text-sm',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold',
              current
                ? 'bg-brand-gold/12 text-brand-gold'
                : 'text-brand-cream/75 hover:bg-brand-gold/8 hover:text-brand-gold',
            ].join(' ')}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
            <span>{isEnglish ? link.labelEn : link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
