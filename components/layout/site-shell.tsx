import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { Footer } from './footer';
import { Navbar } from './navbar';
import { LanguageProvider } from './language-provider';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

const InstallPrompt = dynamic(
  () => import('./install-prompt').then((module) => module.InstallPrompt),
);
const OfflineIndicator = dynamic(
  () => import('../offline-indicator').then((module) => module.OfflineIndicator),
);
const NotificationPermissionBanner = dynamic(
  () =>
    import('./notification-permission-banner').then(
      (module) => module.NotificationPermissionBanner,
    ),
);

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('zikr-locale')?.value ?? null;
  const initialLocale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <div className="min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
        {/* Non-critical client integrations stay code-split from the shell. */}
        <NotificationPermissionBanner />
        <InstallPrompt />
        <OfflineIndicator />
      </div>
    </LanguageProvider>
  );
}
