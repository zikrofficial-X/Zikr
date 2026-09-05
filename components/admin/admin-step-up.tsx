'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AdminStepUp({ nextPath }: { nextPath: string }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('جاري تجهيز التحقق…');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const factor = data.totp.find((item: { status: string }) => item.status === 'verified');
        if (!factor) {
          setMessage('لا يوجد عامل MFA موثّق لهذا الحساب. يجب إعداد تطبيق المصادقة من إعدادات الحساب أولاً.');
          return;
        }
        setFactorId(factor.id);
        setMessage('أدخل رمز تطبيق المصادقة المكوّن من 6 أرقام.');
      } catch {
        setMessage('تعذر تجهيز التحقق متعدد العوامل.');
      }
    })();
  }, []);

  async function verify() {
    if (!factorId || !/^\d{6}$/.test(code)) {
      setMessage('أدخل رمزًا صحيحًا من 6 أرقام.');
      return;
    }
    setBusy(true);
    setMessage('جاري التحقق…');
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (error) throw error;
      window.location.replace(nextPath || '/admin');
    } catch {
      setMessage('رمز التحقق غير صحيح أو انتهت صلاحيته.');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-gold/10 bg-black/20 p-5 space-y-3">
      <p className="text-sm leading-7 text-brand-cream/65">{message}</p>
      <div className="flex flex-wrap gap-2">
        <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" className="w-36 rounded-xl border border-brand-gold/15 bg-black/20 px-4 py-2.5 text-center font-mono tracking-[0.3em] text-brand-cream outline-none focus:border-brand-gold/40" />
        <button type="button" disabled={!factorId || busy} onClick={() => void verify()} className="rounded-xl border border-brand-gold/25 px-4 py-2.5 text-sm font-semibold text-brand-gold disabled:opacity-40">{busy ? 'تحقق…' : 'تأكيد'}</button>
      </div>
    </div>
  );
}
