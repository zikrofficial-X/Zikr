'use client';

import { useRef, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Station = {
  name: string;
  url: string;
  description: string;
};

const stations: Station[] = [
  {
    name: 'إذاعة القرآن الكريم - السعودية',
    url: 'https://qurango.net/radio/tarateel',
    description: 'تلاوات خاشعة من القرآن الكريم',
  },
  {
    name: 'إذاعة القرآن الكريم - مصر',
    url: 'https://qurango.net/radio/mishary_alafasy',
    description: 'تلاوات الشيخ مشاري العفاسي',
  },
  {
    name: 'إذاعة القرآن - المنشاوي',
    url: 'https://qurango.net/radio/minshawi',
    description: 'تلاوات الشيخ محمد صديق المنشاوي',
  },
  {
    name: 'إذاعة القرآن - عبد الباسط',
    url: 'https://qurango.net/radio/abdulbasit',
    description: 'تلاوات الشيخ عبد الباسط عبد الصمد',
  },
  {
    name: 'إذاعة القرآن - الحصري',
    url: 'https://qurango.net/radio/husary',
    description: 'تلاوات الشيخ محمود خليل الحصري',
  },
  {
    name: 'إذاعة القرآن - السديس',
    url: 'https://qurango.net/radio/sudais',
    description: 'تلاوات الشيخ عبد الرحمن السديس',
  },
  {
    name: 'إذاعة تلاوات خاشعة',
    url: 'https://qurango.net/radio/maher_al_muaiqly',
    description: 'تلاوات الشيخ ماهر المعيقلي',
  },
  {
    name: 'إذاعة القرآن - سعد الغامدي',
    url: 'https://qurango.net/radio/saad_al_ghamdi',
    description: 'تلاوات الشيخ سعد الغامدي',
  },
];

export default function RadioPage() {
  const [current, setCurrent] = useState<Station | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playStation = (station: Station) => {
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(station.url);
    audio.volume = volume;
    audioRef.current = audio;
    audio
      .play()
      .then(() => {
        setCurrent(station);
        setPlaying(true);
      })
      .catch(() => {
        setError('تعذر تشغيل المحطة. قد تكون البث متوقف مؤقتاً.');
        setPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!audioRef.current || !current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setError('تعذر استئناف التشغيل'));
    }
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <Container className='space-y-8 py-10 text-right'>
      <section className='space-y-3'>
        <h1 className='text-3xl font-bold text-brand-gold'>إذاعة القرآن الكريم</h1>
        <p className='max-w-3xl leading-8 arabic-muted'>
          استمع لبث مباشر لتلاوات القرآن الكريم من أشهر القراء على مدار الساعة.
        </p>
      </section>

      {current && (
        <Card className='flex flex-col items-center gap-4 py-6'>
          <div className='flex items-center gap-4'>
            <button
              onClick={togglePlay}
              className='flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold text-2xl text-brand-emeraldDeep transition-transform hover:scale-105'
            >
              {playing ? '⏸' : '▶'}
            </button>
            <div>
              <p className='text-lg text-brand-gold'>{current.name}</p>
              <p className='text-sm arabic-muted'>{current.description}</p>
            </div>
          </div>
          <div className='flex w-full max-w-md items-center gap-3'>
            <span className='text-sm arabic-muted'>🔊</span>
            <input
              type='range'
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className='flex-1 accent-brand-gold'
            />
          </div>
          {error && <p className='text-sm text-red-300'>{error}</p>}
        </Card>
      )}

      <section className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {stations.map((station) => (
          <Card key={station.url} className='space-y-3'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <h2 className='text-lg text-brand-gold'>{station.name}</h2>
                <p className='text-sm leading-6 arabic-muted'>{station.description}</p>
              </div>
              {current?.url === station.url && playing && (
                <span className='flex items-center gap-1 text-xs text-emerald-300'>
                  <span className='h-2 w-2 animate-pulse rounded-full bg-emerald-400' />
                  مباشر
                </span>
              )}
            </div>
            <Button
              onClick={() => playStation(station)}
              variant={current?.url === station.url && playing ? 'secondary' : 'primary'}
              className='w-full'
            >
              {current?.url === station.url && playing ? 'إيقاف' : 'استماع'}
            </Button>
          </Card>
        ))}
      </section>
    </Container>
  );
}
