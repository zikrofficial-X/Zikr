'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
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
  hasWirdProgress,
  mergeWirdProgressStates,
  normalizeWirdProgressState,
  type WirdProgressState,
} from '@/features/wird/utils/progress-validation';

const STORAGE_KEY = 'zikr_quran_wird';
const getStorageKey = (userId: string | null): string => STORAGE_KEY + ':' + (userId ?? 'anonymous');

export type WirdState = WirdProgressState;
const DEFAULT_STATE = DEFAULT_WIRD_PROGRESS_STATE;

function localISO(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}
function todayISO(): string { return localISO(); }
function yesterdayISO(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localISO(date);
}

function load(key: string): WirdState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_STATE };
    return normalizeWirdProgressState(JSON.parse(raw)) ?? { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}
function save(s: WirdState, key: string): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeWirdProgressState(s);
  if (!normalized) return;
  try {
    localStorage.setItem(key, JSON.stringify(normalized));
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
  recordRead: (surah: number, ayah: number) => void;
  logAyahs: (count: number) => void;
  reset: () => void;
}

export function useQuranWird(): WirdReturn {
  const [state, setState] = useState<WirdState>({ ...DEFAULT_STATE });
  const [loaded, setLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const stateRef = useRef<WirdState>({ ...DEFAULT_STATE });
  const userIdRef = useRef<string | null>(null);
  const storageKeyRef = useRef(getStorageKey(null));
  const revisionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        const nextUserId = session?.user?.id ?? null;
        userIdRef.current = nextUserId;
        setUserId(nextUserId);
        setAuthReady(true);
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void supabase.auth.getSession().then(({ data: sessionData }: { data: { session: Session | null } }) => {
        if (cancelled) return;
        const nextUserId = sessionData.session?.user?.id ?? null;
        userIdRef.current = nextUserId;
        setUserId(nextUserId);
        setAuthReady(true);
      }).catch(() => {
        if (cancelled) return;
        userIdRef.current = null;
        setUserId(null);
        setAuthReady(true);
      });
    } catch {
      userIdRef.current = null;
      setUserId(null);
      setAuthReady(true);
    }
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!authReady || userId === undefined) return;
    let cancelled = false;
    setLoaded(false);
    userIdRef.current = userId;
    const storageKey = getStorageKey(userId);
    storageKeyRef.current = storageKey;
    const localState = load(storageKey);
    const today = todayISO();
    if (localState.todayDate !== today) {
      localState.todayCount = 0;
      localState.todayDate = today;
    }
    stateRef.current = localState;
    setState(localState);
    const initialRevision = revisionRef.current;

    // Each account gets a separate local cache. The old unscoped key is left
    // untouched and is not silently imported into whichever account signs in.
    void getWirdProgress().then(({ loggedIn, userId: serverUserId, state: remoteState, readError, invalidState }) => {
      if (cancelled) return;
      if (serverUserId && serverUserId !== userId) {
        userIdRef.current = serverUserId;
        setUserId(serverUserId);
        return;
      }
      if (readError || invalidState) {
        // Preserve the local cache when the account read failed or returned
        // malformed JSON; never overwrite an unreadable remote row.
        setLoaded(true);
        return;
      }
      if (revisionRef.current !== initialRevision) {
        setLoaded(true);
        return;
      }
      const normalizedRemote = normalizeWirdProgressState(remoteState);
      if (normalizedRemote) {
        const remoteToday = normalizedRemote.todayDate === today
          ? normalizedRemote
          : { ...normalizedRemote, todayCount: 0, todayDate: today };
        const merged = mergeWirdProgressStates(localState, remoteToday, today);
        stateRef.current = merged;
        save(merged, storageKey);
        setState(merged);
        if (loggedIn && serverUserId && JSON.stringify(merged) !== JSON.stringify(remoteToday)) {
          void saveWirdProgress(merged, serverUserId).catch(() => undefined);
        }
      } else if (loggedIn && serverUserId && hasWirdProgress(localState)) {
        void saveWirdProgress(localState, serverUserId).catch(() => undefined);
      }
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [authReady, userId]);

  const syncRemote = useCallback((next: WirdState, expectedUserId: string | null) => {
    if (!expectedUserId) return;
    void saveWirdProgress(next, expectedUserId).catch(() => undefined);
  }, []);

  const persist = useCallback((next: WirdState) => {
    const normalized = normalizeWirdProgressState(next);
    if (!normalized) return;
    revisionRef.current += 1;
    stateRef.current = normalized;
    save(normalized, storageKeyRef.current);
    setState(normalized);
    syncRemote(normalized, userIdRef.current);
  }, [syncRemote]);

  const creditStreak = useCallback((s: WirdState): WirdState => {
    const today = todayISO();
    if (s.lastStreakDate === today) return s;
    const newStreak = s.lastStreakDate === yesterdayISO() ? s.streak + 1 : 1;
    return { ...s, streak: newStreak, lastStreakDate: today };
  }, []);

  const applyProgress = useCallback((prev: WirdState, newAbsolute: number): WirdState => {
    const today = todayISO();
    let base = prev;
    if (base.todayDate !== today) base = { ...base, todayCount: 0, todayDate: today };
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
    if (next.todayCount >= next.dailyTarget && next.dailyTarget > 0) next = creditStreak(next);
    return next;
  }, [creditStreak]);

  const recordRead = useCallback((surah: number, ayah: number) => {
    if (!isValidQuranPosition(surah, ayah)) return;
    const newAbsolute = toAbsoluteAyah(surah, ayah);
    if (newAbsolute < 1) return;
    persist(applyProgress(stateRef.current, newAbsolute));
  }, [applyProgress, persist]);

  const logAyahs = useCallback((count: number) => {
    if (!Number.isSafeInteger(count) || count < 1 || count > TOTAL_AYAHS) return;
    const current = stateRef.current;
    persist(applyProgress(current, Math.min(current.position + count, TOTAL_AYAHS)));
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

  return { state, loaded, percent, ayahsRemaining, todayRemaining, currentPosition, resumePosition, setDailyTarget, recordRead, logAyahs, reset };
}
