'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { loginAction } from '../actions';
import { GoogleOAuthButton } from '../google-oauth-button';
import { useSearchParams } from 'next/navigation';

// Always show Google OAuth button — the server resolves GOOGLE_CLIENT_ID from
// the _19 suffixed env var via lib/env.ts. No NEXT_PUBLIC_ version is needed
// because the OAuth flow is initiated entirely client-side via Supabase.
const GOOGLE_OAUTH_ENABLED = true;

const MESSAGE_MAP: Record<string, string> = {
  check_email: 'تم التسجيل! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.',
  reset_sent: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.',
  auth_callback_failed: 'فشل تسجيل الدخول عبر Google. حاول مرة أخرى.',
  auth_pkce_expired: 'انتهت جلسة Google أو بدأ تسجيل الدخول من نافذة/جهاز آخر. اضغط متابعة باستخدام Google مرة أخرى من هذا المتصفح.',
  auth_session_missing: 'لم تكتمل جلسة تسجيل الدخول. حاول مرة أخرى.',
  google_oauth_unavailable: 'تسجيل الدخول عبر Google غير متاح حاليًا.',
  google_oauth_failed: 'تعذر بدء تسجيل الدخول عبر Google. حاول مرة أخرى.',
  password_updated: 'تم تحديث كلمة المرور بنجاح. يمكنك الدخول الآن.',
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const errorParam = searchParams.get('error');
    const msgParam = searchParams.get('message');
    if (errorParam) {
      setError(
        MESSAGE_MAP[errorParam] ??
          'تعذر تسجيل الدخول. تحقق من إعدادات الحساب وحاول مرة أخرى.',
      );
    }
    if (msgParam) setMessage(MESSAGE_MAP[msgParam] ?? decodeURIComponent(msgParam));
  }, [searchParams, isClient]);

  if (!isClient) return <div className="text-center py-10">جاري التحميل...</div>;

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    // loginAction redirects after both authentication failures and successful
    // logins. Let Next.js receive its redirect signal instead of converting it
    // into a visible "NEXT_REDIRECT" error in the client.
    await loginAction(formData);
  };

  return (
    <Card className="mx-auto max-w-md space-y-6 text-right">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-brand-gold">تسجيل الدخول</h1>
        <p className="text-sm arabic-muted">مرحباً بك في ذِكر - منصتك الروحانية</p>
      </div>

      {message && (
        <div className="rounded-lg bg-brand-gold/10 border border-brand-gold/30 p-4 text-center">
          <p className="text-sm text-brand-gold font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-sm text-red-300 font-medium">{error}</p>
          <p className="text-xs text-red-400 mt-2">تأكد من صحة البريد الإلكتروني وكلمة المرور</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="next" value={searchParams.get('next') || '/profile'} />
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">البريد الإلكتروني</label>
          <input
            id="email"
            name="email"
            dir="ltr"
            type="email"
            required
            disabled={loading}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">كلمة المرور</label>
          <input
            id="password"
            name="password"
            dir="ltr"
            type="password"
            required
            disabled={loading}
            placeholder="••••••••"
            className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
          />
        </div>

        <div className="text-right">
          <Link href="/auth/forgot" className="text-sm text-brand-gold hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'جاري الدخول...' : 'دخول'}
        </Button>
      </form>

      {GOOGLE_OAUTH_ENABLED && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-gold/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-brand-emeraldDeep px-4 arabic-muted">أو</span>
            </div>
          </div>

          <GoogleOAuthButton next={searchParams.get('next') || undefined} label="المتابعة باستخدام Google" />
        </>
      )}

      <p className="text-center text-sm arabic-muted">
        ليس لديك حساب؟{' '}
        <Link href="/auth/register" className="text-brand-gold hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </Card>
  );
}

export default function Page() {
  return (
    <Container className="py-16">
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
