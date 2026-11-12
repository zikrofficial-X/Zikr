import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteShell } from "@/components/layout/site-shell";

import { defaultOgImage, siteConfig } from "@/lib/site";
import { Analytics } from "@/components/layout/analytics";
import { DeferredRuntime } from "@/components/layout/deferred-runtime";
import { DeferredAnalytics } from "@/components/layout/deferred-analytics";
import { OfflineNavigationGuard } from "@/components/layout/offline-navigation-guard";
import { NativeCapacitorBridgeLoader } from "@/components/layout/native-capacitor-bridge-loader";
import { WebAdvertisingRuntime } from "@/components/layout/web-advertising-runtime";
import { getRequestLocaleContext } from "@/lib/i18n/server";
import { getSiteSetting } from "@/features/site-content/services/site-content";
import { Noto_Naskh_Arabic } from "next/font/google";

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-noto-arabic-loaded",
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const { locale, htmlLocale } = await getRequestLocaleContext();
  const isEnglish = locale === "en";
  const [seo, social] = await Promise.all([
    getSiteSetting("seo"),
    getSiteSetting("social"),
  ]);

  const defaultTitle = isEnglish ? "ZIKR | Islamic Platform" : siteConfig.name;
  const defaultDescription = isEnglish
    ? "ZIKR is a comprehensive Islamic platform for Quran, Hadith, Prophets, prayer times, remembrance, learning, and family-friendly content."
    : siteConfig.description;
  const configuredTitle = typeof seo?.title === "string" ? seo.title.trim() : "";
  const configuredDescription = typeof seo?.description === "string" ? seo.description.trim() : "";
  const name = !isEnglish && configuredTitle ? configuredTitle : defaultTitle;
  const description = !isEnglish && configuredDescription ? configuredDescription : defaultDescription;
  const ogTitle = typeof social?.ogTitle === "string" && social.ogTitle.trim()
    ? social.ogTitle.trim()
    : name;
  const ogDescription = typeof social?.ogDescription === "string" && social.ogDescription.trim()
    ? social.ogDescription.trim()
    : description;
  const configuredImage = typeof social?.ogImageUrl === "string" ? social.ogImageUrl.trim() : "";
  // Older site settings can still point to the removed, oversized default preview.
  const isLegacyDefaultOgImage = /(?:^|\/)branding\/og-image\.png(?:[?#].*)?$/i.test(configuredImage);
  const normalizedConfiguredImage = isLegacyDefaultOgImage ? defaultOgImage : configuredImage;
  const ogImage = (normalizedConfiguredImage.startsWith("/") && !normalizedConfiguredImage.startsWith("//")) || /^https:\/\//i.test(normalizedConfiguredImage)
    ? normalizedConfiguredImage
    : defaultOgImage;
  const rawKeywords = seo?.keywords;
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : typeof rawKeywords === "string"
      ? rawKeywords.split(",").map(item => item.trim()).filter(Boolean)
      : undefined;

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
    ...(keywords?.length ? { keywords } : {}),
    // Canonicals and og:url are route-specific; setting either here would be
    // inherited by child pages and incorrectly point them at the homepage.
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      locale: htmlLocale.replace("-", "_"),
      siteName: siteConfig.shortName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
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
        logo: siteConfig.url + "/branding/logo-gold.webp",
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
        
        
        <meta name="theme-color" content="#061322" />
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={locale === "ar" ? "font-arabic antialiased" : "font-sans antialiased"}>
        <WebAdvertisingRuntime />
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
