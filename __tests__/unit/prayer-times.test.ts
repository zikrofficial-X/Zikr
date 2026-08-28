import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatPrayerTime,
  getCurrentPrayer,
  getNextPrayer,
  parsePrayerTimeMinutes,
  type PrayerTime,
} from '@/lib/services/prayer-times';

const timings: PrayerTime = {
  Fajr: '05:12 (+03)',
  Sunrise: '06:30 (+03)',
  Dhuhr: '12:10 (+03)',
  Asr: '15:35 (+03)',
  Sunset: '18:01 (+03)',
  Maghrib: '18:05 (+03)',
  Isha: '19:22 (+03)',
  Imsak: '05:02 (+03)',
  Midnight: '23:41 (+03)',
};

describe('prayer time parsing', () => {
  it('parses Aladhan times that include timezone suffixes', () => {
    assert.equal(parsePrayerTimeMinutes('05:12 (+03)'), 312);
    assert.equal(formatPrayerTime('05:12 (+03)'), '05:12');
    assert.equal(formatPrayerTime('5:12 (+03)'), '05:12');
  });

  it('uses parsed times when calculating the next prayer', () => {
    assert.deepEqual(getNextPrayer(timings, new Date(2026, 0, 1, 5, 10)), {
      name: 'Fajr',
      time: '05:12 (+03)',
      minutesUntil: 2,
    });
  });

  it('uses parsed times when calculating the current prayer', () => {
    assert.deepEqual(getCurrentPrayer(timings, new Date(2026, 0, 1, 18, 10)), {
      name: 'Maghrib',
      time: '18:05 (+03)',
    });
  });
});
