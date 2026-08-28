'use client';

import { offlineDb } from '@/lib/offline-db';

export async function saveOfflinePreference<T>(key: string, value: T): Promise<void> {
  try {
    await offlineDb.saveSetting(key, value);
  } catch (error) {
    console.warn(`[OfflineSettings] Failed to persist ${key}`, error);
  }
}

export async function getOfflinePreference<T>(key: string): Promise<T | undefined> {
  try {
    return await offlineDb.getSetting<T>(key);
  } catch (error) {
    console.warn(`[OfflineSettings] Failed to read ${key}`, error);
    return undefined;
  }
}
