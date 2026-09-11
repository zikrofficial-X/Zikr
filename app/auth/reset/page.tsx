'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/client';

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

function isStrongPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return false;
  const hasDigit = /\d/u.test(password);
  const hasSymbol = /[^\p{L}\p{N}\s]/u.test(password);
  return hasDigit && hasSymbol;
}

function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      setError(`كلمة المرور يجب أن تكون من ${MIN_PASSWORD_LENGTH} إلى ${MAX_PASSWORD_LENGTH} حرفاً، وتتضمن رقماً ورمزاً خاصاً.`);
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

  const passwordValid = isStrongPassword(password);
  const confirmValid = confirm.length > 0 && password === confirm;

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
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
            />
            <p className={`text-xs ${passwordValid ? 'text-brand-gold' : 'text-brand-cream/50'}`}>
              {password.length}/{MIN_PASSWORD_LENGTH}+ حرفاً — يجب أن تحتوي على رقم ورمز خاص
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
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              disabled={loading}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold disabled:opacity-50"
            />
            {confirm && !confirmValid && (
              <p className="text-xs text-red-400">كلمتا المرور غير متطابقتين</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !passwordValid || !confirmValid}
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