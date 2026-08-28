'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDiagnostics = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[global-error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic antialiased bg-gradient-to-b from-brand-emerald to-brand-emeraldDeep min-h-screen">
        <Container className="py-16">
          <Card className="max-w-md mx-auto space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-brand-gold">حدث خطأ ما</h1>
              <p className="text-sm arabic-muted">
                عذراً، حدث خطأ غير متوقع في التطبيق
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
              {showDiagnostics && error.message && (
                <p className="text-xs text-red-300 font-mono break-words">
                  {error.message}
                </p>
              )}
              {error.digest && (
                <p className="text-xs text-red-400 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={reset}
                className="w-full"
              >
                حاول مرة أخرى
              </Button>
              <Button
                href="/"
                variant="secondary"
                className="w-full"
              >
                العودة للرئيسية
              </Button>
            </div>

            <p className="text-xs arabic-muted">
              إذا استمرت المشكلة، يرجى تحديث الصفحة أو التواصل مع الدعم
            </p>
          </Card>
        </Container>
      </body>
    </html>
  );
}
