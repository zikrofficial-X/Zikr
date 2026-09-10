# ZIKR 1.4.3

## Authentication
- Force Supabase Auth to use PKCE in the browser client.
- Enable Supabase PKCE flow-id correlation for overlapping OAuth flows.
- Preserve `sb_flow_id` through the HTTPS native callback bridge.
- Exchange the returned Google OAuth code with the matching PKCE flow id in the native app.
- Register Capacitor deep-link listeners before reading the cold-start URL.
- Re-check launch URLs when the native app becomes active.
- Keep Android `singleTask` deep-link delivery wired through `MainActivity.onNewIntent()`.
- Close the external browser best-effort after the session is established.

## Reliability
- Bound YouTube/Facebook media cleanup concurrency to reduce Vercel gateway timeouts while preserving cleanup safety checks.

## Android release
- Application ID: `com.zikr.app`
- Version name: `1.4.3`
- Version code: `34`

## Verification baseline
The Vercel preview build for this branch passed the repository verification pipeline:
- 215 Supabase migrations replayed and validated.
- 76 platform routes/assets validated.
- 294 offline routes and 16 datasets validated.
- Placeholder media validation passed.
- Mobile readiness validation passed.
- AdSense readiness validation passed.
- Lint completed without reported errors.
- TypeScript validation completed.
- Test suite: 75 tests, 0 failures.
- Next.js production build completed successfully.

A real physical-device Google OAuth round trip still requires validation on an Android device because the final Chrome/Android intent handoff cannot be proven from CI alone.
