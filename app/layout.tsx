import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteShell } from "@/components/layout/site-shell";

import { defaultOgImage, siteConfig } from "@/lib/site";
import { DeferredRuntime } from "@/components/layout/deferred-runtime";
import { NativeCapacitorBridge } from "@/components/layout/native-capacitor-bridge";

// Navbar reads the Supabase session from request cookies, so the shell must be rendered per request.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  verification: {
    google: "wq9nowZwnBPIzL-Er-1I1Va4CMv-RQ4QqtEsIbdO8fs",
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
      en: "/",
    },
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
      inLanguage: ["ar", "en"],
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
      className="bg-black"
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
      </head>
      <body className="font-arabic antialiased">
        {/* JSON-LD lives in <body> so head scripts injected at runtime (AdSense)
            cannot shift its position and break React hydration matching */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteShell>{children}</SiteShell>
        <NativeCapacitorBridge />
        <DeferredRuntime />
      </body>
    </html>
  );
}
