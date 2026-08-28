'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type LogoVariant = 'default' | 'gold';
type LogoTheme = 'light' | 'dark' | 'auto';

const DEFAULT_LOGOS: Record<LogoVariant, string> = {
  default: '/branding/logo-gold.png',
  gold: '/branding/logo-gold.png',
};

const FALLBACK_LOGO = '/placeholders/videos/video-placeholder.png';

interface LogoProps {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: LogoVariant;
  theme?: LogoTheme;
  srcOverride?: string | null;
}

export function Logo({
  alt = 'ZIKR logo',
  className,
  width = 160,
  height = 64,
  priority = false,
  variant = 'default',
  theme = 'auto',
  srcOverride,
}: LogoProps) {
  const [failed, setFailed] = useState(false);
  const logoPath = useMemo(() => {
    if (failed) return FALLBACK_LOGO;
    return srcOverride || DEFAULT_LOGOS[variant];
  }, [failed, srcOverride, variant]);

  return (
    <Image
      src={logoPath}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes='(max-width: 640px) 120px, (max-width: 1024px) 150px, 160px'
      onError={() => setFailed(true)}
      className={cn(
        'h-auto w-auto max-w-full object-contain transition-opacity',
        theme === 'dark' && 'brightness-110 contrast-110',
        theme === 'light' && 'brightness-95',
        className,
      )}
    />
  );
}
