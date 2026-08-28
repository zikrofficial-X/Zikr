'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useZakatReminder, type ZakatCalendar } from '@/hooks/use-zakat-reminder';
import { requestNotificationPermission } from '@/lib/services/notifications';

const ZAKAT_RATE = 0.025; // 2.5%

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso + 'T00:00:00'));
  } catch {
    return iso;
  }
}

function hijriDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso + 'T00:00:00'));
  } catch {
    return '';
  }
}

export function ZakatDashboard() {
  const { settings, loaded, days, update } = useZakatReminder();

  // Calculator state
  const [wealth, setWealth] = useState('');
  const [nisab, setNisab] = useState('');

  if (!loaded) {
    return <Card className="p-8 text-center text-brand-cream/60">جارٍ التحميل…</Card>;
  }

  const wealthNum = Number.parseFloat(wealth) || 0;
  const nisabNum = Number.parseFloat(nisab) || 0;
  const meetsNisab = nisabNum > 0 && wealthNum >= nisabNum;
  const zakatDue = meetsNisab ? wealthNum * ZAKAT_RATE : 0;

  const handleEnableToggle = async (v: boolean) => {
    if (v) {
      await requestNotificationPermission();
    }
    update({ enabled: v });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Reminder status */}
      {settings.enabled && settings.dueDate && days !== null && (
        <Card className="space-y-2 border-brand-gold/30">
          <h2 className="text-lg font-bold text-brand-gold">تذكيرك القادم</h2>
          {days > 0 ? (
            <p className="text-sm text-brand-cream/70">
              يتبقّى <span className="font-bold text-brand-gold">{days}</span> يوماً على موعد
              إخراج زكاتك ({formatDate(settings.dueDate)})
            </p>
          ) : (
            <p className="text-sm font-semibold text-brand-gold">حان موعد إخراج زكاتك اليوم</p>
          )}
        </Card>
      )}

      {/* Reminder settings */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-brand-gold">التذكير السنوي بالزكاة</h2>
        <p className="text-sm text-brand-cream/70">
          حدّد تاريخ حولان الحول (مرور عام على بلوغ مالك النصاب) ليصلك تذكير سنوي متجدد.
        </p>

        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-brand-cream/80">تفعيل التذكير</span>
          <button
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => handleEnableToggle(!settings.enabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              settings.enabled ? 'bg-brand-gold' : 'bg-brand-gold/20'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-brand-emeraldDeep transition-all ${
                settings.enabled ? 'right-0.5' : 'right-[22px]'
              }`}
            />
          </button>
        </label>

        <div className="space-y-2">
          <span className="block text-sm text-brand-cream/80">نوع التقويم</span>
          <div className="flex gap-2">
            {(['hijri', 'gregorian'] as ZakatCalendar[]).map((cal) => (
              <Button
                key={cal}
                size="sm"
                variant={settings.calendar === cal ? 'primary' : 'outline'}
                onClick={() => update({ calendar: cal })}
              >
                {cal === 'hijri' ? 'هجري' : 'ميلادي'}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="due-date" className="block text-sm text-brand-cream/80">
            تاريخ حولان الحول
          </label>
          <input
            id="due-date"
            type="date"
            value={settings.dueDate}
            onChange={(e) => update({ dueDate: e.target.value })}
            className="w-full rounded-xl border border-brand-gold/30 bg-black/40 px-3 py-2 text-sm text-brand-cream focus:border-brand-gold focus:outline-none"
          />
          {settings.dueDate && settings.calendar === 'hijri' && hijriDate(settings.dueDate) && (
            <p className="text-xs text-brand-cream/50">
              الموافق هجرياً: {hijriDate(settings.dueDate)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="remind-before" className="block text-sm text-brand-cream/80">
            تذكيري قبل الموعد بـ (أيام)
          </label>
          <div className="flex gap-2">
            {[3, 7, 14, 30].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={settings.remindDaysBefore === d ? 'primary' : 'outline'}
                onClick={() => update({ remindDaysBefore: d })}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Zakat calculator */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-brand-gold">حاسبة الزكاة</h2>
        <p className="text-sm text-brand-cream/70">
          زكاة المال 2.5% مما بلغ النصاب وحال عليه الحول.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="wealth" className="block text-sm text-brand-cream/80">
              إجمالي مالك الخاضع للزكاة
            </label>
            <input
              id="wealth"
              type="number"
              inputMode="decimal"
              min={0}
              value={wealth}
              onChange={(e) => setWealth(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-brand-gold/30 bg-black/40 px-3 py-2 text-sm text-brand-cream focus:border-brand-gold focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="nisab" className="block text-sm text-brand-cream/80">
              قيمة النصاب (سعر 85 غرام ذهب)
            </label>
            <input
              id="nisab"
              type="number"
              inputMode="decimal"
              min={0}
              value={nisab}
              onChange={(e) => setNisab(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-brand-gold/30 bg-black/40 px-3 py-2 text-sm text-brand-cream focus:border-brand-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-brand-gold/5 p-4 text-center">
          {nisabNum <= 0 || wealthNum <= 0 ? (
            <p className="text-sm text-brand-cream/60">أدخل القيم لحساب زكاتك</p>
          ) : meetsNisab ? (
            <>
              <p className="text-sm text-brand-cream/70">مقدار الزكاة الواجبة</p>
              <p className="text-3xl font-bold text-brand-gold">
                {zakatDue.toLocaleString('ar', { maximumFractionDigits: 2 })}
              </p>
            </>
          ) : (
            <p className="text-sm text-brand-cream/70">
              مالك لم يبلغ النصاب، فلا تجب فيه الزكاة.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
