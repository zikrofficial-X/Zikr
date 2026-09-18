'use client';

import { useOfflineStatus } from '@/hooks/use-offline-status';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOfflineStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else if (wasOffline) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 px-4 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-900/90 text-emerald-100 border border-emerald-700'
          : 'bg-amber-900/90 text-amber-100 border border-amber-700'
      }`}
      style={{ backdropFilter: 'blur(12px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
      <span className="text-sm font-medium">
        {isOnline
          ? 'اتصالك جاهز - محتوى الأوفلاين متاح'
          : 'بدون اتصال - استخدم المحتوى المحفوظ مسبقاً'}
      </span>
      {isOnline && wasOffline && (
        <span className="text-xs ml-auto opacity-75">تم المزامنة</span>
      )}
    </div>
  );
}
