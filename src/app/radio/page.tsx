'use client';

import { useMemo, useRef, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRadioChannels, type RadioCategory, type RadioChannel } from '@/features/audio/services/radio';

const stations = getRadioChannels();

const FILTERS: Array<{ id: 'all' | RadioCategory; label: string }> = [
  { id: 'all', label: 'كل الإذاعات' },
  { id: 'quran', label: 'القرآن الكريم' },
  { id: 'tawasheeh', label: 'تلاوات متنوعة' },
];

export default function RadioPage() {
  const [current, setCurrent] = useState<RadioChannel | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RadioCategory>('all');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredStations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stations.filter((station) => {
      const categoryMatch = filter === 'all' || station.category === filter;
      const haystack = [station.name, station.description, ...station.tags].join(' ').toLowerCase();
      return categoryMatch && (!q || haystack.includes(q));
    });
  }, [filter, query]);

  const playRadioChannel = (station: RadioChannel) => {
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(station.streamUrl);
    audio.preload = 'none';
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('error', () => {
      setError('تعذر تشغيل المحطة. قد يكون المصدر الخارجي متوقفًا أو محجوبًا مؤقتًا.');
      setPlaying(false);
    });

    audio
      .play()
      .then(() => {
        setCurrent(station);
        setPlaying(true);
        setRecentIds((currentIds) => [station.id, ...currentIds.filter((id) => id !== station.id)].slice(0, 5));
      })
      .catch(() => {
        setError('تعذر تشغيل المحطة. اضغط استماع مرة أخرى أو اختر محطة أخرى.');
        setPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!audioRef.current || !current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setError('تعذر استئناف التشغيل.'));
    }
  };

  const changeVolume = (value: number) => {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
  };

  const recentStations = recentIds
    .map((id) => stations.find((station) => station.id === id))
    .filter((station): station is RadioChannel => Boolean(station));

  return (
    <Container className='space-y-8 py-10 text-right' dir='rtl'>
      <section className='space-y-4'>
        <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <p className='text-xs uppercase tracking-[0.25em] text-brand-cream/40'>ZIKR LIVE RADIO</p>
            <h1 className='text-4xl font-bold text-brand-gold'>إذاعة ذِكرٌ</h1>
            <p className='mt-2 max-w-3xl leading-8 arabic-muted'>
              مجموعة موسعة من بثوث القرآن الكريم والتلاوات، مع بحث وفلاتر ومحطة حالية وتحكم كامل في الصوت.
            </p>
          </div>
          <div className='rounded-full border border-brand-gold/15 bg-brand-gold/5 px-4 py-2 text-sm text-brand-gold'>
            {stations.length} محطة متاحة
          </div>
        </div>

        <div className='grid gap-3 md:grid-cols-[1fr_auto]'>
          <input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='ابحث باسم القارئ أو نوع التلاوة...'
            className='w-full rounded-xl border border-brand-gold/20 bg-black/20 px-4 py-3 text-brand-cream placeholder:text-brand-cream/35 focus:border-brand-gold/50 focus:outline-none'
          />
          <div className='flex flex-wrap gap-2'>
            {FILTERS.map((item) => (
              <Button
                key={item.id}
                variant={filter === item.id ? 'primary' : 'outline'}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {current && (
        <Card className='space-y-5 border-brand-gold/20 bg-brand-gold/5 p-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <span className='inline-flex items-center gap-2 text-xs text-emerald-300'>
                <span className='h-2 w-2 animate-pulse rounded-full bg-emerald-400' />
                {playing ? 'مباشر الآن' : 'متوقف مؤقتًا'}
              </span>
              <h2 className='mt-2 text-2xl font-bold text-brand-gold'>{current.name}</h2>
              <p className='mt-1 text-sm arabic-muted'>{current.description}</p>
            </div>
            <button
              onClick={togglePlay}
              aria-label={playing ? 'إيقاف الإذاعة' : 'استئناف الإذاعة'}
              className='flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold text-2xl text-brand-emeraldDeep transition-transform hover:scale-105'
            >
              {playing ? '⏸' : '▶'}
            </button>
          </div>

          <div className='flex w-full max-w-xl items-center gap-3'>
            <span className='text-sm arabic-muted'>🔊</span>
            <input
              type='range'
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => changeVolume(parseFloat(event.target.value))}
              className='flex-1 accent-brand-gold'
              aria-label='مستوى الصوت'
            />
          </div>

          {error && (
            <div role='alert' className='rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100'>
              {error}
            </div>
          )}
        </Card>
      )}

      {recentStations.length > 0 && (
        <section className='space-y-3'>
          <h2 className='text-xl font-bold text-brand-gold'>استمعت إليها مؤخرًا</h2>
          <div className='flex flex-wrap gap-2'>
            {recentStations.map((station) => (
              <Button key={station.id} variant='outline' onClick={() => playRadioChannel(station)}>
                {station.name.replace('إذاعة القرآن - ', '').replace('إذاعة القرآن الكريم - ', '')}
              </Button>
            ))}
          </div>
        </section>
      )}

      <section className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filteredStations.map((station) => (
          <Card key={station.id} className='space-y-4 border-brand-gold/10'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='text-lg font-bold text-brand-gold'>{station.name}</h2>
                <p className='mt-1 text-sm leading-6 arabic-muted'>{station.description}</p>
              </div>
              {current?.streamUrl === station.streamUrl && playing && (
                <span className='shrink-0 text-xs text-emerald-300'>● مباشر</span>
              )}
            </div>

            <div className='flex flex-wrap gap-2'>
              {station.tags.slice(0, 3).map((tag) => (
                <span key={tag} className='rounded-full border border-brand-gold/10 px-2.5 py-1 text-xs text-brand-cream/55'>
                  {tag}
                </span>
              ))}
            </div>

            <Button
              onClick={() => playRadioChannel(station)}
              variant={current?.streamUrl === station.streamUrl && playing ? 'secondary' : 'primary'}
              className='w-full'
            >
              {current?.streamUrl === station.streamUrl && playing ? 'إيقاف' : 'استماع الآن'}
            </Button>
          </Card>
        ))}
      </section>

      {filteredStations.length === 0 && (
        <Card className='p-8 text-center'>
          <h2 className='text-xl font-bold text-brand-gold'>لم نجد محطة مطابقة</h2>
          <p className='mt-2 arabic-muted'>جرّب اسم قارئ آخر أو أعد الفلتر إلى كل الإذاعات.</p>
        </Card>
      )}

      <Card className='border-brand-gold/10 bg-black/10 p-5'>
        <h2 className='text-lg font-bold text-brand-gold'>ملاحظات حول البث</h2>
        <p className='mt-2 text-sm leading-7 arabic-muted'>
          الإذاعات تعتمد على بثوث خارجية. قد تتوقف محطة مؤقتًا أو يتغير عنوانها دون أن يكون ذلك عطلًا في المنصة.
          عند تعذر محطة، اختر محطة أخرى من الكتالوج.
        </p>
      </Card>
    </Container>
  );
}
