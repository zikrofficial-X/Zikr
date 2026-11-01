import Script from 'next/script';

/**
 * Google Funding Choices consent management platform.
 * Displays user consent banner for ad choices and privacy preferences.
 * 
 * Loaded before Google Analytics, Tag Manager, and AdSense. Consent Mode starts
 * denied in the root layout; Funding Choices can update the user's consent choice.
 */
export function GoogleFundingChoices() {
  return (
    <Script
      async
      src="https://fundingchoicesmessages.google.com/i/fundingchoicesmessages.js"
      strategy="beforeInteractive"
    />
  );
}
