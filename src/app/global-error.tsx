'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDiagnostics = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    console.error('[global-error-boundary]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  const buttonStyle = {
    alignItems: 'center',
    border: '1px solid rgba(232, 201, 130, 0.28)',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    font: 'inherit',
    fontWeight: 700,
    justifyContent: 'center',
    minHeight: '48px',
    padding: '12px 20px',
    textDecoration: 'none',
    width: '100%',
  } as const;

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          background: 'linear-gradient(180deg, #0b2923 0%, #061713 100%)',
          color: '#f4efe2',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          minHeight: '100vh',
        }}
      >
        <main
          style={{
            alignItems: 'center',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
          }}
        >
          <section
            aria-labelledby="global-error-title"
            style={{
              background: 'rgba(7, 25, 21, 0.96)',
              border: '1px solid rgba(232, 201, 130, 0.18)',
              borderRadius: '20px',
              boxSizing: 'border-box',
              maxWidth: '460px',
              padding: '32px 24px',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <h1
              id="global-error-title"
              style={{ color: '#e8c982', fontSize: '28px', margin: '0 0 12px' }}
            >
              حدث خطأ غير متوقع
            </h1>
            <p style={{ color: '#d4d0c5', lineHeight: 1.8, margin: '0 0 24px' }}>
              تعذر تحميل جزء من التطبيق. يمكنك إعادة المحاولة أو الرجوع إلى الصفحة الرئيسية.
            </p>

            {showDiagnostics && error.message ? (
              <p
                style={{
                  background: 'rgba(220, 38, 38, 0.10)',
                  border: '1px solid rgba(248, 113, 113, 0.22)',
                  borderRadius: '10px',
                  color: '#fecaca',
                  direction: 'ltr',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  overflowWrap: 'anywhere',
                  padding: '12px',
                  textAlign: 'left',
                }}
              >
                {error.message}
              </p>
            ) : null}

            {error.digest ? (
              <p style={{ color: '#aaa69a', direction: 'ltr', fontSize: '12px' }}>
                Error ID: {error.digest}
              </p>
            ) : null}

            <div style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  ...buttonStyle,
                  background: '#e8c982',
                  color: '#14231d',
                }}
              >
                حاول مرة أخرى
              </button>
              <a
                href="/"
                style={{
                  ...buttonStyle,
                  background: 'transparent',
                  color: '#f4efe2',
                }}
              >
                العودة للرئيسية
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
