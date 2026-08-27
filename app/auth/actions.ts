'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/env';
import { getCanonicalAuthBaseUrl } from '@/lib/auth-enhanced';

// ─── Login ────────────────────────────────────────────────────────────────────
// Uses the @supabase/ssr server client so that session cookies are written in
// Supabase's native chunked format and are visible to every server component
// that calls createClient().
export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  let next = String(formData.get('next') || '/profile');
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/profile';
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const normalizedError = error.message.toLowerCase();
    if (
      normalizedError.includes('logins are disabled') ||
      normalizedError.includes('email_provider_disabled')
    ) {
      redirect(
        `/auth/login?error=${encodeURIComponent(
          'الدخول بالبريد الإلكتروني غير مُفعّل حالياً. فعّل مزوّد Email في إعدادات المصادقة بمشروع Supabase أو استخدم الدخول عبر Google.',
        )}`,
      );
    }
    const isActionable =
      normalizedError.includes('email not confirmed') ||
      normalizedError.includes('rate limit');
    const message = isActionable
      ? error.message
      : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    redirect(`/auth/login?error=${encodeURIComponent(message)}`);
  }

  redirect(next);
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function registerAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (email.length > 254 || password.length > 128) {
    redirect('/auth/register?error=بيانات التسجيل غير صالحة.');
  }

  const supabase = await createClient();
  const requestOrigin = (await headers()).get('origin');
  const siteUrl = getCanonicalAuthBaseUrl(
    requestOrigin || getServerEnv().NEXT_PUBLIC_SITE_URL || 'https://zikrmediaofficial.vercel.app',
  );
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/profile`,
    },
  });

  if (error) {
    const normalizedError = error.message.toLowerCase();
    // Configuration-level failure: the Email provider is turned off in the
    // Supabase project's Auth settings. Surface a clear, actionable message
    // instead of a generic "try again" that hides the real cause.
    if (
      normalizedError.includes('signups are disabled') ||
      normalizedError.includes('email_provider_disabled') ||
      normalizedError.includes('email logins are disabled')
    ) {
      redirect(
        `/auth/register?error=${encodeURIComponent(
          'تسجيل الحساب بالبريد الإلكتروني غير مُفعّل حالياً. فعّل مزوّد Email في إعدادات المصادقة بمشروع Supabase أو استخدم الدخول عبر Google.',
        )}`,
      );
    }
    const isActionable =
      normalizedError.includes('password') ||
      normalizedError.includes('rate limit') ||
      normalizedError.includes('email not authorized') ||
      normalizedError.includes('already registered') ||
      normalizedError.includes('invalid email');
    const message = isActionable
      ? error.message
      : 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.';
    redirect(`/auth/register?error=${encodeURIComponent(message)}`);
  }

  if (data.user && data.session) {
    // Use the service-role client to bypass RLS for new profile creation
    const adminClient = createAdminClient();
    await adminClient.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email ?? email,
        display_name:
          typeof data.user.user_metadata?.full_name === 'string'
            ? data.user.user_metadata.full_name
            : null,
        avatar_url:
          typeof data.user.user_metadata?.avatar_url === 'string'
            ? data.user.user_metadata.avatar_url
            : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    redirect('/profile');
  }

  // If email confirmation is enabled, the session is created after the user
  // clicks the confirmation link, which points back to /profile.
  redirect('/auth/login?message=check_email');
}

// ─── Forgot password ──────────────────────────────────────────────────────────
export async function forgotAction(formData: FormData) {
  const email = String(formData.get('email') || '');
  const env = getServerEnv();
  const siteUrl = getCanonicalAuthBaseUrl(env.NEXT_PUBLIC_SITE_URL);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/reset`,
  });

  redirect('/auth/login?message=reset_sent');
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

// ─── Update profile ───────────────────────────────────────────────────────────
export async function updateProfileAction(formData: FormData) {
  const displayName = String(formData.get('displayName') || '').trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Email and role are synchronized by Auth triggers/admin code and are
  // intentionally protected by the profiles integrity trigger. A profile
  // update from the user session must only write presentation fields.
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[auth] updateProfileAction error:', error);
    redirect(`/profile?error=${encodeURIComponent('تعذر حفظ البيانات. حاول مرة أخرى.')}`);
  }

  redirect('/profile?success=profile_saved');
}
