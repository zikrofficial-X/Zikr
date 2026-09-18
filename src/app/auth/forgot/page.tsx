import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { forgotAction } from '../actions';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'نسيت كلمة المرور',
  description: 'استعادة كلمة المرور لحسابك في ذِكرٌ',
};

export default function ForgotPasswordPage() {
  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl text-brand-gold">نسيت كلمة المرور</h1>
          <p className="text-sm arabic-muted">
            أدخل بريدك الإلكتروني وسنرسل لك رابطًا لاستعادة كلمة المرور
          </p>
        </div>

        <form action={forgotAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm arabic-muted">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
              dir="ltr"
            />
          </div>

          <Button type="submit" className="w-full">
            إرسال رابط الاستعادة
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-brand-gold/70 hover:text-brand-gold transition-colors"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </Card>
    </Container>
  );
}
