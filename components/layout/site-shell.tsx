import dynamic from 'next/dynamic';
import { Footer } from './footer';
import { Navbar } from './navbar';
import { LanguageProvider } from './language-provider';

// Non-critical UX enhancements are loaded after the initial page render.
// They are not needed to paint or navigate the primary content.
const NotificationPermissionBanner = dynamic(
  () =>
    import('./notification-permission-banner').then(
      (mod) => mod.NotificationPermissionBanner,
    ),
  { ssr: false, loading: () => null },
);

const InstallPrompt = dynamic(
  () => import('./install-prompt').then((mod) => mod.InstallPrompt),
  { ssr: false, loading: () => null },
);

const OfflineIndicator = dynamic(
  () => import('../offline-indicator').then((mod) => mod.OfflineIndicator),
  { ssr: false, loading: () => null },
);

const AppUpdateChecker = dynamic(
  () =>
    import('./app-update-checker').then((mod) => mod.AppUpdateChecker),
  { ssr: false, loading: () => null },
);

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <NotificationPermissionBanner />
        <InstallPrompt />
        <OfflineIndicator />
        <AppUpdateChecker />
      </div>
    </LanguageProvider>
  );
}
