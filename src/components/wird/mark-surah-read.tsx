'use client';

import { useState } from 'react';
import { useQuranWird } from '@/hooks/use-quran-wird';

interface MarkSurahReadProps {
  surahId: number;
  lastAyah: number;
}

/**
 * A compact control shown on the surah page that lets the reader mark
 * the surah as read, advancing their daily wird and khatma progress.
 */
export function MarkSurahRead({ surahId, lastAyah }: MarkSurahReadProps) {
  const { recordRead, loaded } = useQuranWird();
  const [done, setDone] = useState(false);

  if (!loaded) return null;

  return (
    <button
      onClick={() => {
        recordRead(surahId, lastAyah);
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-gold/40 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      aria-label="تسجيل قراءة السورة في وردي"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
      >
        {done ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        ) : (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </>
        )}
      </svg>
      {done ? 'أُضيفت لوردك' : 'أتممت قراءة السورة'}
    </button>
  );
}
