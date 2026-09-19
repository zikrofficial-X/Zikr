'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convertTo12Hour, getPrayerTimes, getPrayerTimesByCity } from '@/features/prayer/services/prayer-times';
import type { PrayerTimes } from '@/lib/types/prayer';
import { resolveLocationLabel } from '@/lib/location/reverse-geocode';

type Locale = 'ar' | 'en';
type Props = { locale: Locale; showPrayerTimes?: boolean };

const DEFAULT_CITY = 'Cairo';
const prayerNames = [
  { key: 'Fajr', ar: 'الفجر', en: 'Fajr' },
  { key: 'Sunrise', ar: 'الشروق', en: 'Sunrise' },
  { key: 'Dhuhr', ar: 'الظهر', en: 'Dhuhr' },
  { key: 'Asr', ar: 'العصر', en: 'Asr' },
  { key: 'Maghrib', ar: 'المغرب', en: 'Maghrib' },
  { key: 'Isha', ar: 'العشاء', en: 'Isha' },
] as const;
type PrayerKey = (typeof prayerNames)[number]['key'];
type MainPrayerKey = Exclude<PrayerKey, 'Sunrise'>;

function toMinutes(value: string): number {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function getPrayerState(
  timings: PrayerTimes,
  now: Date,
): { active: MainPrayerKey | null; next: MainPrayerKey } {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const keys: MainPrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  let active: MainPrayerKey | null = null;
  for (let index = keys.length - 1; index >= 0; index -= 1) {
    if (currentMinutes >= toMinutes(timings[keys[index]])) {
      active = keys[index];
      break;
    }
  }

  const activeIndex = active === null ? -1 : keys.indexOf(active);
  return {
    active,
    next: keys[(activeIndex + 1) % keys.length],
  };
}

function Clock({ locale }: { locale: Locale }) {
  // Start as null so the server and the initial client render both emit the
  // same placeholder; the real (locale/timezone-dependent) time is only
  // rendered after mount to avoid a server/client hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '--:--:--';
  const date = now
    ? now.toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="mt-4 flex min-h-[68px] flex-col items-center gap-1.5 pt-1" aria-live="polite">
      <div className="inline-flex items-center gap-3 rounded-full border border-brand-gold/20 bg-black/25 px-5 py-2.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-gold" aria-hidden="true" />
        <time className="font-mono text-2xl font-bold tracking-wider text-brand-gold tabular-nums">{time}</time>
      </div>
      <span className="text-xs text-brand-cream/45" dir={locale === 'en' ? 'ltr' : 'rtl'}>
        {date}
      </span>
    </div>
  );
}

