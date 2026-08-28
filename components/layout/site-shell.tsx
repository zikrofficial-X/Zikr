import { Footer } from './footer';
import { Navbar } from './navbar';
import { InstallPrompt } from './install-prompt';
import { OfflineIndicator } from '../offline-indicator';
import { LanguageProvider } from './language-provider';
import { NotificationPermissionBanner } from './notification-permission-banner';
import { AppUpdateChecker } from './app-update-checker';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
        {/* One-time prompt asking for notification permission */}
        <NotificationPermissionBanner />
        {/* PWA "add to home screen" invitation */}
        <InstallPrompt />
        {/* Offline status indicator */}
        <OfflineIndicator />
        {/* Native Android update notice; no-op on web and PWA. */}
        <AppUpdateChecker />
      </div>
    </LanguageProvider>
  );
}
