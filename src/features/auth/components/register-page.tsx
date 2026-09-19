'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { registerAction } from '@/features/auth/actions';
import { GoogleOAuthButton } from '@/features/auth/components/google-oauth-button';
import { useRouter, useSearchParams } from 'next/navigation';

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

function isStrongPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return false;
  return /\d/u.test(password) && /[^\p{L}\p{N}\s]/u.test(password);
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient) return;
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    if (errorParam) setError(errorParam);
    if (messageParam) setMessage(messageParam);
  }, [searchParams, isClient]);

  const passwordLengthOk = password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
  const passwordStrong = isStrongPassword(password);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    setMessage('');

    const email = String(formData.get('email') || '').trim();

    if (!email) {
      setError('أدخل البريد الإلكتروني.');
      setLoading(false);
      return;
    }

    if (!passwordLengthOk) {
      setError(`كلمة المرور يجب أن تكون من ${MIN_PASSWORD_LENGTH} إلى ${MAX_PASSWORD_LENGTH} حرفاً.`);
      setLoading(false);
      return;
    }

    if (!passwordStrong) {
      setError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل ورمز خاص واحد على الأقل.');
      setLoading(false);
      return;
    }

    try {
      const result = await registerAction(formData);
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      if (result.next) {
        router.replace(result.next);
        router.refresh();
        return;
      }
      setMessage(result.message || 'تم التسجيل! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
      setLoading(false);
    } catch (err) {
      console.error('[auth/register] client action error:', err);
      setError('تعذر إنشاء الحساب. حاول مرة أخرى.');
      setLoading(false);
    }
  };

  if (!isClient) return <div className="text-center py-10">جاري التحميل...</div>;

  return (
    <Card className="mx-auto max-w-md space-y-6 text-right">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-brand-gold">إنشاء حساب جديد</h1>
        <p className="text-sm arabic-muted">انضم إلى ذِكر واستمتع بتجربة روحانية متميزة</p>
      </div>

      {message && (
        <div className="rounded-lg bg-brand-gold/10 border border-brand-gold/30 p-4 text-center">
          <p className="text-sm text-brand-gold font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-sm text-red-300 font-medium">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">البريد الإلكتروني</label>
          <input id="email" name="email" dir="ltr" type="email" required disabled={loading} placeholder="بريدك الإلكتروني" autoComplete="email" className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50" />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">كلمة المرور</label>
          <input id="password" name="password" dir="ltr" type="password" required disabled={loading} value={password} onChange={(e) => setPassword(e.target.value)} minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" placeholder="••••••••••••" className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50" />
          <div className="space-y-1 text-xs">
            <p className={passwordLengthOk ? 'text-brand-gold' : 'text-brand-cream/50'}>
              {password.length}/{MIN_PASSWORD_LENGTH} حرفاً على الأقل
            </p>
            <p className={/\d/u.test(password) ? 'text-brand-gold' : 'text-brand-cream/50'}>• رقم واحد على الأقل</p>
            <p className={/[^\p{L}\p{N}\s]/u.test(password) ? 'text-brand-gold' : 'text-brand-cream/50'}>• رمز خاص واحد على الأقل</p>
          </div>
        </div>

        <Button type="submit" disabled={loading || !passwordStrong} className="w-full">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-gold/20" /></div>
        <div className="relative flex justify-center text-sm"><span className="bg-brand-emeraldDeep px-4 arabic-muted">أو</span></div>
      </div>

      <GoogleOAuthButton next={searchParams.get('next') || undefined} label="إنشاء حساب عبر Google" />

      <p className="text-center text-sm arabic-muted">
        لديك حساب بالفعل؟{' '}
        <Link href="/auth/login" className="text-brand-gold hover:underline">تسجيل الدخول</Link>
      </p>
    </Card>
  );
}

export function RegisterPage() {
  return (
    <Container className="py-16">
      <Suspense fallback={<div>جاري التحميل...</div>}><RegisterForm /></Suspense>
    </Container>
  );
}
