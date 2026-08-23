'use client';

import { useEffect, useState } from 'react';
import { AUDIO_CHOICES } from '@/lib/audio/config';

export function AudioChoiceField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [isPlaying, setIsPlaying] = useState(false);
  const selected = AUDIO_CHOICES.find(choice => choice.key === value) ?? AUDIO_CHOICES[0];

  useEffect(() => setValue(defaultValue), [defaultValue]);

  return (
    <div className="grid gap-2 rounded-xl border border-brand-gold/10 bg-black/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`audio-${name}`} className="text-sm font-medium text-brand-cream/80">{label}</label>
        <span className="text-[11px] text-brand-cream/40">ملف محلي آمن</span>
      </div>
      <select
        id={`audio-${name}`}
        name={name}
        value={value}
        onChange={event => setValue(event.target.value)}
        className="w-full rounded-lg border border-brand-gold/20 bg-black/30 px-3 py-2 text-sm text-brand-cream focus:border-brand-gold focus:outline-none"
      >
        {AUDIO_CHOICES.map(choice => <option key={choice.key} value={choice.key}>{choice.label}</option>)}
      </select>
      <div className="flex flex-wrap items-center gap-3">
        <audio
          controls
          preload="none"
          src={selected.webUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          aria-label={`معاينة ${selected.label}`}
          className="h-9 max-w-full"
        />
        <span className="text-xs text-brand-cream/45">{isPlaying ? 'يعمل الآن' : selected.webUrl}</span>
      </div>
      <p className="text-[11px] leading-5 text-brand-cream/40">{hint}</p>
    </div>
  );
}
