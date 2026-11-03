# AdSense setup for ZIKR

The site code now supports one **manual, non-personalized AdSense unit on editorial article detail pages only**. AdSense is deliberately disabled by default. The Quran, Hadith, worship tools, Kids area, and native Android/iOS app do not load this AdSense unit. Auto ads should remain off in the AdSense account so placements stay limited to the reviewed article slot.

## Required account-side setup

1. In the AdSense publisher account, resolve any existing policy/site-review findings and wait until the site status is **Ready**. The code in this repository cannot approve a publisher account or make a review decision. The current canonical site origin is a `vercel.app` subdomain; the project's internal readiness check flags that as an owner-level review risk. If the account does not accept that host, connect a domain that you control before submitting again.
2. In AdSense **Privacy & messaging**, create and publish the applicable consent message. For users in the EEA, UK, and Switzerland, verify that the selected CMP is Google-certified and configured for the required IAB TCF flow. The repository already loads Google's Funding Choices message script and sets consent defaults to denied; that does not prove the publisher-account message is configured or visible.
3. Turn off **Auto ads** for this site. Create a responsive manual display unit for editorial articles and copy its numeric slot ID. The code intentionally does not invent or guess this account-generated value.
4. Set these **Production** environment variables in the existing Vercel project, then redeploy:
   - `NEXT_PUBLIC_ADSENSE_ENABLED=true`
   - `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-2457467624248791` (use the publisher ID shown in your account if it differs)
   - `NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT=<numeric slot ID from AdSense>`
5. Verify `/ads.txt` in the browser and the AdSense account. The repository already includes the Google direct-seller entry for the current publisher ID. Allow Google's crawler to revisit the site after changes.
6. Test in a clean browser session: confirm the appropriate privacy message is shown in relevant regions, the article slot can request an ad, and no AdSense request is made from `/kids`, Quran/Hadith pages, worship tools, or the native app. Do not click your own ads.

## Separate services and mobile apps

The repository has separate Monetag-tag scripts and sponsored SmartLink placements; they are not controlled by the AdSense flag. Review those formats and their own consent configuration in their provider accounts before an AdSense reapplication. Native Android/iOS ads require a separate AdMob implementation and Google Mobile Ads UMP consent flow; AdSense is not loaded in the native app.

No Supabase schema migration is required for this code-only setup. Do not put Supabase service-role keys or other secrets in any `NEXT_PUBLIC_*` variable.
