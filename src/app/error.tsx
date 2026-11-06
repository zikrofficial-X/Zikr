'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDiagnostics = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    console.error('[app-error-boundary]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-emerald to-brand-emeraldDeep">
      <Container className="py-16">
        <Card className="mx-auto max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-gold">حدث خطأ ما</h1>
            <p className="text-sm arabic-muted">
              عذراً، حدث خطأ غير متوقع في التطبيق
            </p>
          </div>

          {(showDiagnostics && error.message) || error.digest ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-left">
              {showDiagnostics && error.message ? (
                <p className="break-words font-mono text-xs text-red-300">
                  {error.message}
                </p>
              ) : null}
              {error.digest ? (
                <p className="mt-2 text-xs text-red-400">Error ID: {error.digest}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <Button onClick={reset} className="w-full">
              حاول مرة أخرى
            </Button>
            <Button href="/" variant="secondary" className="w-full">
              العودة للرئيسية
            </Button>
          </div>

          <p className="text-xs arabic-muted">
            إذا استمرت المشكلة، يرجى تحديث الصفحة أو التواصل مع الدعم
          </p>
        </Card>
      </Container>
    </main>
  );
}
