# ZIKR API and Server Action Reference

> Scope: this document describes selected current interfaces. It is not a complete route inventory. The source of truth for REST handlers is src/app/api/**/route.ts; the admin permission contract is docs/admin/ADMIN_API_PERMISSION_MATRIX_2026-11-06.md.

## Important distinction: REST routes vs Server Actions

A Server Action is a framework-managed function call, not a stable public REST endpoint. Do not call a Server Action by inventing a URL such as /auth/login or /memorization/evaluate. The functions below are exported from source modules and are invoked by the app's forms/components.

## Authentication and session handling

ZIKR uses Supabase Auth through @supabase/ssr.

- Server clients use Supabase's SSR cookie adapter and Next.js cookies.
- The Next.js proxy mirrors Supabase cookie refreshes to the request and response, then validates the user with supabase.auth.getUser().
- Cookie names, chunking, and token lifetimes are managed by the installed Supabase SSR/Auth configuration. The application does not define fixed sb_access_token or sb_refresh_token cookie names, nor does it hard-code access/refresh expiry periods.
- The browser session is not set by a custom setSessionAction. The web OAuth callback exchanges the PKCE authorization code with exchangeCodeForSession().
- Native OAuth uses the HTTPS callback as a bridge: when native=1 is present, the callback returns the authorization code to the com.zikr.app://auth/callback scheme so the native WebView can complete its PKCE flow.

### Current authentication Server Actions

Source: src/features/auth/actions.ts

| Function | Behavior |
|---|---|
| loginAction | Validates the email and non-empty password, calls Supabase password sign-in, and returns an { ok, next } result. The login client performs the navigation. |
| registerAction | Validates email and a 12–128 character password containing a digit and a symbol; performs a best-effort breached-password check; then calls Supabase sign-up. Email confirmation behavior depends on the Supabase Auth project configuration. |
| updatePasswordAction | Requires an authenticated Supabase user and applies the same password-strength and breached-password checks. |
| forgotAction | Requests a password-reset email whose redirect returns through /auth/callback. |
| logoutAction | Signs out through Supabase Auth. |
| updateProfileAction | Delegates profile validation and persistence to the profile service. |

Google OAuth is started by the auth integration in src/features/auth/integrations/google-oauth.ts. The callback handler is src/app/auth/callback/route.ts; it validates the trusted origin and next path, exchanges the code for a web session, and synchronizes the profile without making profile-enrichment failure fatal to authentication.

### Authorization

Admin access is permission-based, not a single unrestricted role check. The effective role is resolved from profiles.role and admin_role_assignments.role. An assignment lookup failure fails closed; a legacy admin profile without a delegated assignment retains the legacy admin role. Route handlers use server-side permission guards, and sensitive actions can additionally require an AAL2 MFA step-up.

Use the route-by-route permission matrix in docs/admin/ADMIN_API_PERMISSION_MATRIX_2026-11-06.md when reviewing admin APIs. Hiding a navigation item is not an authorization control.

## Selected current REST routes

These are concrete route handlers in src/app/api. Other route handlers exist; consult the source tree and each route's guard for the complete current inventory.

| Method | Route | Session | Required | Contract |
|---|---|---|---|---|
| POST | `/api/poetry-insight` | Supabase user | Required | JSON object with poem and title; body bounded to 64 KiB; title max 200 characters; poem max 12,000 characters; five requests per user per 10 minutes. |
| GET | `/api/user/profile` | Supabase user | Required | Returns the current user's profile and selected Auth metadata. |
| PUT | `/api/user/profile` | Supabase user | Required | Bounded JSON update delegated to the profile service; invalid input returns 400. |
| GET | `/api/user/favorites` | Supabase user | Required | Returns only the current user's favorites. |
| POST | `/api/user/favorites` | Supabase user | Required | Bounded JSON body; accepts quran, hadith, story, scholar, or dua item types. |
| DELETE | `/api/user/favorites` | Supabase user | Required | Removes by favorite row id or by item reference and type. |
| GET | `/api/admin/social` | Admin permission | Required | Requires social.manage; reads the social queue, connection health, and available insights. |
| POST | `/api/admin/social` | Admin permission + step-up for sensitive actions | Required | Requires social.manage; sensitive publishing/recovery actions also require social.publish and MFA step-up. Queue release is separately confirmed and audited. |

### POST /api/poetry-insight

**Authentication:** Required (authenticated Supabase session)

**Authorization:** Any signed-in user; no admin role required

**Request:** JSON object containing non-empty poem and title strings. The streamed request body is capped at 64 KiB; title is limited to 200 characters and poem to 12,000 characters.

**Rate limit:** Five evaluations per authenticated user per 10 minutes. The shared limiter runs before Gemini; if the limiter is unavailable, the route returns 503 rather than invoking Gemini.

**Responses:**
- 200 — generated insight.
- 400 — invalid JSON object, missing values, or text exceeds the field limits.
- 401 Unauthorized — no authenticated Supabase session.
- 413 — request body exceeds the 64 KiB limit.
- 429 — the user's quota is exhausted.
- 500 — generation or unexpected server failure.
- 503 — the shared rate-limit service is unavailable.

---

### AI Server Actions

- evaluateMemorizationAction is exported from src/app/memorization/actions.ts. It is a Server Action, not a REST route. It allows 3 evaluations per 10 minutes per trusted client address and accepts audio up to a maximum 3 MiB; size/type validation and the shared rate limit run before Gemini.
- sendChatMessage is exported from src/app/spiritual-ai/actions.ts. It is a Server Action, not a REST route. It sanitizes history, applies a shared rate limit, and uses the spiritual-answer safety policy and retrieved citations.

These actions are not authenticated by a user session in their current implementation. Their rate-limit and input-safety controls are therefore part of the security boundary; do not document them as authenticated endpoints.

## Response and error handling

Each route owns its response schema and status behavior. Do not assume that every endpoint returns one common error envelope or supports every generic HTTP status. Check the route handler and its regression tests before changing a client contract.

## Verification

Run the repository's canonical verification command (pnpm verify) for the complete automated suite. Focused checks include:

- pnpm auth:check
- pnpm admin:api:check
- pnpm admin:rbac:check
- pnpm routes:check

No documentation verification should invoke Gemini, publish content, mutate production data, or dispatch a background worker.
