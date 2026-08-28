'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { registerAction } from '../actions';
import { GoogleOAuthButton } from '../google-oauth-button';
import { useSearchParams } from 'next/navigation';

function RegisterForm() {
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams, isClient]);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');

    const pwd = String(formData.get('password') || '');
    if (pwd.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    // registerAction redirects for both validation failures and successful
    // registrations. Do not catch its redirect signal here: catching it makes
    // Next.js render "NEXT_REDIRECT" instead of performing the navigation.
    await registerAction(formData);
  };

  if (!isClient) return <div className="text-center py-10">جاري التحميل...</div>;



  return (
    <Card className="mx-auto max-w-md space-y-6 text-right">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-brand-gold">إنشاء حساب جديد</h1>
        <p className="text-sm arabic-muted">انضم إلى ذِكر واستمتع بتجربة روحانية متميزة</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-sm text-red-300 font-medium">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            placeholder="••••••••"
            className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
          />
          <p className={`text-xs ${password.length >= 6 ? 'text-brand-gold' : 'text-brand-cream/50'}`}>
            {password.length}/6 أحرف على الأقل
          </p>
        </div>

        <Button type="submit" disabled={loading || password.length < 6} className="w-full">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-gold/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-brand-emeraldDeep px-4 arabic-muted">أو</span>
        </div>
      </div>

      <GoogleOAuthButton next={searchParams.get('next') || undefined} label="إنشاء حساب عبر Google" />

      <p className="text-center text-sm arabic-muted">
        لديك حساب بالفعل؟{' '}
        <Link href="/auth/login" className="text-brand-gold hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </Card>
  );
}

export default function Page() {
  return (
    <Container className="py-16">
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <RegisterForm />
      </Suspense>
    </Container>
  );
}

