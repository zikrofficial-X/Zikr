import { safeApiFetch } from '@/lib/services/http';
import { ServiceError } from '@/lib/types/common';

// Use local API proxy to avoid CORS and crawl issues
const API_BASE = '/api/prayer-times';
const CACHE_TTL_MS = 60_000;

const prayerTimesCache = new Map<string, { expiresAt: number; data: PrayerTimesResponse | null }>();
const prayerTimesInFlight = new Map<string, Promise<PrayerTimesResponse | null>>();

export interface PrayerTime {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface PrayerTimesResponse {
  code: number;
  status: string;
  data: {
    timings: PrayerTime;
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: { en: string; ar: string };
        month: { number: number; en: string; ar: string };
        year: string;
      };
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: { en: string; ar: string };
        month: { number: number; en: string; ar: string };
        year: string;
        designation: { abbreviated: string; expanded: string };
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: { id: number; name: string; params: Record<string, unknown> };
      latitudeAdjustmentMethod: string;
      midnightMethod: string;
      school: string;
      offset: Record<string, number>;
    };
  };
}

export interface CityCoordinates {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

function buildPrayerCacheKey(
  latitude: number,
  longitude: number,
  date: string | undefined,
  method: number,
): string {
  return [latitude.toFixed(6), longitude.toFixed(6), date ?? 'today', method].join('|');
}

async function fetchPrayerTimesUncached(
  latitude: number,
  longitude: number,
  date: string | undefined,
  method: number,
): Promise<PrayerTimesResponse | null> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    method: method.toString(),
  });

  if (date) params.append('date', date);

  const { data } = await safeApiFetch<PrayerTimesResponse>(`${API_BASE}?${params.toString()}`);
  return data || null;
}

/**
 * Fetch prayer times for a specific date and location
 */
export async function getPrayerTimes(
  latitude: number,
  longitude: number,
  date?: string,
  method: number = 4,
): Promise<PrayerTimesResponse | null> {
  const cacheKey = buildPrayerCacheKey(latitude, longitude, date, method);
  const now = Date.now();
  const cached = prayerTimesCache.get(cacheKey);

  if (cached && cached.expiresAt > now) return cached.data;

  const existingRequest = prayerTimesInFlight.get(cacheKey);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    try {
      const data = await fetchPrayerTimesUncached(latitude, longitude, date, method);
      prayerTimesCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    } catch (error) {
      console.error('[prayer-times] Failed to fetch prayer times:', error);
      if (error instanceof ServiceError) return null;
      throw error;
    } finally {
      prayerTimesInFlight.delete(cacheKey);
    }
  })();

  prayerTimesInFlight.set(cacheKey, request);
  return request;
}

/**
 * Fetch prayer times by city name
 */
export async function getPrayerTimesByCity(
  city: string,
  country?: string,
  date?: string,
  method: number = 4,
): Promise<PrayerTimesResponse | null> {
  const cleanCity = city.trim();
  if (!cleanCity) return null;

  const cacheKey = [
    'city',
    cleanCity.toLowerCase(),
    country?.trim().toLowerCase() ?? '',
    date ?? 'today',
    method,
  ].join('|');
  const now = Date.now();
  const cached = prayerTimesCache.get(cacheKey);

  if (cached && cached.expiresAt > now) return cached.data;

  const existingRequest = prayerTimesInFlight.get(cacheKey);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    try {
      const params = new URLSearchParams({ method: method.toString() });
      if (date) params.append('date', date);

      if (country?.trim()) {
        params.append('city', cleanCity);
        params.append('country', country.trim());
      } else {
        params.append('address', cleanCity);
      }

      const { data } = await safeApiFetch<PrayerTimesResponse>(`${API_BASE}?${params.toString()}`);
      const result = data || null;
      prayerTimesCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch (error) {
      console.error('[prayer-times] Failed to fetch prayer times by city:', error);
      if (error instanceof ServiceError) return null;
      throw error;
    } finally {
      prayerTimesInFlight.delete(cacheKey);
    }
  })();

  prayerTimesInFlight.set(cacheKey, request);
  return request;
}

/**
 * Get next prayer time from the current time
 */
