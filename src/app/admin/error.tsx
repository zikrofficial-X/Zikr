"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route error:", error);
  }, [error]);

  return (
    <Container className="py-16" dir="rtl">
      <section className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-xs tracking-[0.2em] text-red-300/55">ADMIN ERROR</p>
        <h1 className="mt-3 text-2xl font-bold text-brand-gold">تعذر تحميل وحدة الإدارة</h1>
        <p className="mt-3 text-sm leading-7 text-brand-cream/55">
          حدث خطأ غير متوقع أثناء تحميل الصفحة. يمكنك إعادة المحاولة دون مغادرة مركز الإدارة.
        </p>
        {error.digest ? <p className="mt-3 font-mono text-[11px] text-brand-cream/25" dir="ltr">مرجع الخطأ: {error.digest}</p> : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-5 py-2.5 text-sm font-semibold text-brand-gold hover:bg-brand-gold/15"
        >
          إعادة المحاولة
        </button>
      </section>
    </Container>
  );
}
