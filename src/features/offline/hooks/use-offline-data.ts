'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDb } from '@/lib/offline-db';
import { useOfflineStatus } from './use-offline-status';

type OfflineRecord = Record<string, unknown>;

export interface UseOfflineDataOptions<T> {
  storeName: string;
  key?: string | number;
  initialData?: T;
  fallback?: T;
  loadOnline?: () => Promise<T | undefined>;
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
  loadOnline,
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const { isOnline } = useOfflineStatus();

  const loadFromCache = useCallback(async (): Promise<boolean> => {
    try {
      await offlineDb.initialize();

      if (key !== undefined) {
        const cached = await offlineDb.get<T>(storeName, key);
        if (cached !== undefined) {
          setData(cached);
          setIsCached(true);
          return true;
        }
        return false;
      }

      const cached = await offlineDb.getAll<T>(storeName);
      if (cached.length > 0) {
        setData(cached as unknown as T);
        setIsCached(true);
        return true;
      }
    } catch (err) {
      console.error('[OfflineData] Cache load error:', err);
    }

    return false;
  }, [key, storeName]);

  const save = useCallback(
    async (newData: T) => {
      try {
        await offlineDb.initialize();
        if (key !== undefined) {
          await offlineDb.set(storeName, {
            ...(newData as OfflineRecord),
            id: key,
          });
        } else {
          await offlineDb.set(
            storeName,
            newData as unknown as OfflineRecord,
          );
        }
        setData(newData);
        setIsCached(true);
      } catch (err) {
        const normalized =
          err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        console.error('[OfflineData] Save error:', normalized);
        throw normalized;
      }
    },
    [key, storeName],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOnline && loadOnline) {
        const onlineData = await loadOnline();
        if (onlineData !== undefined) {
          await save(onlineData);
          return;
        }
      }

      const cached = await loadFromCache();
      if (!cached && !isOnline && fallback === undefined) {
        setError(new Error('No offline data is available.'));
      }
    } catch (err) {
      const normalized =
        err instanceof Error ? err : new Error(String(err));
      setError(normalized);
    } finally {
      setLoading(false);
    }
  }, [fallback, isOnline, loadFromCache, loadOnline, save]);

  useEffect(() => {
    void loadFromCache();
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
