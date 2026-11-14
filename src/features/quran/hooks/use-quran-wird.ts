'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TOTAL_AYAHS,
  isValidQuranPosition,
  toAbsoluteAyah,
  fromAbsoluteAyah,
  percentComplete,
} from '@/features/quran/utils/quran-progress';
import { getWirdProgress, saveWirdProgress } from '@/app/wird/actions';
import {
  DEFAULT_WIRD_PROGRESS_STATE,
  normalizeWirdProgressState,
  type WirdProgressState,
} from '@/features/wird/utils/progress-validation';

const STORAGE_KEY = 'zikr_quran_wird';

export type WirdState = WirdProgressState;

const DEFAULT_STATE = DEFAULT_WIRD_PROGRESS_STATE;

function localISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function todayISO(): string {
  return localISO();
}

function yesterdayISO(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localISO(date);
}

function load(): WirdState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return normalizeWirdProgressState(JSON.parse(raw)) ?? { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function save(s: WirdState): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeWirdProgressState(s);
  if (!normalized) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Local persistence is best-effort; in-memory state and account sync continue.
  }
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
  const [state, setState] = useState<WirdState>({ ...DEFAULT_STATE });
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef<WirdState>({ ...DEFAULT_STATE });
  const revisionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const localState = load();
    const today = todayISO();
    if (localState.todayDate !== today) {
      localState.todayCount = 0;
      localState.todayDate = today;
    }
    stateRef.current = localState;
    setState(localState);
    const initialRevision = revisionRef.current;

    // Local storage remains the offline cache, while the account is the source
    // of truth whenever the user is signed in. Do not let a late response replace
    // a local edit made while this request was in flight.
    void getWirdProgress().then(({ loggedIn, state: remoteState }) => {
      if (cancelled) return;
      if (revisionRef.current !== initialRevision) {
        setLoaded(true);
        return;
      }
      const normalizedRemote = normalizeWirdProgressState(remoteState);
      if (normalizedRemote) {
        const merged = { ...DEFAULT_STATE, ...normalizedRemote };
        if (merged.todayDate !== today) {
          merged.todayCount = 0;
          merged.todayDate = today;
        }
        stateRef.current = merged;
        save(merged);
        setState(merged);
      } else if (loggedIn && localState.position > 0) {
        void saveWirdProgress(localState).catch(() => undefined);
      }
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);

  const syncRemote = useCallback((next: WirdState) => {
    void saveWirdProgress(next).catch(() => undefined);
  }, []);

  const persist = useCallback((next: WirdState) => {
    const normalized = normalizeWirdProgressState(next);
    if (!normalized) return;
    revisionRef.current += 1;
    stateRef.current = normalized;
    save(normalized);
    setState(normalized);
    syncRemote(normalized);
  }, [syncRemote]);

  /** Credit the streak for hitting the daily target today (idempotent per day). */
  const creditStreak = useCallback((s: WirdState): WirdState => {
    const today = todayISO();
    if (s.lastStreakDate === today) return s;
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

        if (newAbsolute >= TOTAL_AYAHS) {
          next.khatmaCount = base.khatmaCount + 1;
          next.position = 0;
        }
      }

      if (next.todayCount >= next.dailyTarget && next.dailyTarget > 0) {
        next = creditStreak(next);
      }
      return next;
    },
    [creditStreak],
  );

  const recordRead = useCallback((surah: number, ayah: number) => {
    if (!isValidQuranPosition(surah, ayah)) return;
    const newAbsolute = toAbsoluteAyah(surah, ayah);
    if (newAbsolute < 1) return;
    persist(applyProgress(stateRef.current, newAbsolute));
  }, [applyProgress, persist]);

  const logAyahs = useCallback((count: number) => {
    if (!Number.isSafeInteger(count) || count < 1 || count > TOTAL_AYAHS) return;
    const current = stateRef.current;
    const target = Math.min(current.position + count, TOTAL_AYAHS);
    persist(applyProgress(current, target));
  }, [applyProgress, persist]);

  const setDailyTarget = useCallback((n: number) => {
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(Math.max(Math.round(n), 1), TOTAL_AYAHS);
    persist({ ...stateRef.current, dailyTarget: clamped });
  }, [persist]);

  const reset = useCallback(() => {
    persist({ ...DEFAULT_STATE, dailyTarget: stateRef.current.dailyTarget, todayDate: todayISO() });
  }, [persist]);

  const percent = percentComplete(state.position);
  const ayahsRemaining = TOTAL_AYAHS - state.position;
  const todayRemaining = Math.max(state.dailyTarget - state.todayCount, 0);
  const currentPosition = fromAbsoluteAyah(state.position > 0 ? state.position : 1);
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
