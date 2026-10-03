import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteShell } from "@/components/layout/site-shell";

import { defaultOgImage, siteConfig } from "@/lib/site";
import { Analytics } from "@/components/layout/analytics";
import { DeferredRuntime } from "@/components/layout/deferred-runtime";
import { DeferredAnalytics } from "@/components/layout/deferred-analytics";
import { OfflineNavigationGuard } from "@/components/layout/offline-navigation-guard";
import { NativeCapacitorBridgeLoader } from "@/components/layout/native-capacitor-bridge-loader";
import { getRequestLocaleContext } from "@/lib/i18n/server";

// Use system fallback fonts for Arabic text
// Google Fonts will be loaded via CSS fallback in globals.css
const notoNaskhArabic = { variable: "--font-noto-arabic-loaded" };

// These are public identifiers, not secrets. Environment variables remain the
// canonical deployment configuration; the verified production IDs are safe
// fallbacks so a missing Vercel build variable cannot silently disable tags.
const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-W30Z9JW0VF";
const googleTagManagerId = process.env.NEXT_PUBLIC_GTM_ID || "GTM-PVQCFKCB";
const isValidGoogleAnalyticsId = /^G-[A-Z0-9]+$/i.test(googleAnalyticsId ?? "");
const isValidGoogleTagManagerId = /^GTM-[A-Z0-9]+$/i.test(googleTagManagerId ?? "");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const { locale, htmlLocale } = await getRequestLocaleContext();
  const isEnglish = locale === "en";
  const name = isEnglish ? "ZIKR | Islamic Platform" : siteConfig.name;
  const description = isEnglish
    ? "ZIKR is a comprehensive Islamic platform for Quran, Hadith, Prophets, prayer times, remembrance, learning, and family-friendly content."
    : siteConfig.description;

  return {
    metadataBase: new URL(siteConfig.url),
    verification: {
      google: [
        "wq9nowZwnBPIzL-Er-1I1Va4CMv-RQ4QqtEsIbdO8fs",
        "Of0DQJPyryp-UqLB2Xdr5bDSkQbm_rU7bjbL6l8uGCs",
      ],
    },
    title: {
      default: name,
      template: `%s | ${siteConfig.shortName}`,
    },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title: name,
      description,
      type: "website",
      locale: htmlLocale.replace("-", "_"),
      url: siteConfig.url,
      siteName: siteConfig.shortName,
      images: [{ url: defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [defaultOgImage],
    },
  };
}

function buildJsonLd(locale: "ar" | "en") {
  const isEnglish = locale === "en";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": siteConfig.url + "/#website",
        name: isEnglish ? "ZIKR | Islamic Platform" : siteConfig.name,
        url: siteConfig.url,
        description: isEnglish ? "ZIKR Islamic platform" : siteConfig.description,
        inLanguage: isEnglish ? "en" : "ar",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: siteConfig.url + "/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": siteConfig.url + "/#organization",
        name: siteConfig.shortName,
        url: siteConfig.url,
        logo: siteConfig.url + "/branding/logo-gold.png",
      },
    ],
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dir, lang } = await getRequestLocaleContext();
  const jsonLd = buildJsonLd(locale);

  return (
    <html
      lang={lang}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`bg-black ${notoNaskhArabic.variable}`}
      suppressHydrationWarning={true}
    >
      <head>
        {process.env.NODE_ENV === "production" && isValidGoogleAnalyticsId && (
          <>
            <Script
              id="google-analytics-src"
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics-config" strategy="lazyOnload">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}', { send_page_view: true });`}
            </Script>
          </>
        )}
        {process.env.NODE_ENV === "production" && isValidGoogleTagManagerId && (
          <Script id="google-tag-manager" strategy="lazyOnload">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${googleTagManagerId}');`}
          </Script>
        )}
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
      </head>
      <body className={locale === "ar" ? "font-arabic antialiased" : "font-sans antialiased"}>
        {process.env.NODE_ENV === "production" && isValidGoogleTagManagerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <OfflineNavigationGuard />
        <SiteShell>{children}</SiteShell>
        <NativeCapacitorBridgeLoader />
        <Analytics />
        <DeferredRuntime />
        <DeferredAnalytics />
      </body>
    </html>
  );
}
