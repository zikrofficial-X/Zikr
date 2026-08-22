'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { playSalawatClip, unlockAudioContext } from '@/lib/audio/spiritual-tones';
import { showDhikrNotification, isInQuietHours } from '@/lib/services/notifications';

export type DhikrInterval = 15 | 30 | 60 | 120 | 0; // 0 = disabled

export interface DhikrQuietHours {
  enabled: boolean;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

export interface DhikrReminderSettings {
  enabled: boolean;
  intervalMinutes: DhikrInterval;
  quietHours: DhikrQuietHours;
}

/** Rotating set of authentic adhkar shown in reminders. */
export const DHIKR_PHRASES: string[] = [
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
  'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
  'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
  'اللَّهُ أَكْبَرُ كَبِيرًا وَالْحَمْدُ لِلَّهِ كَثِيرًا',
  'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
  'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ',
];

const DEFAULT_SETTINGS: DhikrReminderSettings = {
  enabled: false, // opt-in: user must explicitly enable
  intervalMinutes: 60,
  quietHours: { enabled: false, from: '22:00', to: '06:00' },
};


function pickDhikr(index: number): string {
  return DHIKR_PHRASES[index % DHIKR_PHRASES.length];
}

export interface DhikrReminderReturn {
  settings: DhikrReminderSettings;
  setEnabled: (v: boolean) => void;
  setIntervalMinutes: (v: DhikrInterval) => void;
  setQuietHours: (v: Partial<DhikrQuietHours>) => void;
  testReminder: () => void;
}

export function useDhikrReminder(): DhikrReminderReturn {
  const [settings, setSettings] = useState<DhikrReminderSettings>(DEFAULT_SETTINGS);
  const rotationRef = useRef(0);

  // Load persisted settings from the authenticated server.
  useEffect(() => {
    void fetch('/api/reminders/background').then((response) => response.ok ? response.json() : null).then((data) => {
      if (!data) return;
      setSettings({
        enabled: Boolean(data.dhikr_enabled),
        intervalMinutes: data.dhikr_interval_minutes ?? 60,
        quietHours: { enabled: Boolean(data.quiet_hours_start && data.quiet_hours_end), from: data.quiet_hours_start?.slice(0, 5) ?? '22:00', to: data.quiet_hours_end?.slice(0, 5) ?? '06:00' },
      });
    }).catch(() => undefined);
  }, []);

  // Set up interval whenever settings change
  useEffect(() => {
    if (!settings.enabled || settings.intervalMinutes === 0) return;

    const fire = () => {
      if (
        settings.quietHours.enabled &&
        isInQuietHours(settings.quietHours.from, settings.quietHours.to)
      ) {
        return; // Respect quiet hours — skip silently
      }
      const text = pickDhikr(rotationRef.current);
      rotationRef.current += 1;
      playSalawatClip(); // spoken salawat/dhikr clip with offline-safe synthesized fallback
      showDhikrNotification(text);
      // Also dispatch via SW for background delivery
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_DHIKR_NOTIFICATION',
          text,
        });
      }
    };

    const interval = setInterval(fire, settings.intervalMinutes * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const update = useCallback((partial: Partial<DhikrReminderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      void fetch('/api/reminders/background', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dhikr_enabled: next.enabled, dhikr_interval_minutes: next.intervalMinutes, quiet_hours_start: next.quietHours.enabled ? next.quietHours.from : null, quiet_hours_end: next.quietHours.enabled ? next.quietHours.to : null }) }).catch(() => undefined);
      return next;
    });
  }, []);

  const setEnabled = useCallback((v: boolean) => update({ enabled: v }), [update]);
  const setIntervalMinutes = useCallback(
    (v: DhikrInterval) => update({ intervalMinutes: v }),
    [update]
  );
  const setQuietHours = useCallback(
    (v: Partial<DhikrQuietHours>) =>
      update({ quietHours: { ...settings.quietHours, ...v } }),
    [update, settings.quietHours]
  );

  const testReminder = useCallback(() => {
    unlockAudioContext();
    playSalawatClip();
    showDhikrNotification(pickDhikr(rotationRef.current));
    rotationRef.current += 1;
  }, []);

  return { settings, setEnabled, setIntervalMinutes, setQuietHours, testReminder };
}
