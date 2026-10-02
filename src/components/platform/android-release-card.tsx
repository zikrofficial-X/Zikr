"use client";

import { useEffect, useState } from "react";

type AppVersion = {
  version?: string;
  tag?: string;
  apkUrl?: string;
  aabUrl?: string;
  releaseUrl?: string;
  publishedAt?: string | null;
  name?: string;
  aabName?: string | null;
};

export default function AndroidReleaseCard() {
  const [release, setRelease] = useState<AppVersion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/app-version", { cache: "no-store" })
      .then(async response => {
        const data = (await response.json()) as AppVersion & { error?: string };
        if (!response.ok) throw new Error(data.error || "تعذر جلب الإصدار");
        if (mounted) setRelease(data);
      })
      .catch(err => {
        if (mounted) setError(err instanceof Error ? err.message : "تعذر جلب الإصدار");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      className="rounded-2xl border border-brand-gold/20 bg-brand-emerald/10 p-8 text-center space-y-4"
      aria-labelledby="android-download-title"
    >
      <p className="text-xs tracking-[0.18em] text-brand-gold/70">الإصدار الرسمي</p>
      <h2 id="android-download-title" className="text-2xl font-bold text-brand-gold">
        تطبيق ذِكرٌ لنظام Android
      </h2>
      <p className="text-brand-cream/70 leading-7">
        يتم توجيه التنزيل تلقائيًا إلى أحدث GitHub Release مستقر تم التحقق منه.
        الـAPK مخصص للتثبيت المباشر، بينما AAB مخصص للتوزيع والبناء.
      </p>

      {release ? (
        <div className="grid gap-3 sm:grid-cols-3 text-right" dir="rtl">
          <div className="rounded-xl border border-brand-gold/10 bg-black/15 p-4">
            <p className="text-xs text-brand-cream/35">الإصدار</p>
            <p className="mt-1 font-mono text-lg text-brand-gold">{release.version ?? release.tag}</p>
          </div>
          <div className="rounded-xl border border-brand-gold/10 bg-black/15 p-4">
            <p className="text-xs text-brand-cream/35">الحزمة</p>
            <p className="mt-1 text-sm text-brand-cream/70">{release.aabName ?? "APK + AAB"}</p>
          </div>
          <div className="rounded-xl border border-brand-gold/10 bg-black/15 p-4">
            <p className="text-xs text-brand-cream/35">حالة النشر</p>
            <p className="mt-1 text-sm text-emerald-300">Release مستقر</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={release?.apkUrl ?? "/api/download/android"}
          className="inline-flex items-center justify-center rounded-full bg-brand-gold px-8 py-3 font-bold text-black hover:bg-brand-gold/90 transition-colors"
        >
          تنزيل أحدث APK
        </a>
        <a
          href={release?.aabUrl ?? "/api/download/android/aab"}
          className="inline-flex items-center justify-center rounded-full border border-brand-gold/30 px-6 py-3 font-bold text-brand-gold hover:bg-brand-gold/10 transition-colors"
        >
          تنزيل AAB
        </a>
        {release?.releaseUrl ? (
          <a
            href={release.releaseUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center rounded-full border border-brand-gold/20 px-6 py-3 text-sm text-brand-gold/80 hover:bg-brand-gold/10 transition-colors"
          >
            ملاحظات الإصدار
          </a>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-amber-200/80">{error}</p>
      ) : (
        <p className="text-xs text-brand-cream/50">
          افحص SHA-256 المنشور مع كل Release قبل تثبيت الملف.
        </p>
      )}
    </section>
  );
}
