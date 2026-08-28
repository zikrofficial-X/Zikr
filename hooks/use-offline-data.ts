'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDb } from '@/lib/offline-db';
import { useOfflineStatus } from './use-offline-status';

export interface UseOfflineDataOptions<T> {
  storeName: string;
  key?: string | number;
  initialData?: T;
  fallback?: T;
}

export interface UseOfflineDataResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  isCached: boolean;
  refresh: () => Promise<void>;
  save: (data: T) => Promise<void>;
}

export function useOfflineData<T>({
  storeName,
  key,
  initialData,
  fallback,
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const { isOnline } = useOfflineStatus();

  const loadFromCache = useCallback(async () => {
    try {
      await offlineDb.initialize();
      if (key !== undefined) {
        const cached = await offlineDb.get<T>(storeName, key);
        if (cached) {
          setData(cached);
          setIsCached(true);
          return true;
        }
      } else {
        const cached = await offlineDb.getAll<T>(storeName);
        if (cached.length > 0) {
          setData(cached as unknown as T);
          setIsCached(true);
          return true;
        }
      }
    } catch (err) {
      console.error(`[OfflineData] Cache load error:`, err);
    }
    return false;
  }, [storeName, key]);

  const refresh = useCallback(async () => {
    if (!isOnline) {
      await loadFromCache();
      return;
    }
    setLoading(true);
    try {
      await loadFromCache();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [isOnline, loadFromCache]);

  const save = useCallback(
    async (newData: T) => {
      try {
        await offlineDb.initialize();
        if (key !== undefined) {
          await offlineDb.set(storeName, { ...newData, id: key } as any);
        } else {
          await offlineDb.set(storeName, newData as any);
        }
        setData(newData);
        setIsCached(true);
      } catch (err) {
        setError(err as Error);
        console.error(`[OfflineData] Save error:`, err);
      }
    },
    [storeName, key]
  );

  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  return {
    data: data ?? fallback,
    loading,
    error,
    isCached,
    refresh,
    save,
  };
}
