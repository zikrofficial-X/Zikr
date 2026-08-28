
## Live AdSense and production verification

The production homepage at `https://zikrmediaofficial.vercel.app/` was opened in Chromium and checked after the intentional 15-second deferred-runtime window. The browser found the publisher meta tag `ca-pub-2457467624248791`, the AdSense loader at `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2457467624248791`, the Google Funding Choices loader at `https://fundingchoicesmessages.google.com/i/fundingchoicesmessages.js`, the canonical URL `https://zikrmediaofficial.vercel.app`, and an active Service Worker controller. The title remained `ZIKR | ذِكرٌ`.

The live page contained no console or hydration error during this check. Auto ads remain account-controlled: the repository provides the official publisher code, publisher meta tag, public `ads.txt`, CSP allowances, and privacy/CMP integration, but Google must approve the site and enable the desired ad format in the AdSense account before paid ads are served.
