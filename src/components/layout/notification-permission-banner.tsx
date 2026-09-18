'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

const DISMISSED_KEY = 'zikr_notif_banner_dismissed';

/**
 * Shows a one-time banner asking the user to allow notifications.
 *
 * The banner is intentionally not opened automatically on page load because
 * permission prompts are disruptive and can hide the home page section grid in
 * visual previews. Dispatch `zikr:show-notification-banner` from an explicit
 * user action when the app wants to surface this opt-in.
 */
export function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Only show on browsers that support notifications
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const alreadyGranted = Notification.permission === 'granted';
    const alreadyDenied = Notification.permission === 'denied';
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1';

    const showBanner = () => {
      if (!alreadyGranted && !alreadyDenied && !dismissed) {
        setShow(true);
      }
    };

    window.addEventListener('zikr:show-notification-banner', showBanner);
    return () => window.removeEventListener('zikr:show-notification-banner', showBanner);
  }, []);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted' || result === 'denied') {
        dismiss();
      }
    } finally {
      setRequesting(false);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="طلب إذن الإشعارات"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm"
    >
      <div className="rounded-xl border border-brand-gold/30 bg-[#071A13]/95 px-5 py-4 shadow-2xl backdrop-blur-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-gold/10 text-brand-gold shrink-0">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <div dir="rtl">
              <p className="text-sm font-bold text-brand-gold">تفعيل تنبيهات الصلاة والذكر</p>
              <p className="text-xs text-brand-cream/60 mt-0.5 leading-5">
                احصل على تنبيه عند كل صلاة وتذكير بذكر الله في الخلفية
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="إغلاق"
            className="shrink-0 p-1 text-brand-cream/40 hover:text-brand-cream transition-colors rounded"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex gap-2 justify-end" dir="rtl">
          <button
            onClick={dismiss}
            className="text-xs text-brand-cream/50 hover:text-brand-cream px-3 py-1.5 rounded transition-colors"
          >
            لاحقاً
          </button>
          <button
            onClick={handleAllow}
            disabled={requesting}
            className="text-xs font-semibold bg-brand-gold text-brand-emeraldDeep px-4 py-1.5 rounded-lg hover:bg-brand-goldSoft transition-colors disabled:opacity-60"
          >
            {requesting ? 'جاري...' : 'السماح'}
          </button>
        </div>
      </div>
    </div>
  );
}
