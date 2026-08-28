'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/client';

function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // The session is already active after callback redirect — just update the password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message || 'حدث خطأ أثناء تحديث كلمة المرور');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login?message=password_updated'), 2000);
    } catch {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md space-y-6 text-right">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-brand-gold">إعادة تعيين كلمة المرور</h1>
        <p className="text-sm arabic-muted">أدخل كلمة مرور جديدة لحسابك</p>
      </div>

      {success && (
        <div className="rounded-lg bg-brand-gold/10 border border-brand-gold/30 p-4 text-center">
          <p className="text-sm text-brand-gold font-medium">
            تم تحديث كلمة المرور بنجاح. سيتم تحويلك لصفحة الدخول...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-sm text-red-300 font-medium">{error}</p>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              كلمة المرور الجديدة
            </label>
            <input
              id="password"
              name="password"
              dir="ltr"
              type="password"
              required
              minLength={6}
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
            />
            <p className={`text-xs ${password.length >= 6 ? 'text-brand-gold' : 'text-brand-cream/50'}`}>
              {password.length}/6 أحرف على الأقل
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm" className="block text-sm font-medium">
              تأكيد كلمة المرور
            </label>
            <input
              id="confirm"
              name="confirm"
              dir="ltr"
              type="password"
              required
              disabled={loading}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-red-400">كلمتا المرور غير متطابقتين</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirm}
            className="w-full"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
          </Button>
        </form>
      )}

      <p className="text-center text-sm arabic-muted">
        <Link href="/auth/login" className="text-brand-gold hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </Card>
  );
}

export default function Page() {
  return (
    <Container className="py-16">
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <ResetForm />
      </Suspense>
    </Container>
  );
}
