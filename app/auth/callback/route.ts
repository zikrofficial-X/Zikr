import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  extractNextPath,
  getTrustedAuthOrigin,
  isPkceVerifierError,
} from '@/lib/auth-enhanced';
import { NextRequest, NextResponse } from 'next/server';

function getOAuthProfileValue(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function loginRedirect(origin: string, code: string, next?: string) {
  const url = new URL('/auth/login', origin);
  url.searchParams.set('error', code);
  if (next) url.searchParams.set('next', next);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = getTrustedAuthOrigin(request);
  const code = searchParams.get('code');
  const safePath = extractNextPath(searchParams);

  // Supabase may forward OAuth errors directly to the callback
  const oauthError = searchParams.get('error');
  const oauthErrorDesc = searchParams.get('error_description');
  if (oauthError) {
    console.error('[auth/callback] OAuth error:', oauthError, oauthErrorDesc);
    return loginRedirect(origin, 'google_oauth_failed', safePath);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        if (isPkceVerifierError(error)) {
          console.warn(
            '[auth/callback] PKCE verifier is missing or expired; asking the user to restart OAuth',
          );
          return loginRedirect(origin, 'auth_pkce_expired', safePath);
        }

        console.error('[auth/callback] exchangeCodeForSession error:', error.message, error.status);
        return loginRedirect(origin, 'google_oauth_failed', safePath);
      }

      const user = data.user ?? (await supabase.auth.getUser()).data.user;
      if (!user) {
        const missingSessionUrl = new URL('/auth/login', origin);
        missingSessionUrl.searchParams.set('error', 'auth_session_missing');
        missingSessionUrl.searchParams.set('next', safePath);
        return NextResponse.redirect(missingSessionUrl);
      }

      {
        try {
          const metadata = user.user_metadata ?? {};
          const displayName =
            getOAuthProfileValue(metadata, 'full_name', 'name', 'display_name') ??
            user.email?.split('@')[0] ??
            null;
          const avatarUrl = getOAuthProfileValue(metadata, 'avatar_url', 'picture');

          // Use the service-role admin client to bypass RLS for the upsert.
          // The anon-key client bound to the just-exchanged session may not yet
          // have its cookies flushed to the response, so RLS checks can fail for
          // brand-new users who have no row in `profiles` yet.
          const adminClient = createAdminClient();
          const { error: upsertError } = await adminClient.from('profiles').upsert(
            {
              id: user.id,
              email: user.email ?? null,
              display_name: displayName,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
          if (upsertError) {
            console.error('[auth/callback] Profile upsert error:', upsertError.message);
          }
        } catch (profileErr) {
          console.error('[auth/callback] Profile upsert exception:', profileErr);
          // Never fail the login flow due to a profile write error
        }
      }

      return NextResponse.redirect(`${origin}${safePath}`);
    } catch (err) {
      console.error('[auth/callback] Unexpected error:', err);
      return loginRedirect(origin, 'google_oauth_failed', safePath);
    }
  }

  console.warn('[auth/callback] No code provided in callback');
  return loginRedirect(origin, 'auth_callback_failed', safePath);
}
