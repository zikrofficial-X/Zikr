'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from './language-provider';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'zikr_install_dismissed';

/**
 * InstallPrompt
 * - Captures the `beforeinstallprompt` event and shows a themed banner
 *   inviting the user to install Zikr as an app on their device.
 * - Respects a persisted dismissal so it does not nag the user.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const { isEnglish, dir } = useLanguage();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed (standalone) — never show
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Respect prior dismissal
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setDeferred(null);
      localStorage.setItem(DISMISS_KEY, '1');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') {
      setVisible(false);
      setDeferred(null);
      if (choice.outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, '1');
      }
    }
  }, [deferred]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={isEnglish ? 'Install app' : 'تثبيت التطبيق'}
      className="fixed left-1/2 z-50 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 sm:w-[calc(100%-2rem)]"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="flex items-center gap-2.5 rounded-xl border border-brand-gold/40 bg-brand-emeraldDeep/95 px-3 py-2.5 shadow-2xl backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-7 w-7 shrink-0 text-brand-gold sm:h-8 sm:w-8"
          aria-hidden="true"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path strokeLinecap="round" d="M12 18h.01" />
        </svg>
        <div className="min-w-0 flex-1" dir={dir}>
          <p className="text-xs font-bold text-brand-gold sm:text-sm">{isEnglish ? 'Install ZIKR' : 'ثبّت تطبيق ذِكر'}</p>
          <p className="text-[11px] leading-snug text-brand-cream/60 sm:text-xs">
            {isEnglish ? 'Add it to your home screen and use it offline.' : 'أضِفه إلى شاشتك الرئيسية واستخدمه بالكامل بدون إنترنت'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-brand-gold px-2.5 py-1.5 text-[11px] font-bold text-brand-emeraldDeep transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold sm:px-3 sm:text-xs"
          >
            {isEnglish ? 'Install' : 'تثبيت'}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-brand-cream/50 transition-colors hover:text-brand-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            aria-label={isEnglish ? 'Close' : 'إغلاق'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
