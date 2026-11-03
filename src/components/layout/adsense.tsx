import Script from "next/script";

// Publisher ID confirmed from the existing AdSense meta tag and ads.txt.
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "ca-pub-2457467624248791";
export const ADSENSE_ARTICLE_SLOT =
  process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT?.trim() || "";
export const ADSENSE_CONFIGURED =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" &&
  /^ca-pub-\d{8,}$/.test(ADSENSE_CLIENT) &&
  /^\d+$/.test(ADSENSE_ARTICLE_SLOT);

/**
 * Loads the Google AdSense tag only when the owner enables a reviewed,
 * manually-configured article slot. Auto Ads should remain disabled in the
 * publisher account so ads never appear outside the explicit editorial slot.
 */
export function AdSense() {
  if (!ADSENSE_CONFIGURED) return null;

  return (
    <Script
      id="google-adsense-loader"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
