'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import Script from 'next/script';

const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isValidMeasurementId = /^G-[A-Z0-9]+$/i.test(
  GOOGLE_ANALYTICS_ID ?? ''
);

declare global {
  interface Window {
    gtag?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

export function Analytics() {
  return (
    <>
      <VercelAnalytics />
      {process.env.NODE_ENV === 'production' && isValidMeasurementId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ANALYTICS_ID}', {
                  page_path: window.location.pathname,
                  send_page_view: true
                });
              `,
            }}
          />
        </>
      )}
    </>
  );
}
