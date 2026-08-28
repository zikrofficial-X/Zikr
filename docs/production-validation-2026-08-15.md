# Production Validation Evidence — 15 Aug 2026

Base URL: https://zikrmediaofficial.vercel.app

## Production audit

```json
{
  "declaredRoutes": 40,
  "staticPages": 40,
  "sitemapFiles": 2,
  "sitemapUrls": 68760,
  "dynamicSampled": 120,
  "apiRoutes": 12,
  "public200Pages": 156,
  "issues": 0
}
```

## Sitemap live checks

| Path | Status | Content type | `<loc>` count |
|---|---:|---|---:|
| `/sitemap-index.xml` | 200 | `application/xml; charset=utf-8` | 2 |
| `/sitemap-content/0.xml` | 200 | `application/xml; charset=utf-8` | 45,000 |
| `/sitemap-content/0` | 200 | `application/xml; charset=utf-8` | XML body, rewrite target |
| `/sitemap-content/1.xml` | 200 | `application/xml; charset=utf-8` | 23,760 |
| `/robots.txt` | 200 | `text/plain; charset=utf-8` | Sitemap index declared |

## OAuth live checks

`/auth/google` returned HTTP 307 to the Supabase Google authorize endpoint with the production callback URL, PKCE challenge, and `prompt=select_account`. `/auth/login` and `/auth/register` returned HTTP 200. A direct `/auth/callback` request without a code redirected to login with the expected callback error, confirming the missing-code guard.

## Current deployment runtime

Deployment `dpl_2q6XEkUtBCG1rfLvV4gBKUnr1oSS` was READY. Current runtime sampling showed all 22 discovered battle detail routes returning HTTP 200 and `/api/internal/video-processing` returning HTTP 200. No current deployment runtime exception was observed in the sampled logs.
