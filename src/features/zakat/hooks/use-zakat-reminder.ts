'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'zikr_zakat_reminder';

export type ZakatCalendar = 'hijri' | 'gregorian';

export interface ZakatSettings {
  enabled: boolean;
  /** Calendar the due date follows. */
  calendar: ZakatCalendar;
  /** The date the hawl (lunar year) completes, ISO YYYY-MM-DD (Gregorian anchor). */
  dueDate: string;
  /** How many days before the due date to start reminding. */
  remindDaysBefore: number;
  /** ISO date the reminder was last shown, to avoid repeating within the same day. */
  lastNotified: string;
}

const DEFAULT_SETTINGS: ZakatSettings = {
  enabled: false,
  calendar: 'hijri',
  dueDate: '',
  remindDaysBefore: 7,
  lastNotified: '',
};

function load(): ZakatSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(s: ZakatSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Days until the due date (negative if it has passed). */
export function daysUntil(dueDate: string): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate + 'T00:00:00');
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Advance a past due date by one lunar (~354) or solar (365) year until it's
 * in the future, so the annual reminder rolls over automatically.
 */
export function rollForward(dueDate: string, calendar: ZakatCalendar): string {
  const due = new Date(dueDate + 'T00:00:00');
  if (Number.isNaN(due.getTime())) return dueDate;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  while (due.getTime() < now.getTime()) {
    if (calendar === 'hijri') {
      due.setDate(due.getDate() + 354); // approximate lunar year
    } else {
      due.setFullYear(due.getFullYear() + 1);
    }
  }
  return due.toISOString().slice(0, 10);
}

export interface ZakatReminderReturn {
  settings: ZakatSettings;
  loaded: boolean;
  days: number | null;
  isDue: boolean;
  update: (partial: Partial<ZakatSettings>) => void;
}

export function useZakatReminder(): ZakatReminderReturn {
  const [settings, setSettings] = useState<ZakatSettings>(() => {
    const s = load();
    // Roll a past due date forward so the reminder recurs yearly.
    if (s.dueDate) {
      const rolled = rollForward(s.dueDate, s.calendar);
      if (rolled !== s.dueDate) {
        s.dueDate = rolled;
        save(s);
      }
    }
    return s;
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const update = useCallback((partial: Partial<ZakatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }, []);

  const days = daysUntil(settings.dueDate);
  const isDue =
    settings.enabled &&
    days !== null &&
    days <= settings.remindDaysBefore &&
    days >= 0;

  // Mark as notified for today (used by the provider to avoid repeats)
  useEffect(() => {
    if (!isDue) return;
    const today = todayISO();
    if (settings.lastNotified === today) return;
    // Defer write to avoid update-during-render; provider handles the actual UI.
    const t = setTimeout(() => update({ lastNotified: today }), 0);
    return () => clearTimeout(t);
  }, [isDue, settings.lastNotified, update]);

  return { settings, loaded, days, isDue, update };
}
