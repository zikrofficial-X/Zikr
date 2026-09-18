'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuranWird } from '@/hooks/use-quran-wird';
import { getAllSurahNames } from '@/lib/utils/surah-names';

const TARGET_PRESETS = [5, 10, 20, 50, 100];
const LOG_PRESETS = [5, 10, 20, 50];

export function WirdDashboard() {
  const {
    state,
    loaded,
    percent,
    ayahsRemaining,
    todayRemaining,
    resumePosition,
    setDailyTarget,
    logAyahs,
    reset,
  } = useQuranWird();
  const [customTarget, setCustomTarget] = useState('');

  if (!loaded) {
    return (
      <Card className="p-8 text-center text-brand-cream/60">جارٍ التحميل…</Card>
    );
  }

  const surahNames = getAllSurahNames();
  const resumeSurahName = surahNames[resumePosition.surah - 1] ?? '';
  const todayDone = Math.min(state.todayCount, state.dailyTarget);
  const todayPercent =
    state.dailyTarget > 0 ? Math.round((todayDone / state.dailyTarget) * 100) : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Today's wird progress */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-gold">وردك اليوم</h2>
          <span className="text-sm text-brand-cream/60">
            {state.todayCount} / {state.dailyTarget} آية
          </span>
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-brand-gold/10"
          role="progressbar"
          aria-valuenow={todayPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="تقدم الورد اليومي"
        >
          <div
            className="h-full rounded-full bg-brand-gold transition-all"
            style={{ width: `${todayPercent}%` }}
          />
        </div>

        {todayRemaining > 0 ? (
          <p className="text-sm text-brand-cream/70">
            تبقّى <span className="font-bold text-brand-gold">{todayRemaining}</span> آية
            لإتمام وردك اليوم
          </p>
        ) : (
          <p className="text-sm font-semibold text-brand-gold">
            أتممت وردك اليوم — تقبّل الله منك
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-sm text-brand-cream/60">سجّل قراءتك:</span>
          {LOG_PRESETS.map((n) => (
            <Button key={n} size="sm" variant="outline" onClick={() => logAyahs(n)}>
              +{n}
            </Button>
          ))}
        </div>
      </Card>

      {/* Continue reading */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-gold">متابعة القراءة</h2>
          <p className="text-sm text-brand-cream/70">
            {state.position > 0
              ? `تابع من سورة ${resumeSurahName} — الآية ${resumePosition.ayah}`
              : `ابدأ ختمتك من سورة ${resumeSurahName}`}
          </p>
        </div>
        <Button href={`/quran/${resumePosition.surah}`}>
          {state.position > 0 ? 'متابعة القراءة' : 'ابدأ القراءة'}
        </Button>
      </Card>

      {/* Khatma progress */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-gold">ختمة القرآن</h2>
          <span className="text-sm text-brand-cream/60">{percent}%</span>
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-brand-gold/10"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="تقدم ختمة القرآن"
        >
          <div
            className="h-full rounded-full bg-brand-gold transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 text-center">
          <div className="rounded-2xl bg-brand-gold/5 p-3">
            <p className="text-2xl font-bold text-brand-gold">{state.khatmaCount}</p>
            <p className="text-xs text-brand-cream/60">ختمة مكتملة</p>
          </div>
          <div className="rounded-2xl bg-brand-gold/5 p-3">
            <p className="text-2xl font-bold text-brand-gold">{state.position}</p>
            <p className="text-xs text-brand-cream/60">آية مقروءة</p>
          </div>
          <div className="rounded-2xl bg-brand-gold/5 p-3">
            <p className="text-2xl font-bold text-brand-gold">{ayahsRemaining}</p>
            <p className="text-xs text-brand-cream/60">آية متبقية</p>
          </div>
        </div>

        <p className="text-xs text-brand-cream/50">
          {state.dailyTarget > 0 && ayahsRemaining > 0
            ? `بمعدّل ${state.dailyTarget} آية يومياً، ستُتِمّ ختمتك خلال ${Math.ceil(
                ayahsRemaining / state.dailyTarget
              )} يوماً تقريباً.`
            : 'حدّد ورداً يومياً لمتابعة تقدّمك نحو الختمة.'}
        </p>
      </Card>

      {/* Streak */}
      <Card className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-gold">المداومة</h2>
          <p className="text-sm text-brand-cream/70">أيام متتالية أتممت فيها وردك</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-brand-gold">{state.streak}</p>
          <p className="text-xs text-brand-cream/60">يوم</p>
        </div>
      </Card>

      {/* Daily target settings */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-brand-gold">الورد اليومي</h2>
        <p className="text-sm text-brand-cream/70">اختر عدد الآيات التي تلتزم بقراءتها يومياً</p>
        <div className="flex flex-wrap gap-2">
          {TARGET_PRESETS.map((n) => (
            <Button
              key={n}
              size="sm"
              variant={state.dailyTarget === n ? 'primary' : 'outline'}
              onClick={() => setDailyTarget(n)}
            >
              {n} آية
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={6236}
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value)}
            placeholder="عدد مخصص"
            className="w-32 rounded-xl border border-brand-gold/30 bg-black/40 px-3 py-2 text-sm text-brand-cream focus:border-brand-gold focus:outline-none"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const n = Number.parseInt(customTarget, 10);
              if (!Number.isNaN(n) && n > 0) {
                setDailyTarget(n);
                setCustomTarget('');
              }
            }}
          >
            تعيين
          </Button>
        </div>
      </Card>

      <div className="flex justify-between">
        <Link href="/quran" className="text-sm text-brand-gold hover:underline">
          تصفّح المصحف
        </Link>
        <button
          onClick={() => {
            if (confirm('هل تريد إعادة ضبط تقدّم الختمة والورد؟')) reset();
          }}
          className="text-sm text-brand-cream/50 hover:text-brand-cream"
        >
          إعادة ضبط التقدّم
        </button>
      </div>
    </div>
  );
}
