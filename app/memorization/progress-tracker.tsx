'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  upsertMemorizationProgress,
  deleteMemorizationProgress,
  type MemorizationEntry,
} from './actions';

// Popular surahs for quick-add (number, name, ayahs)
const POPULAR_SURAHS: [number, string, number][] = [
  [1, 'الفاتحة', 7],
  [2, 'البقرة', 286],
  [18, 'الكهف', 110],
  [36, 'يس', 83],
  [55, 'الرحمن', 78],
  [56, 'الواقعة', 96],
  [67, 'الملك', 30],
  [78, 'النبأ', 40],
  [112, 'الإخلاص', 4],
  [114, 'الناس', 6],
];

export function ProgressTracker({
  initialEntries,
  loggedIn,
}: {
  initialEntries: MemorizationEntry[];
  loggedIn: boolean;
}) {
  const [entries, setEntries] = useState<MemorizationEntry[]>(initialEntries);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const totalMemorized = entries.reduce((sum, e) => sum + e.memorized_ayahs, 0);
  const totalTarget = entries.reduce((sum, e) => sum + e.total_ayahs, 0);

  if (!loggedIn) {
    return (
      <div className="text-center space-y-3 py-6">
        <p className="arabic-muted leading-7">سجّل الدخول لتتبع تقدمك في الحفظ سورة بسورة ومزامنته على كل أجهزتك</p>
        <Button href="/auth/login" variant="primary">تسجيل الدخول</Button>
      </div>
    );
  }

  const addSurah = (num: number, name: string, ayahs: number) => {
    if (entries.some((e) => e.surah_number === num)) return;
    setError('');
    startTransition(async () => {
      const res = await upsertMemorizationProgress({
        surahNumber: num,
        surahName: name,
        totalAyahs: ayahs,
        memorizedAyahs: 0,
      });
      if (res.ok) {
        setEntries((cur) =>
          [...cur, {
            id: `local-${num}`,
            surah_number: num,
            surah_name: name,
            total_ayahs: ayahs,
            memorized_ayahs: 0,
            last_reviewed_at: new Date().toISOString(),
          }].sort((a, b) => a.surah_number - b.surah_number),
        );
      } else {
        setError(res.error ?? 'خطأ');
      }
    });
  };

  const updateProgress = (entry: MemorizationEntry, delta: number) => {
    const next = Math.min(Math.max(entry.memorized_ayahs + delta, 0), entry.total_ayahs);
    if (next === entry.memorized_ayahs) return;
    setError('');
    setEntries((cur) => cur.map((e) => (e.surah_number === entry.surah_number ? { ...e, memorized_ayahs: next } : e)));
    startTransition(async () => {
      const res = await upsertMemorizationProgress({
        surahNumber: entry.surah_number,
        surahName: entry.surah_name,
        totalAyahs: entry.total_ayahs,
        memorizedAyahs: next,
      });
      if (!res.ok) {
        setEntries((cur) => cur.map((e) => (e.surah_number === entry.surah_number ? { ...e, memorized_ayahs: entry.memorized_ayahs } : e)));
        setError(res.error ?? 'خطأ');
      }
    });
  };

  const removeSurah = (num: number) => {
    setEntries((cur) => cur.filter((e) => e.surah_number !== num));
    startTransition(async () => {
      await deleteMemorizationProgress(num);
    });
  };

  return (
    <div className="space-y-6">
      {totalTarget > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-gold font-semibold">التقدم الكلي</span>
            <span className="arabic-muted">{totalMemorized} من {totalTarget} آية</span>
          </div>
          <div className="h-3 rounded-full bg-black/40 overflow-hidden" role="progressbar" aria-valuenow={totalMemorized} aria-valuemin={0} aria-valuemax={totalTarget}>
            <div
              className="h-full bg-brand-gold rounded-full transition-all"
              style={{ width: `${totalTarget ? Math.round((totalMemorized / totalTarget) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {entries.length > 0 && (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const pct = entry.total_ayahs ? Math.round((entry.memorized_ayahs / entry.total_ayahs) * 100) : 0;
            return (
              <li key={entry.surah_number} className="rounded-xl border border-brand-gold/20 bg-black/20 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-brand-gold">سورة {entry.surah_name}</p>
                    <p className="text-xs arabic-muted">{entry.memorized_ayahs} / {entry.total_ayahs} آية — {pct}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => updateProgress(entry, -5)} disabled={isPending || entry.memorized_ayahs === 0} aria-label={`إنقاص 5 آيات من ${entry.surah_name}`}>-5</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => updateProgress(entry, 5)} disabled={isPending || entry.memorized_ayahs >= entry.total_ayahs} aria-label={`إضافة 5 آيات إلى ${entry.surah_name}`}>+5</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => updateProgress(entry, entry.total_ayahs)} disabled={isPending || entry.memorized_ayahs >= entry.total_ayahs}>أتممت الحفظ</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSurah(entry.surah_number)} aria-label={`حذف ${entry.surah_name}`}>حذف</Button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full bg-brand-gold/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-brand-gold">أضف سورة لخطة الحفظ</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SURAHS.filter(([num]) => !entries.some((e) => e.surah_number === num)).map(([num, name, ayahs]) => (
            <button
              key={num}
              type="button"
              onClick={() => addSurah(num, name, ayahs)}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg border border-brand-gold/25 text-brand-cream text-sm hover:border-brand-gold/60 hover:text-brand-gold transition-colors disabled:opacity-50"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
