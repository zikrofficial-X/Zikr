'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type GoogleOAuthButtonProps = {
  next?: string;
  label: string;
};

export function GoogleOAuthButton({
  next,
  label,
}: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const safeNext =
        typeof next === 'string' && next.startsWith('/')
          ? next
          : '/profile';

      // Use a full browser navigation for OAuth. Client-side router navigation
      // can treat the redirect response as an RSC request and is less reliable
      // for preserving the browser cookie that stores the Supabase PKCE verifier.
      const oauthUrl = new URL('/auth/google', window.location.origin);
      oauthUrl.searchParams.set('next', safeNext);
      window.location.assign(oauthUrl.toString());

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'تعذر تسجيل الدخول عبر Google. حاول مرة أخرى.';

      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onClick}
        disabled={loading}
      >
        {loading
          ? 'جارٍ التوجيه إلى Google...'
          : label}
      </Button>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">
            {error}
          </p>

          <p className="mt-1 text-xs text-red-400">
            تأكد من تفعيل Google OAuth في إعدادات Supabase
          </p>
        </div>
      )}
    </div>
  );
}
