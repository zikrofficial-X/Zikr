'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/env';
import { getCanonicalAuthBaseUrl } from '@/lib/auth-enhanced';
import { isPwnedPassword } from '@/lib/security/pwned-password';

type AuthActionResult =
  | { ok: true; next?: string; message?: string }
  | { ok: false; message: string };

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const EMAIL_MAX_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function isStrongPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return false;
  const hasDigit = /\d/u.test(password);
  const hasSymbol = /[^\p{L}\p{N}\s]/u.test(password);
  return hasDigit && hasSymbol;
}

function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email);
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value || '/profile');
  return next.startsWith('/') && !next.startsWith('//') ? next : '/profile';
}

function loginErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('logins are disabled') || normalized.includes('email_provider_disabled')) {
    return 'الدخول بالبريد الإلكتروني غير مُفعّل حالياً. فعّل مزوّد Email في إعدادات المصادقة بمشروع Supabase أو استخدم الدخول عبر Google.';
  }
  if (normalized.includes('email not confirmed')) return 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.';
  if (normalized.includes('rate limit')) return 'تم تجاوز عدد المحاولات المسموح بها مؤقتاً. حاول مرة أخرى بعد قليل.';
  return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const next = safeNext(formData.get('next'));

  if (!isValidEmail(email) || !password) {
    return { ok: false, message: 'أدخل بريداً إلكترونياً صحيحاً وكلمة المرور.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: loginErrorMessage(error.message) };
    return { ok: true, next };
  } catch (error) {
    console.error('[auth] loginAction error:', error);
    return { ok: false, message: 'تعذر إتمام تسجيل الدخول. حاول مرة أخرى.' };
  }
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!isValidEmail(email)) {
    return { ok: false, message: 'أدخل بريداً إلكترونياً صحيحاً.' };
  }

  if (!isStrongPassword(password)) {
    return {
      ok: false,
      message: `كلمة المرور يجب أن تكون من ${MIN_PASSWORD_LENGTH} إلى ${MAX_PASSWORD_LENGTH} حرفاً، وتتضمن رقماً ورمزاً خاصاً.`,
    };
  }

  try {
    const pwned = await isPwnedPassword(password);
    if (pwned) {
      return { ok: false, message: 'كلمة المرور ظهرت في تسريبات سابقة. اختر كلمة مرور أخرى غير مستخدمة من قبل.' };
    }
  } catch (error) {
    // Availability of the breach-check service must never block account creation.
    console.warn('[auth] compromised-password screening unavailable:', error);
  }

  try {
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
      if (
        normalizedError.includes('signups are disabled') ||
        normalizedError.includes('email_provider_disabled') ||
        normalizedError.includes('email logins are disabled')
      ) {
        return {
          ok: false,
          message: 'تسجيل الحساب بالبريد الإلكتروني غير مُفعّل حالياً. فعّل مزوّد Email في إعدادات المصادقة بمشروع Supabase أو استخدم التسجيل عبر Google.',
        };
      }
      if (normalizedError.includes('already registered')) {
        return { ok: false, message: 'هذا البريد الإلكتروني مسجل بالفعل. انتقل إلى تسجيل الدخول.' };
      }
      if (normalizedError.includes('password')) {
        return { ok: false, message: error.message };
      }
      if (normalizedError.includes('rate limit')) {
        return { ok: false, message: 'تم تجاوز عدد المحاولات المسموح بها مؤقتاً. حاول مرة أخرى بعد قليل.' };
      }
      return { ok: false, message: 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.' };
    }

    if (data.user && data.session) {
      try {
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
          { onConflict: 'id' },
        );
      } catch (profileError) {
        console.error('[auth] register profile upsert error:', profileError);
      }
      return { ok: true, next: '/profile' };
    }

    return {
      ok: true,
      message: 'تم التسجيل! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.',
    };
  } catch (error) {
    console.error('[auth] registerAction error:', error);
    return { ok: false, message: 'تعذر إنشاء الحساب. حاول مرة أخرى.' };
  }
}

export async function forgotAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const env = getServerEnv();
  const siteUrl = getCanonicalAuthBaseUrl(env.NEXT_PUBLIC_SITE_URL);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/reset`,
  });

  redirect('/auth/login?message=reset_sent');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function updateProfileAction(formData: FormData) {
  const displayName = String(formData.get('displayName') || '').trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

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