function PrayerTimesPanel({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerCity, setPrayerCity] = useState(DEFAULT_CITY);
  const [cityInput, setCityInput] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const isEnglish = locale === 'en';

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const loadCity = useCallback(async (city: string) => {
    setLoading(true);
    try {
      const cacheKey = `zikr:prayer:${city.toLowerCase()}`;
      const cached = window.sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { at: number; timings: PrayerTimes };
          if (Date.now() - parsed.at < 10 * 60 * 1000) {
            setPrayerTimes(parsed.timings);
            return;
          }
        } catch {
          window.sessionStorage.removeItem(cacheKey);
        }
      }

      const response = await getPrayerTimesByCity(city, 'Egypt');
      if (!response?.data?.timings) return;

      const timings = response.data.timings as PrayerTimes;
      setPrayerTimes(timings);
      window.sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ at: Date.now(), timings }),
      );
    } catch {
      // Keep the current UI usable when the prayer service is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (window.requestIdleCallback) {
      const handle = window.requestIdleCallback(
        () => void loadCity(DEFAULT_CITY),
        { timeout: 1800 },
      );
      return () => window.cancelIdleCallback?.(handle);
    }

    const timer = window.setTimeout(() => void loadCity(DEFAULT_CITY), 500);
    return () => window.clearTimeout(timer);
  }, [loadCity, visible]);

  const chooseLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const response = await getPrayerTimes(latitude, longitude);
          if (response?.data?.timings) {
            setPrayerTimes(response.data.timings as PrayerTimes);
          }

          const label = await resolveLocationLabel(latitude, longitude);
          setPrayerCity(label ?? (isEnglish ? 'Current location' : 'موقعك الحالي'));
        } catch {
          // Preserve the existing prayer times on lookup failure.
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false),
      { timeout: 6000, maximumAge: 300000 },
    );
  }, [isEnglish]);

  const submitCity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const city = cityInput.trim();
    if (!city) return;

    setPrayerCity(city);
    setCityInput('');
    void loadCity(city);
  };

  const prayerState = prayerTimes
    ? getPrayerState(prayerTimes, now)
    : { active: null as MainPrayerKey | null, next: 'Fajr' as MainPrayerKey };

  return (
    <section
      ref={sectionRef}
      className="mt-8 border-t border-brand-gold/10 pt-8 text-left"
      aria-labelledby="prayer-times-heading"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div dir={isEnglish ? 'ltr' : 'rtl'}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/45">
              {isEnglish ? 'Prayer Times' : 'مواقيت الصلاة'}
            </p>
            <h2 id="prayer-times-heading" className="text-2xl font-bold text-brand-gold">
              {isEnglish ? "Today's Prayer Times" : 'أوقات الصلاة اليوم'}
            </h2>
            <p className="mt-1 text-sm text-brand-cream/40">
              {prayerCity} · {loading ? (isEnglish ? 'Updating…' : 'جاري التحديث…') : isEnglish ? 'Cached for this visit' : 'محفوظة لهذه الزيارة'}
            </p>
          </div>

          <form
            onSubmit={submitCity}
            className="flex w-full gap-2 sm:w-auto"
            dir={isEnglish ? 'ltr' : 'rtl'}
          >
            <input
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder={isEnglish ? 'City name' : 'اسم المدينة'}
              aria-label={isEnglish ? 'City name' : 'اسم المدينة'}
              className="min-w-0 flex-1 rounded-xl border border-brand-gold/15 bg-black/20 px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-gold/45 sm:w-36 sm:flex-none"
            />
            <button
              type="submit"
              className="rounded-xl border border-brand-gold/25 px-4 py-2 text-sm font-semibold text-brand-gold"
            >
              {isEnglish ? 'Change' : 'تغيير'}
            </button>
            <button
              type="button"
              onClick={chooseLocation}
              className="rounded-xl border border-brand-gold/15 px-3 py-2 text-sm text-brand-cream/60"
            >
              {isEnglish ? 'My location' : 'موقعي'}
            </button>
          </form>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 md:grid-cols-6 md:gap-3">
          {prayerNames.map(({ key, ar, en }) => {
            const active = prayerState.active === key;
            const next = prayerState.next === key;
            const value = prayerTimes?.[key]
              ? convertTo12Hour(prayerTimes[key], !isEnglish)
              : '--:--';

            return (
              <div
                key={key}
                className={`min-h-[90px] rounded-2xl border p-3 text-center ${
                  active
                    ? 'border-brand-gold/60 bg-brand-gold/10'
                    : next
                      ? 'border-brand-gold/30 bg-brand-gold/5'
                      : 'border-brand-gold/10 bg-black/15'
                }`}
              >
                <p className="text-xs text-brand-gold/60" dir={isEnglish ? 'ltr' : 'rtl'}>
                  {isEnglish ? en : ar}
                </p>
                <p className="mt-2 text-lg font-bold text-brand-cream tabular-nums">{value}</p>
                {active && (
                  <span className="mt-1 inline-block rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold text-brand-gold">
                    {isEnglish ? 'Now' : 'الآن'}
                  </span>
                )}
                {!active && next && (
                  <span className="mt-1 inline-block text-[10px] font-semibold text-brand-gold/45">
                    {isEnglish ? 'Next' : 'التالية'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeInteractive({ locale, showPrayerTimes = true }: Props) {
  return (
    <>
      <Clock locale={locale} />
      {showPrayerTimes && <PrayerTimesPanel locale={locale} />}
    </>
  );
}
