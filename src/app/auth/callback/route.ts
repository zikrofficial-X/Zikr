import { createClient } from '@/lib/supabase/server';
import { syncAuthProfile } from '@/features/profile/services/profile';
import {
  extractNextPath,
  getTrustedAuthOrigin,
  isPkceVerifierError,
} from '@/lib/auth-enhanced';
import { NextRequest, NextResponse } from 'next/server';


function redirectNoStore(destination: string | URL) {
  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

function loginRedirect(origin: string, code: string, next?: string) {
  const url = new URL('/auth/login', origin);
  url.searchParams.set('error', code);
  if (next) url.searchParams.set('next', next);
  return redirectNoStore(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = getTrustedAuthOrigin(request);
  const code = searchParams.get('code');
  const safePath = extractNextPath(searchParams);
  const isNative = searchParams.get('native') === '1';
  const flowId = searchParams.get('sb_flow_id')?.trim() || null;

  // Native OAuth can use this HTTPS endpoint as a compatibility bridge. The
  // PKCE verifier remains in the native WebView, so the code must be returned
  // to that WebView together with its flow id rather than exchanged on Vercel.
  if (isNative) {
    const oauthError = searchParams.get('error');
    const oauthErrorDescription = searchParams.get('error_description');
    const nativeUrl = new URL('com.zikr.app://auth/callback');
    nativeUrl.searchParams.set('next', safePath);
    if (flowId) nativeUrl.searchParams.set('sb_flow_id', flowId);

    if (oauthError) {
      nativeUrl.searchParams.set('error', oauthError);
      if (oauthErrorDescription) {
        nativeUrl.searchParams.set('error_description', oauthErrorDescription);
      }
    } else if (code) {
      nativeUrl.searchParams.set('code', code);
    } else {
      nativeUrl.searchParams.set('error', 'auth_callback_failed');
    }

    return redirectNoStore(nativeUrl);
  }

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
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );

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
        return redirectNoStore(missingSessionUrl);
      }

      try {
        const profileSync = await syncAuthProfile(user);
        if (!profileSync.ok) {
          console.error('[auth/callback] Profile sync failed:', profileSync.error);
        }
      } catch (profileErr) {
        // Authentication must still complete when profile enrichment is unavailable.
        console.error('[auth/callback] Profile sync exception:', profileErr);
      }

      return redirectNoStore(`${origin}${safePath}`);
    } catch (err) {
      console.error('[auth/callback] Unexpected error:', err);
      return loginRedirect(origin, 'google_oauth_failed', safePath);
    }
  }

  console.warn('[auth/callback] No code provided in callback');
  return loginRedirect(origin, 'auth_callback_failed', safePath);
}
