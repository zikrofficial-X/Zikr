import Script from 'next/script';

/**
 * Google Funding Choices consent management platform.
 * Displays user consent banner for ad choices and privacy preferences.
 * 
 * Loaded before AdSense after the critical page settles so consent messaging
 * can initialize before ad requests. CSP allows the Google messaging origin.
 */
export function GoogleFundingChoices() {
  return (
    <Script
      async
      src="https://fundingchoicesmessages.google.com/i/fundingchoicesmessages.js"
      strategy="lazyOnload"
    />
  );
}
