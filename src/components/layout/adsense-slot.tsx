"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { usePathname } from "next/navigation";
import {
  ADSENSE_ARTICLE_SLOT,
  ADSENSE_CLIENT,
  ADSENSE_CONFIGURED,
} from "./adsense";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>> & {
      requestNonPersonalizedAds?: number;
    };
  }
}

export function AdSenseSlot({ isEnglish }: { isEnglish: boolean }) {
  const [isWebRuntime, setIsWebRuntime] = useState(false);
  const pathname = usePathname();
  const slotRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    setIsWebRuntime(!Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    if (
      !isWebRuntime ||
      !ADSENSE_CONFIGURED ||
      !pathname?.startsWith("/articles/") ||
      !slotRef.current
    )
      return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.adsbygoogle.push({});
    } catch (error) {
      console.error("AdSense article slot could not be initialized.", error);
    }
  }, [isWebRuntime, pathname]);

  if (!isWebRuntime || !ADSENSE_CONFIGURED) return null;

  return (
    <aside
      aria-label={isEnglish ? "Advertisement" : "إعلان"}
      className="rounded-2xl border border-brand-gold/15 bg-black/20 p-4"
    >
      <p className="mb-3 text-center text-xs text-brand-cream/45">
        {isEnglish ? "Advertisement" : "إعلان"}
      </p>
      <ins
        key={pathname ?? "article"}
        ref={slotRef}
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_ARTICLE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
