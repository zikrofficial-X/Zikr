'use client';

import { useEffect, useMemo, useState } from 'react';
import { AudioLines, ExternalLink, Headphones, Mic2, Sparkles } from 'lucide-react';

type AudioAsset = { title: string | null; url: string; updatedAt: string | null };
type AudioResponse = { assets?: Record<string, AudioAsset> };

type AudioEntry = {
  id: string;
  kind: 'adhan' | 'dhikr' | 'salawat';
  title: string;
  description: string;
  url: string;
  source?: string;
  sourceUrl?: string;
  badge: string;
};

const CC0_ADHAN = 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Beautiful_adhan.ogg';
const CC0_SOURCE = 'https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg';

function Player({ entry }: { entry: AudioEntry }) {
  return <audio controls preload="none" src={entry.url} className="h-10 w-full rounded-lg" aria-label={`تشغيل ${entry.title}`} />;
}

export function AudioLibrary() {
  const [assets, setAssets] = useState<Record<string, AudioAsset>>({});

  useEffect(() => {
    fetch('/api/site-audio', { cache: 'no-store' })
      .then(response => response.ok ? response.json() as Promise<AudioResponse> : { assets: {} })
      .then(payload => setAssets(payload.assets ?? {}))
      .catch(() => setAssets({}));
  }, []);

  const entries = useMemo<AudioEntry[]>(() => [
    {
      id: 'adhan',
      kind: 'adhan',
      title: assets.adhan?.title ?? 'الأذان — تسجيل مفتوح',
      description: 'مقطع أذان جاهز للاستخدام، مع إمكانية استبداله من لوحة الإدارة عند توفر تسجيل أساسي للمكتبة.',
      url: assets.adhan?.url ?? CC0_ADHAN,
      source: assets.adhan ? 'مكتبة ذِكر' : 'Wikimedia Commons — CC0',
      sourceUrl: assets.adhan ? undefined : CC0_SOURCE,
      badge: assets.adhan ? 'المقطع الأساسي' : 'تسجيل مفتوح',
    },
    {
      id: 'dhikr',
      kind: 'dhikr',
      title: assets.dhikr?.title ?? 'الذكر والتذكير',
      description: 'مسار مستقل للذكر الصوتي والتذكيرات القصيرة. يقرأ المقطع من Supabase عندما يعيّن الأدمن مقطعًا أساسيًا، وإلا يستخدم الملف المحلي كخطة احتياطية.',
      url: assets.dhikr?.url ?? '/audio/salawat.wav',
      source: assets.dhikr ? 'مكتبة ذِكر' : 'ملف صوتي مضمّن',
      badge: assets.dhikr ? 'من الإدارة' : 'جاهز محليًا',
    },
    {
      id: 'salawat',
      kind: 'salawat',
      title: assets.salawat?.title ?? 'الصلاة على النبي ﷺ',
      description: 'تذكير صوتي مستقل للصلاة على النبي ﷺ، منفصل عن الأذان حتى لا تختلط إعدادات التنبيهات.',
      url: assets.salawat?.url ?? '/audio/salawat.wav',
      source: assets.salawat ? 'مكتبة ذِكر' : 'ملف صوتي مضمّن',
      badge: assets.salawat ? 'من الإدارة' : 'جاهز محليًا',
    },
  ], [assets]);

  const icons = { adhan: Mic2, dhikr: Sparkles, salawat: AudioLines } as const;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {entries.map(entry => {
          const Icon = icons[entry.kind];
          return (
            <article key={entry.id} className="group rounded-3xl border border-brand-gold/15 bg-black/20 p-5 transition hover:-translate-y-0.5 hover:border-brand-gold/35">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-gold/15 bg-brand-gold/5 text-brand-gold"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="rounded-full border border-brand-gold/15 bg-brand-gold/5 px-2.5 py-1 text-[10px] text-brand-gold">{entry.badge}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-brand-cream">{entry.title}</h2>
              <p className="mt-2 min-h-14 text-sm leading-7 text-brand-cream/60">{entry.description}</p>
              <div className="mt-5"><Player entry={entry} /></div>
              <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-brand-cream/50">
                <span className="inline-flex items-center gap-1"><Headphones className="h-3.5 w-3.5" aria-hidden="true" />{entry.source}</span>
                {entry.sourceUrl && <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-gold hover:text-brand-goldSoft">المصدر <ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            </article>
          );
        })}
      </div>
      <p className="rounded-2xl border border-brand-cream/10 bg-white/[0.02] px-4 py-3 text-xs leading-6 text-brand-cream/55">
        النظام يفصل بين الأنواع الثلاثة ولا يكرر نفس المشغل في صفحات مختلفة. الإدارة تستطيع تعيين مقطع أساسي لكل نوع من /admin/site-audio.
      </p>
    </div>
  );
}
