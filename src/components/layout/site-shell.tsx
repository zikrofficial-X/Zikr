import dynamic from 'next/dynamic';
import { cookies, headers } from 'next/headers';
import { Footer } from './footer';
import { Navbar } from './navbar';
import { LanguageProvider } from './language-provider';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';
import { EditorialDepth } from '@/components/content/editorial-depth';
import { EditorialUtilityDepth } from '@/components/content/editorial-utility-depth';

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
  const requestHeaders = await headers();
  const cookieLocale = cookieStore.get('zikr-locale')?.value ?? null;
  const initialLocale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const pathname = requestHeaders.get('x-zikr-pathname') ?? '';

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <div className="min-h-screen">
        <Navbar />
        <main>
          {children}
          <EditorialDepth pathname={pathname} />
          <EditorialUtilityDepth pathname={pathname} />
        </main>
        <Footer />
        {/* Non-critical client integrations stay code-split from the shell. */}
        <NotificationPermissionBanner />
        <InstallPrompt />
        <OfflineIndicator />
      </div>
    </LanguageProvider>
  );
}