export function getNextPrayer(
  timings: PrayerTime,
  currentTime: Date = new Date(),
): { name: string; time: string; minutesUntil: number } | null {
  const prayers = [
    { name: 'Fajr', time: timings.Fajr },
    { name: 'Sunrise', time: timings.Sunrise },
    { name: 'Dhuhr', time: timings.Dhuhr },
    { name: 'Asr', time: timings.Asr },
    { name: 'Sunset', time: timings.Sunset },
    { name: 'Maghrib', time: timings.Maghrib },
    { name: 'Isha', time: timings.Isha },
  ];

  const now = currentTime.getHours() * 60 + currentTime.getMinutes();

  for (const prayer of prayers) {
    const prayerMinutes = parsePrayerTimeMinutes(prayer.time);
    if (prayerMinutes === null) continue;
    if (prayerMinutes > now) {
      return { name: prayer.name, time: prayer.time, minutesUntil: prayerMinutes - now };
    }
  }

  const fajrTotalMinutes = parsePrayerTimeMinutes(timings.Fajr);
  if (fajrTotalMinutes === null) return null;
  return {
    name: 'Fajr',
    time: timings.Fajr,
    minutesUntil: 24 * 60 - now + fajrTotalMinutes,
  };
}

/**
 * Get current prayer time
 */
export function getCurrentPrayer(
  timings: PrayerTime,
  currentTime: Date = new Date(),
): { name: string; time: string } | null {
  const prayers = [
    { name: 'Fajr', time: timings.Fajr },
    { name: 'Dhuhr', time: timings.Dhuhr },
    { name: 'Asr', time: timings.Asr },
    { name: 'Maghrib', time: timings.Maghrib },
    { name: 'Isha', time: timings.Isha },
  ];

  const now = currentTime.getHours() * 60 + currentTime.getMinutes();

  for (let i = prayers.length - 1; i >= 0; i--) {
    const prayerMinutes = parsePrayerTimeMinutes(prayers[i].time);
    if (prayerMinutes === null) continue;
    if (prayerMinutes <= now) return prayers[i];
  }
  return null;
}

export const getPrayerTimesByCoordinates = getPrayerTimes;

export function parsePrayerTimeMinutes(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatPrayerTime(timeStr: string): string {
  const minutesAfterMidnight = parsePrayerTimeMinutes(timeStr);
  if (minutesAfterMidnight === null) return timeStr;
  const hours = Math.floor(minutesAfterMidnight / 60).toString().padStart(2, '0');
  const minutes = (minutesAfterMidnight % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function convertTo12Hour(timeStr: string, ar: boolean = true): string {
  const minutesAfterMidnight = parsePrayerTimeMinutes(timeStr);
  if (minutesAfterMidnight === null) return timeStr;
  let hours = Math.floor(minutesAfterMidnight / 60);
  const minutes = (minutesAfterMidnight % 60).toString().padStart(2, '0');
  const isPM = hours >= 12;
  hours = hours % 12 || 12;
  const suffix = ar ? (isPM ? 'م' : 'ص') : isPM ? 'PM' : 'AM';
  return `${hours}:${minutes} ${suffix}`;
}

export function getPrayerNameAr(englishName: string): string {
  const names: Record<string, string> = {
    Fajr: 'الفجر',
    Sunrise: 'الشروق',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Sunset: 'الغروب',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
    Imsak: 'الإمساك',
    Midnight: 'منتصف الليل',
  };
  return names[englishName] || englishName;
}

export const CALCULATION_METHODS = {
  1: 'Jafari',
  2: 'Karachi',
  3: 'ISNA',
  4: 'Umm Al-Qura',
  5: 'Egyptian General Authority of Survey',
  7: 'Institute of Geophysics, University of Tehran',
  8: 'University of Islamic Sciences, Qom',
  9: 'Shia Ithna Ashari, Qom',
  10: 'Shia Ithna Ashari, Qom (Midnight)',
  11: 'Shia Ithna Ashari, Qom (7a)',
  12: 'Shia Ithna Ashari, Qom (3a)',
  13: 'Shia Ithna Ashari, Qom (Half)',
  14: 'JAKIM, Malaysia',
  15: 'SIHAT, Malaysia',
  16: 'MUIS, Singapore',
  17: 'MUIS, Singapore (Revised)',
  18: 'Majlis Ugama Islam Singapura, Singapore',
  19: 'Union des Organisations Islamiques de France (UOIF)',
  20: 'Diyanet İşleri Başkanlığı, Turkey',
  21: 'Spiritual Administration of Muslims of Russia',
  22: 'Moonsighting Committee Worldwide',
  23: 'MWL, 7a',
  24: 'MWL, 15a',
  25: 'UOIF, 12a',
  26: 'Majlis Ugama Islam Singapura, Singapore (Revised)',
  27: 'Spiritual Administration of Muslims of Russia (Revised)',
  28: 'Moonsighting Committee Worldwide (Revised)',
  29: 'Islamic Society of North America (ISNA)',
  30: 'Moonsighting Committee Worldwide (7a)',
  31: 'Moonsighting Committee Worldwide (15a)',
  32: 'Moonsighting Committee Worldwide (Arbitrary Twilight)',
};
