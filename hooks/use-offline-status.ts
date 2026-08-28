'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
}

export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    isSyncing: false,
  });

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: true,
      lastSyncTime: new Date(),
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
