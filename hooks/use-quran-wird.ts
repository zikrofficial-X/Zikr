'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TOTAL_AYAHS,
  toAbsoluteAyah,
  fromAbsoluteAyah,
  percentComplete,
} from '@/lib/utils/quran-progress';
import { getWirdProgress, saveWirdProgress } from '@/app/wird/actions';

const STORAGE_KEY = 'zikr_quran_wird';

export interface WirdState {
  /** Daily target in number of ayahs. */
  dailyTarget: number;
  /** Absolute ayah index (1..6236) the reader has completed through. 0 = not started. */
  position: number;
  /** Number of completed khatmat (full Quran readings). */
  khatmaCount: number;
  /** Ayahs read today. */
  todayCount: number;
  /** ISO date (YYYY-MM-DD) that todayCount refers to. */
  todayDate: string;
  /** Consecutive-day streak of hitting the daily target. */
  streak: number;
  /** ISO date the streak was last credited. */
  lastStreakDate: string;
}

const DEFAULT_STATE: WirdState = {
  dailyTarget: 20,
  position: 0,
  khatmaCount: 0,
  todayCount: 0,
  todayDate: '',
  streak: 0,
  lastStreakDate: '',
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function load(): WirdState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function save(s: WirdState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export interface WirdReturn {
  state: WirdState;
  loaded: boolean;
  percent: number;
  ayahsRemaining: number;
  todayRemaining: number;
  currentPosition: { surah: number; ayah: number };
  resumePosition: { surah: number; ayah: number };
  setDailyTarget: (n: number) => void;
  /** Record that the reader completed through (surah, ayah). */
  recordRead: (surah: number, ayah: number) => void;
  /** Add a number of ayahs to today's progress from the current position. */
  logAyahs: (count: number) => void;
  reset: () => void;
}

export function useQuranWird(): WirdReturn {
  const [state, setState] = useState<WirdState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

    useEffect(() => {
    let cancelled = false;
    const localState = load();
    const today = todayISO();
    if (localState.todayDate !== today) {
      localState.todayCount = 0;
      localState.todayDate = today;
    }
    setState(localState);

    // Local storage remains the offline cache, while the account is the source
    // of truth whenever the user is signed in.
    void getWirdProgress().then(({ loggedIn, state: remoteState }) => {
      if (cancelled) return;
      if (remoteState) {
        const merged = { ...DEFAULT_STATE, ...remoteState };
        if (merged.todayDate !== today) {
          merged.todayCount = 0;
          merged.todayDate = today;
        }
        save(merged);
        setState(merged);
      } else if (loggedIn && localState.position > 0) {
        void saveWirdProgress(localState);
      }
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);
  const syncRemote = useCallback((next: WirdState) => {
    void saveWirdProgress(next);
  }, []);
  const persist = useCallback((next: WirdState) => {
    save(next);
    setState(next);
    syncRemote(next);
  }, [syncRemote]);

  /** Credit the streak for hitting the daily target today (idempotent per day). */
  const creditStreak = useCallback((s: WirdState): WirdState => {
    const today = todayISO();
    if (s.lastStreakDate === today) return s; // already credited today
    const newStreak = s.lastStreakDate === yesterdayISO() ? s.streak + 1 : 1;
    return { ...s, streak: newStreak, lastStreakDate: today };
  }, []);

  const applyProgress = useCallback(
    (prev: WirdState, newAbsolute: number): WirdState => {
      const today = todayISO();
      let base = prev;
      if (base.todayDate !== today) {
        base = { ...base, todayCount: 0, todayDate: today };
      }

      const oldAbsolute = base.position;
      let next = { ...base };

      if (newAbsolute > oldAbsolute) {
        const delta = newAbsolute - oldAbsolute;
        next.todayCount = base.todayCount + delta;
        next.position = newAbsolute;

        // Complete a khatma when reaching the end
        if (newAbsolute >= TOTAL_AYAHS) {
          next.khatmaCount = base.khatmaCount + 1;
          next.position = 0; // start a fresh khatma
        }
      }

      // Credit streak if the daily target is met
      if (next.todayCount >= next.dailyTarget && next.dailyTarget > 0) {
        next = creditStreak(next);
      }
      return next;
    },
    [creditStreak]
  );

  const recordRead = useCallback(
    (surah: number, ayah: number) => {
      const newAbsolute = toAbsoluteAyah(surah, ayah);
      setState((prev) => {
        const next = applyProgress(prev, newAbsolute);
        save(next);
        syncRemote(next);
        return next;
      });
    },
    [applyProgress]
  );

  const logAyahs = useCallback(
    (count: number) => {
      setState((prev) => {
        const target = Math.min(prev.position + count, TOTAL_AYAHS);
        const next = applyProgress(prev, target);
        save(next);
        syncRemote(next);
        return next;
      });
    },
    [applyProgress]
  );

  const setDailyTarget = useCallback(
    (n: number) => {
      const clamped = Math.min(Math.max(Math.round(n), 1), 6236);
      persist({ ...state, dailyTarget: clamped });
    },
    [persist, state]
  );

  const reset = useCallback(() => {
    persist({ ...DEFAULT_STATE, dailyTarget: state.dailyTarget, todayDate: todayISO() });
  }, [persist, state.dailyTarget]);

  const percent = percentComplete(state.position);
  const ayahsRemaining = TOTAL_AYAHS - state.position;
  const todayRemaining = Math.max(state.dailyTarget - state.todayCount, 0);
  const currentPosition = fromAbsoluteAyah(Math.max(state.position, 1));
  const resumePosition = fromAbsoluteAyah(Math.min(state.position + 1, TOTAL_AYAHS));

  return {
    state,
    loaded,
    percent,
    ayahsRemaining,
    todayRemaining,
    currentPosition,
    resumePosition,
    setDailyTarget,
    recordRead,
    logAyahs,
    reset,
  };
}
