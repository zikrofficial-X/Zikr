export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface PrayerResponse {
  timings: PrayerTimes;
  date: {
    readable: string;
    timestamp: string;
    hijri: {
      date: string;
      weekday: { ar: string; en: string };
      month: { ar: string; en: string; number: number };
      year: string;
    };
    gregorian: {
      date: string;
      weekday: { en: string };
      month: { en: string; number: number };
      year: string;
    };
  };
  meta: {
    timezone: string;
    method: { id: number; name: string };
    latitude: number;
    longitude: number;
  };
}

export interface QiblaResponse {
  latitude: number;
  longitude: number;
  direction: number;
}
