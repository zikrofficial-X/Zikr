'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Well-known cities for quick selection
const CITIES = [
  { nameAr: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  { nameAr: 'دبي', lat: 25.2048, lng: 55.2708 },
  { nameAr: 'الرياض', lat: 24.7136, lng: 46.6753 },
  { nameAr: 'إسطنبول', lat: 41.0082, lng: 28.9784 },
  { nameAr: 'لندن', lat: 51.5074, lng: -0.1278 },
  { nameAr: 'نيويورك', lat: 40.7128, lng: -74.006 },
  { nameAr: 'كوالالمبور', lat: 3.139, lng: 101.6869 },
  { nameAr: 'جاكرتا', lat: -6.2088, lng: 106.8456 },
];

function calculateQiblaDirection(lat: number, lng: number): number {
  const phiK = (KAABA_LAT * Math.PI) / 180;
  const lambdaK = (KAABA_LNG * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  const y = Math.sin(lambdaK - lambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function calculateDistance(lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((KAABA_LAT * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function QiblaPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const requestLocation = () => {
    setPermission('requesting');
    setError(null);
    if (!navigator.geolocation) {
      setPermission('denied');
      setError('المتصفح لا يدعم تحديد الموقع. أدخل إحداثياتك يدوياً.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'موقعك الحالي' });
        setAccuracy(Math.round(pos.coords.accuracy));
        setPermission('granted');
        setError(null);
      },
      (err) => {
        const msg =
          err.code === 1
            ? 'تم رفض إذن الموقع. يمكنك اختيار مدينة أو إدخال الإحداثيات يدوياً.'
            : 'تعذر تحديد الموقع. حاول مرة أخرى أو أدخل الإحداثيات يدوياً.';
        setError(msg);
        setPermission('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    setWatchId(id);
  };

  const applyManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('أدخل إحداثيات صحيحة: خط العرض بين -90 و 90، خط الطول بين -180 و 180.');
      return;
    }
    setCoords({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    setError(null);
    setAccuracy(null);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  useEffect(() => {
    if (!coords) return;
    const handler = (e: DeviceOrientationEvent) => {
      const h = e.alpha != null ? 360 - e.alpha : null;
      if (h != null) setHeading(h);
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [coords]);

  const qiblaDirection = coords ? calculateQiblaDirection(coords.lat, coords.lng) : null;
  const distance = coords ? calculateDistance(coords.lat, coords.lng) : null;
  const compassRotation =
    heading != null && qiblaDirection != null ? qiblaDirection - heading : qiblaDirection;

  return (
    <Container className="space-y-8 py-10 text-right">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-brand-gold">اتجاه القبلة</h1>
        <p className="max-w-3xl leading-8 arabic-muted">
          حدد موقعك لمعرفة اتجاه القبلة بدقة. استخدم البوصلة وقم بتوجيه هاتفك نحو السهم.
        </p>
      </section>

      {/* Location Controls */}
      {!coords && (
        <Card className="space-y-6">
          {/* Geolocation button */}
          <div className="flex flex-col items-center gap-3 py-4">
            <Button
              onClick={requestLocation}
              disabled={permission === 'requesting'}
            >
              {permission === 'requesting' ? 'جارٍ تحديد الموقع...' : 'تحديد موقعي تلقائياً'}
            </Button>
            {error && (
              <p className="text-sm text-yellow-300 text-center max-w-sm">{error}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-gold/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs arabic-muted">أو اختر مدينة</span>
            </div>
          </div>

          {/* Quick city buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {CITIES.map((city) => (
              <button
                key={city.nameAr}
                onClick={() => setCoords({ lat: city.lat, lng: city.lng, label: city.nameAr })}
                className="rounded-full border border-brand-gold/30 px-3 py-1 text-sm text-brand-cream/80 hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                {city.nameAr}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-gold/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs arabic-muted">أو أدخل الإحداثيات يدوياً</span>
            </div>
          </div>

          {/* Manual coordinates */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs arabic-muted mb-1">خط العرض (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="مثال: 30.0444"
                  dir="ltr"
                  className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-2 text-brand-cream text-sm placeholder:text-brand-cream/30 focus:border-brand-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs arabic-muted mb-1">خط الطول (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="مثال: 31.2357"
                  dir="ltr"
                  className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-2 text-brand-cream text-sm placeholder:text-brand-cream/30 focus:border-brand-gold focus:outline-none"
                />
              </div>
            </div>
            <Button
              onClick={applyManualCoords}
              variant="secondary"
              className="w-full"
              disabled={!manualLat || !manualLng}
            >
              احسب اتجاه القبلة
            </Button>
          </div>
        </Card>
      )}

      {/* Compass + Info */}
      {coords && qiblaDirection != null && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Compass */}
          <Card className="flex flex-col items-center gap-6 py-10">
            <p className="text-sm arabic-muted">{coords.label}</p>
            <div className="relative h-64 w-64">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-brand-gold/30" />
              {/* Cardinal directions */}
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-brand-gold font-bold" aria-hidden="true">N</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs arabic-muted" aria-hidden="true">S</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs arabic-muted" aria-hidden="true">W</span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs arabic-muted" aria-hidden="true">E</span>
              {/* Qibla arrow */}
              <div
                className="absolute left-1/2 top-1/2 w-1 h-28 origin-bottom rounded-full transition-transform duration-300"
                style={{
                  transform: `translate(-50%, -100%) rotate(${compassRotation ?? 0}deg)`,
                  background: 'linear-gradient(to top, transparent, #d4af37)',
                }}
                aria-label={`اتجاه القبلة ${Math.round(qiblaDirection)}°`}
              >
                {/* Kaaba icon at tip */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="absolute -top-5 -left-2.5 w-6 h-6 text-brand-gold"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="3" y="8" width="18" height="13" rx="1" />
                  <path d="M3 8h18l-2-5H5L3 8z" opacity="0.7" />
                  <rect x="9" y="14" width="6" height="7" fill="rgba(0,0,0,0.4)" />
                </svg>
              </div>
              {/* Center dot */}
              <div className="absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold" />
            </div>
            <p className="text-lg text-brand-gold">
              {Math.round(qiblaDirection)}° من الشمال
            </p>
            {heading != null ? (
              <p className="text-sm arabic-muted">اتجاه الهاتف: {Math.round(heading)}°</p>
            ) : (
              <p className="text-sm arabic-muted text-center max-w-xs">
                حرّك هاتفك لتفعيل البوصلة (يتطلب إذن أداة الاستشعار)
              </p>
            )}
          </Card>

          {/* Info */}
          <Card className="space-y-4 py-8">
            <h2 className="text-xl text-brand-gold">معلومات الموقع</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-brand-gold/10 pb-2">
                <span className="arabic-muted">خط العرض</span>
                <span dir="ltr">{coords.lat.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between border-b border-brand-gold/10 pb-2">
                <span className="arabic-muted">خط الطول</span>
                <span dir="ltr">{coords.lng.toFixed(4)}°</span>
              </div>
              {accuracy !== null && (
                <div className="flex justify-between border-b border-brand-gold/10 pb-2">
                  <span className="arabic-muted">دقة الموقع</span>
                  <span
                    className={
                      accuracy < 50
                        ? 'text-green-400'
                        : accuracy < 100
                        ? 'text-yellow-400'
                        : 'text-orange-400'
                    }
                  >
                    ±{accuracy} م
                  </span>
                </div>
              )}
              {distance != null && (
                <div className="flex justify-between border-b border-brand-gold/10 pb-2">
                  <span className="arabic-muted">المسافة إلى الكعبة</span>
                  <span>{distance.toLocaleString('ar-EG')} كم</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="arabic-muted">اتجاه القبلة</span>
                <span className="text-brand-gold">{Math.round(qiblaDirection)}° من الشمال</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setCoords(null);
                  setHeading(null);
                  setPermission('idle');
                  setError(null);
                  setAccuracy(null);
                }}
              >
                تغيير الموقع
              </Button>
              {permission !== 'granted' && (
                <Button variant="ghost" className="flex-1" onClick={requestLocation}>
                  استخدم GPS
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
