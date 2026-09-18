import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الحساب',
  description: 'تسجيل الدخول وإنشاء حساب في منصة ZIKR.',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
