'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Sunrise, Sun, Cloud, Sunset, Moon, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { getPrayerTimes, getPrayerTimesByCity, getNextPrayer, getCurrentPrayer, getPrayerNameAr, formatPrayerTime } from '@/lib/services/prayer-times';
import type { PrayerTimesResponse } from '@/lib/services/prayer-times';
import { unlockAudioContext, isAudioUnlocked } from '@/lib/audio/spiritual-tones';
import { usePrayerAlert, PRAYER_NAMES_AR } from '@/hooks/use-prayer-alert';
import { resolveLocationLabel } from '@/lib/location/reverse-geocode';

// Cairo fallback coords (used when geo is denied or unavailable)
const CAIRO = { lat: 30.0444, lon: 31.2357, city: 'القاهرة (افتراضي)' };

export default function PrayerTimesPage() {
  const [prayerData, setPrayerData] = useState<PrayerTimesResponse | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // isFetching is true during any fetch (including refreshes); loading is only
  // true on the very first fetch before we have data to display.
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrentTime] = useState<Date>(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; minutesUntil: number } | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<{ name: string; time: string } | null>(null);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { settings: azanSettings, togglePrayer } = usePrayerAlert();

  const handleUnlockAudio = () => {
    unlockAudioContext();
    setAudioUnlocked(isAudioUnlocked());
  };

  const loadForCoords = useCallback(async (lat: number, lon: number, city: string) => {
    setCurrentLocation({ lat, lon, city });
    setIsFetching(true);
    try {
      const data = await getPrayerTimes(lat, lon);
      if (data) {
        setPrayerData(data);
        setError(null);
        try {
          localStorage.setItem(
            'zikr_prayer_location',
            JSON.stringify({
              lat,
              lon,
              city,
              timings: data.data.timings,
              date: data.data.date,
              cachedAt: Date.now(),
            }),
          );
          window.dispatchEvent(new Event('zikr:prayer-location-updated'));
        } catch {
          // Offline cache can be unavailable in private browsing contexts.
        }
      } else {
        setError('فشل في جلب مواقيت الصلاة');
      }
    } catch {
      setError('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Request geolocation — falls back to Cairo on denial
  const requestLocation = useCallback(async () => {
    setIsFetching(true);
    if (!prayerData) setLoading(true);
    setError(null);

    if (!('geolocation' in navigator)) {
      await loadForCoords(CAIRO.lat, CAIRO.lon, CAIRO.city);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await resolveLocationLabel(latitude, longitude);
        await loadForCoords(latitude, longitude, city ?? 'موقعك الحالي');
      },
      async () => {
        // Geo denied — silently fall back to Cairo
        await loadForCoords(CAIRO.lat, CAIRO.lon, CAIRO.city);
      },
      { timeout: 8000 }
    );
  }, [loadForCoords]);

  // Fetch prayer times by city
  const fetchByCity = useCallback(async (city: string) => {
    setIsFetching(true);
    if (!prayerData) setLoading(true);
    setError(null);

    try {
      const data = await getPrayerTimesByCity(city);
      if (data) {
        setPrayerData(data);
        setCurrentLocation({ lat: data.data.meta.latitude, lon: data.data.meta.longitude, city });
        try {
          localStorage.setItem(
            'zikr_prayer_location',
            JSON.stringify({
              lat: data.data.meta.latitude,
              lon: data.data.meta.longitude,
              city,
              timings: data.data.timings,
              date: data.data.date,
              cachedAt: Date.now(),
            }),
          );
          window.dispatchEvent(new Event('zikr:prayer-location-updated'));
        } catch {
          // Offline cache can be unavailable in private browsing contexts.
        }
      } else {
        setError('لم يتم العثور على المدينة');
      }
    } catch {
      setError('حدث خطأ في البحث');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [prayerData]);

  // Update current time and next prayer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (prayerData?.data?.timings) {
        setNextPrayer(getNextPrayer(prayerData.data.timings, now));
        setCurrentPrayer(getCurrentPrayer(prayerData.data.timings, now));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerData]);

  // Restore the last successful schedule immediately, then refresh it online.
  useEffect(() => {
    try {
      const cached = localStorage.getItem('zikr_prayer_location');
      if (cached) {
        const parsed = JSON.parse(cached) as {
          lat: number;
          lon: number;
          city: string;
          timings: PrayerTimesResponse['data']['timings'];
          date: PrayerTimesResponse['data']['date'];
        };
        if (parsed.timings && parsed.date) {
          setPrayerData({
            code: 200,
            status: 'OK',
            data: {
              timings: parsed.timings,
              date: parsed.date,
              meta: {
                latitude: parsed.lat,
                longitude: parsed.lon,
                timezone: '',
                method: { id: 4, name: 'Cached', params: {} },
                latitudeAdjustmentMethod: '',
                midnightMethod: '',
                school: '',
                offset: {},
              },
            },
          });
          setCurrentLocation({ lat: parsed.lat, lon: parsed.lon, city: parsed.city });
          setLoading(false);
        }
      }
    } catch {
      // Ignore malformed or unavailable offline cache.
    }

    // Always fetch after attempting cache restoration. Previously, an empty
    // cache returned from the effect before this call and left first-time
    // visitors in the loading state forever.
    void requestLocation();
  }, [requestLocation]);

  const timings = prayerData?.data?.timings;
  const meta = prayerData?.data?.meta;
  const date = prayerData?.data?.date;

  const prayersList: Array<{ name: string; nameAr: string; time: string; icon: LucideIcon }> = timings ? [
    { name: 'Fajr', nameAr: 'الفجر', time: timings.Fajr, icon: Sunrise },
    { name: 'Dhuhr', nameAr: 'الظهر', time: timings.Dhuhr, icon: Sun },
    { name: 'Asr', nameAr: 'العصر', time: timings.Asr, icon: Cloud },
    { name: 'Maghrib', nameAr: 'المغرب', time: timings.Maghrib, icon: Sunset },
    { name: 'Isha', nameAr: 'العشاء', time: timings.Isha, icon: Moon },
  ] : [];

  return (
    <Container className="py-12 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">مواقيت الصلاة</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          احصل على مواقيت الصلاة الدقيقة لموقعك
        </p>
        {currentLocation && (
          <div className="text-lg text-brand-cream">{currentLocation.city}</div>
        )}

        {/* Azan quick controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant={audioUnlocked ? 'ghost' : 'secondary'}
            onClick={handleUnlockAudio}
            className="text-sm"
          >
            {audioUnlocked ? 'الصوت مفعّل' : 'تفعيل صوت الأذان'}
          </Button>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-gold/25 px-4 py-2 text-sm text-brand-cream/70 transition-colors hover:border-brand-gold/50 hover:text-brand-gold"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            إعدادات الأذان
          </Link>
        </div>
      </section>

      {/* Location Controls */}
      <section className="space-y-4">
        <div className="flex gap-4 justify-center flex-wrap">
          <Button onClick={requestLocation} disabled={isFetching}>
            استخدم موقعي الحالي
          </Button>
          <Button onClick={() => setShowCitySearch((v) => !v)} variant="secondary">
            ابحث عن مدينة
          </Button>
        </div>
        {showCitySearch && (
          <form
            className="flex gap-2 justify-center max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              if (cityQuery.trim()) fetchByCity(cityQuery.trim());
            }}
          >
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
              }}
              placeholder="أدخل اسم المدينة، مثال: القاهرة"
              aria-label="اسم المدينة"
              className="flex-1 rounded-lg border border-brand-gold/30 bg-black/30 px-4 py-2 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none"
            />
            <Button type="submit" disabled={isFetching || !cityQuery.trim()}>
              بحث
            </Button>
          </form>
        )}
      </section>

      {/* Error Message (API errors only — geo denial falls back to Cairo silently) */}
      {error && (
        <Card className="border-red-500/30 bg-red-900/10 p-4 text-center space-y-2">
          <p className="text-red-300 text-sm">{error}</p>
          <Button variant="secondary" onClick={requestLocation}>
            إعادة المحاولة
          </Button>
        </Card>
      )}

      {/* Loading State — shown only on first load before any data is available */}
      {loading && !prayerData && (
        <Card className="text-center p-8">
          <p className="text-brand-cream/60">جاري تحميل مواقيت الصلاة...</p>
        </Card>
      )}

      {/* Refresh indicator — shown when updating data that already exists */}
      {isFetching && prayerData && (
        <p className="text-center text-xs text-brand-cream/40 animate-pulse">
          جاري تحديث المواقيت...
        </p>
      )}

      {/* Prayer Times Display — stays visible during refresh */}
      {prayerData && (
        <>
          {/* Current Prayer Status */}
          {nextPrayer && (
            <Card className="bg-gradient-to-r from-brand-gold/10 to-brand-emerald/10 border-brand-gold/50 p-6 text-center space-y-3">
              <h2 className="text-2xl font-bold text-brand-gold">
                {currentPrayer ? `الصلاة الحالية: ${getPrayerNameAr(currentPrayer.name)}` : 'الصلاة القادمة'}
              </h2>
              <p className="text-3xl font-bold text-brand-cream">
                {getPrayerNameAr(nextPrayer.name)} - {formatPrayerTime(nextPrayer.time)}
              </p>
              <p className="text-lg text-brand-cream/70">
                بعد {Math.floor(nextPrayer.minutesUntil / 60)} ساعة و {nextPrayer.minutesUntil % 60} دقيقة
              </p>
            </Card>
          )}

          {/* Prayer Times Grid */}
          <section className="space-y-6">
            <SectionHeader 
              title="الصلوات الخمس" 
              subtitle={`${date?.hijri.day} ${date?.hijri.month.ar} ${date?.hijri.year} هـ`}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {prayersList.map((prayer) => (
                <Card 
                  key={prayer.name}
                  className={`text-center space-y-3 transition-all ${
                    currentPrayer?.name === prayer.name 
                      ? 'border-brand-gold bg-brand-gold/10' 
                      : nextPrayer?.name === prayer.name
                      ? 'border-brand-gold/50 bg-brand-emerald/5'
                      : 'hover:border-brand-gold/30'
                  }`}
                >
                  <prayer.icon className="h-8 w-8 text-brand-gold/80 mx-auto" />
                  <h3 className="text-xl font-bold text-brand-gold">{prayer.nameAr}</h3>
                  <p className="text-sm text-brand-cream/60">{prayer.name}</p>
                  <Badge variant="secondary" className="justify-center">
                    {formatPrayerTime(prayer.time)}
                  </Badge>
                  {/* Azan enabled/disabled chip */}
                  <button
                    onClick={() => togglePrayer(prayer.name as import('@/hooks/use-prayer-alert').PrayerKey)}
                    className={`mx-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                      azanSettings.enabledPrayers[prayer.name as import('@/hooks/use-prayer-alert').PrayerKey]
                        ? 'bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25'
                        : 'bg-brand-cream/5 text-brand-cream/30 hover:bg-brand-cream/10'
                    }`}
                    aria-label={`${azanSettings.enabledPrayers[prayer.name as import('@/hooks/use-prayer-alert').PrayerKey] ? 'تع��يل' : 'تفعيل'} أذان ${PRAYER_NAMES_AR[prayer.name as import('@/hooks/use-prayer-alert').PrayerKey]}`}
                  >
                    <span>{azanSettings.enabledPrayers[prayer.name as import('@/hooks/use-prayer-alert').PrayerKey] ? 'الأذان مفعّل' : 'الأذان معطّل'}</span>
                  </button>
                </Card>
              ))}
            </div>
          </section>

          {/* Additional Times */}
          {timings && (
          <section className="space-y-6">
            <SectionHeader title="أوقات إضافية" />

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="text-center space-y-2">
                <p className="text-brand-gold font-semibold">الإمساك</p>
                <p className="text-2xl font-bold text-brand-cream">{formatPrayerTime(timings.Imsak)}</p>
              </Card>
              <Card className="text-center space-y-2">
                <p className="text-brand-gold font-semibold">الشروق</p>
                <p className="text-2xl font-bold text-brand-cream">{formatPrayerTime(timings.Sunrise)}</p>
              </Card>
              <Card className="text-center space-y-2">
                <p className="text-brand-gold font-semibold">منتصف الليل</p>
                <p className="text-2xl font-bold text-brand-cream">{formatPrayerTime(timings.Midnight)}</p>
              </Card>
            </div>
          </section>
          )}

          {/* Location Info */}
          {meta && (
            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-brand-gold">معلومات الموقع</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-brand-cream/60">الموقع الجغرافي</p>
                  <p className="text-brand-cream">{meta.latitude.toFixed(4)}° N, {meta.longitude.toFixed(4)}° E</p>
                </div>
                <div>
                  <p className="text-sm text-brand-cream/60">المنطقة الزمنية</p>
                  <p className="text-brand-cream">{meta.timezone}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-cream/60">طريقة الحساب</p>
                  <p className="text-brand-cream">{meta.method.name}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-cream/60">مذهب الفقه</p>
                  <p className="text-brand-cream">{meta.school === 'Shafi' ? 'الشافعي' : meta.school}</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Information Section */}
      <section className="space-y-4">
        <SectionHeader title="معلومات مهمة" />
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-2">
            <h3 className="text-lg text-brand-gold">شروط الصلاة</h3>
            <ul className="text-sm leading-7 arabic-muted space-y-1">
              <li>- الإسلام والعقل والتمييز</li>
              <li>- الطهارة من الحدث الأصغر والأكبر</li>
              <li>- طهارة البدن والثوب والمكان</li>
              <li>- ستر العورة</li>
              <li>- دخول الوقت</li>
              <li>- استقبال القبلة</li>
              <li>- النية</li>
            </ul>
          </Card>

          <Card className="space-y-2">
            <h3 className="text-lg text-brand-gold">نصائح مهمة</h3>
            <ul className="text-sm leading-7 arabic-muted space-y-1">
              <li>- تحقق من دقة موقعك الجغرافي</li>
              <li>- استخدم طريقة حساب معتمدة</li>
              <li>- أضف وقت تنبيه قبل الصلاة</li>
              <li>- حافظ على مواقيت الصلاة</li>
              <li>- لا تؤخر الصلاة عن وقتها</li>
            </ul>
          </Card>
        </div>
      </section>
    </Container>
  );
}
