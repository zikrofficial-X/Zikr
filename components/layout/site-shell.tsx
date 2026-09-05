import dynamic from 'next/dynamic';
import { Footer } from './footer';
import { Navbar } from './navbar';
import { LanguageProvider } from './language-provider';

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
const AppUpdateChecker = dynamic(
  () => import('./app-update-checker').then((module) => module.AppUpdateChecker),
);

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
        {/* Non-critical client integrations are code-split from the initial shell. */}
        <NotificationPermissionBanner />
        <InstallPrompt />
        <OfflineIndicator />
        <AppUpdateChecker />
      </div>
    </LanguageProvider>
  );
}
