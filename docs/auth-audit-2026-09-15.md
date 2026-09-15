# ZIKR Authentication Audit — 2026-09-15

## Scope
Reviewed the authentication/OAuth surface on `main`, including browser Google OAuth, native Android OAuth, callback handling, Supabase browser/server clients, middleware/proxy, email login/registration/password reset, profile sync, mobile OAuth readiness checks, and repository documentation.

## Confirmed healthy
- Browser Google OAuth uses Supabase `signInWithOAuth`, PKCE, `skipBrowserRedirect`, and the production HTTPS callback.
- Native Google OAuth uses `com.zikr.app://auth/callback`, Capacitor Browser, `appUrlOpen`, launch URL handling, and `exchangeCodeForSession`.
- Android OAuth ownership is centralized in `NativeGoogleOAuthHandler`.
- Supabase browser client enables `flowType: 'pkce'` and `appendPkceFlowIdToRedirects`.
- Web callback route preserves `sb_flow_id` and exchanges the code with the matching flow id.
- Relative `next` redirects are sanitized against open redirects.
- Server client uses `@supabase/ssr` cookies and `auth.getUser()`.
- Native mobile readiness script verifies the required deep-link/OAuth source tokens.
- Existing auth integration tests cover redirect sanitization, canonical auth origin, PKCE error classification, and callback URI construction.

## Findings
1. **Native handler has a weak failure branch in the outer `catch`.** The error classification uses `oauthErrorDescription` even though this branch is handling exceptions from code exchange/profile-sync/other runtime operations. A runtime exception can therefore be misclassified as `google_oauth_failed` only because an unrelated `error_description` query parameter exists. This is low severity but unnecessary coupling.
2. **Native callback acceptance is broader than the Android manifest path constraint.** `native-google-oauth-handler.tsx` accepts any app deep-link pathname that starts with `/callback`, while the manifest is constrained by `/callback`. For defense-in-depth, native code should require the exact callback pathname `/callback`.
3. **Browser OAuth UX has no explicit cancellation recovery until `browserFinished` fires.** The implementation already listens for `browserFinished`, so behavior is acceptable; no source change is required without a reproduced issue.
4. **Google OAuth is configured in code but provider/URL values cannot be verified through the GitHub connector.** External Supabase/Google dashboard configuration remains a deployment-side verification item.
5. **Supabase Security Advisor currently reports leaked-password protection disabled.** This is a real security hardening item but is unrelated to Google OAuth failure.

## Non-findings
- `lib/supabase/client.ts` correctly uses `NEXT_PUBLIC_SUPABASE_URL`, not the typo-like `NEXT_PUBLIC_SUPABASE_UR` seen only in earlier generated/search output.
- No OAuth secret is stored in source code.
- `app/auth/google/route.ts` and the client button both use the native custom scheme for native flows.
- `profile-sync` requires an authenticated session and performs the privileged profile upsert server-side.

## Planned code changes on this branch
Only make targeted hardening changes justified by the audit:
- tighten native callback pathname matching to `/callback` exactly;
- simplify the native handler exception classification so runtime exceptions cannot be classified from an unrelated OAuth query parameter;
- add focused regression tests for those conditions.

No unrelated auth architecture or dependency changes are included.
