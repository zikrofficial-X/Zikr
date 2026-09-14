import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/layout/site-shell";

import { defaultOgImage, siteConfig } from "@/lib/site";
import { DeferredRuntime } from "@/components/layout/deferred-runtime";
import { DeferredAnalytics } from "@/components/layout/deferred-analytics";
import { OfflineNavigationGuard } from "@/components/layout/offline-navigation-guard";
import { NativeCapacitorBridgeLoader } from "@/components/layout/native-capacitor-bridge-loader";

export const dynamic = "force-dynamic";

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-arabic-loaded",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  verification: {
    google: [
      "wq9nowZwnBPIzL-Er-1I1Va4CMv-RQ4QqtEsIbdO8fs",
      "Of0DQJPyryp-UqLB2Xdr5bDSkQbm_rU7bjbL6l8uGCs",
    ],
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.shortName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [defaultOgImage],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      inLanguage: "ar",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.shortName,
      url: siteConfig.url,
      logo: `${siteConfig.url}/branding/logo-gold.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir={siteConfig.dir}
      data-scroll-behavior="smooth"
      className={`bg-black ${notoNaskhArabic.variable}`}
      suppressHydrationWarning={true}
    >
      <head>
        <meta name="theme-color" content="#0A2A1E" />
        <meta
          name="google-adsense-account"
          content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-2457467624248791"}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta
          name="apple-mobile-web-app-title"
          content={siteConfig.shortName}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <style>{`
          html:not([data-locale]) footer {
            visibility: hidden;
          }

          footer {
            min-height: 460px;
          }

          @media (max-width: 639px) {
            footer {
              min-height: 680px;
            }

            main > div:first-child > section:first-of-type
              div:has(> a[href="/auth/register"], > a[href="/profile"]) {
              min-height: 168px;
            }

            main > div:first-child > section:first-of-type
              div.text-center:has(> h1) {
              min-height: 210px;
            }
          }
        `}</style>
      </head>
      <body className="font-arabic antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <OfflineNavigationGuard />
        <SiteShell>{children}</SiteShell>
        <NativeCapacitorBridgeLoader />
        <DeferredRuntime />
        <DeferredAnalytics />
      </body>
    </html>
  );
}
