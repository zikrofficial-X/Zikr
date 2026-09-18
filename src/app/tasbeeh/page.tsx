'use client';

import { useEffect, useState, useCallback } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_TASBEEH_ITEMS,
  MORNING_ADHKAR,
  EVENING_ADHKAR,
  TasbeehItem,
  incrementTasbeeh,
  resetTasbeeh,
  getProgress,
  isTargetReached,
  calculateTotalCount,
} from '@/lib/services/tasbeeh';

type TabType = 'default' | 'morning' | 'evening';

export default function TasbeehPage() {
  const [tab, setTab] = useState<TabType>('default');
  const [items, setItems] = useState<TasbeehItem[]>(DEFAULT_TASBEEH_ITEMS);
  const [totalCount, setTotalCount] = useState(0);

  const resetToDefaults = useCallback(() => {
    switch (tab) {
      case 'morning':
        setItems(MORNING_ADHKAR);
        break;
      case 'evening':
        setItems(EVENING_ADHKAR);
        break;
      default:
        setItems(DEFAULT_TASBEEH_ITEMS);
    }
  }, [tab]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`tasbeeh_${tab}`);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        resetToDefaults();
      }
    } else {
      resetToDefaults();
    }
  }, [tab, resetToDefaults]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`tasbeeh_${tab}`, JSON.stringify(items));
    setTotalCount(calculateTotalCount(items));
  }, [items, tab]);

  const handleIncrement = (index: number) => {
    const newItems = [...items];
    newItems[index] = incrementTasbeeh(newItems[index]);
    setItems(newItems);
  };

  const handleReset = (index: number) => {
    const newItems = [...items];
    newItems[index] = resetTasbeeh(newItems[index]);
    setItems(newItems);
  };

  const handleResetAll = () => {
    setItems(items.map(resetTasbeeh));
  };

  return (
    <Container className="py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">عداد التسبيح</h1>
        <p className="text-brand-cream/70 max-w-2xl mx-auto">
          احسب أذكارك وتسبيحاتك بسهولة
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-3 justify-center flex-wrap">
        <Button
          variant={tab === 'default' ? 'primary' : 'outline'}
          onClick={() => setTab('default')}
        >
          الأذكار الأساسية
        </Button>
        <Button
          variant={tab === 'morning' ? 'primary' : 'outline'}
          onClick={() => setTab('morning')}
        >
          أذكار الصباح
        </Button>
        <Button
          variant={tab === 'evening' ? 'primary' : 'outline'}
          onClick={() => setTab('evening')}
        >
          أذكار المساء
        </Button>
      </div>

      {/* Total Count */}
      <Card className="p-6 bg-brand-gold/10 border-brand-gold/30 text-center space-y-2">
        <p className="text-brand-cream/70">إجمالي العد</p>
        <p className="text-5xl font-bold text-brand-gold">{totalCount}</p>
      </Card>

      {/* Tasbeeh Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card
            key={item.id}
            className={`p-6 space-y-4 transition-all ${
              isTargetReached(item)
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-brand-gold/30 bg-black/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-brand-gold">{item.nameAr}</h3>
                    <p className="text-sm text-brand-cream/60">{item.name}</p>
                  </div>
                </div>
                <p className="text-brand-cream/80 text-sm">{item.textAr}</p>
              </div>

              {/* Counter Display */}
              <div className="text-right space-y-2">
                <div className="text-3xl font-bold text-brand-gold text-center">
                  {item.count}
                  {item.targetCount && <span className="text-lg text-brand-cream/60">/{item.targetCount}</span>}
                </div>
                {item.targetCount && (
                  <div className="w-24 h-2 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-gold transition-all"
                      style={{ width: `${getProgress(item)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleIncrement(index)}
                variant="primary"
                className="flex-1"
              >
                +1
              </Button>
              <Button
                onClick={() => handleReset(index)}
                variant="outline"
                className="flex-1"
              >
                إعادة تعيين
              </Button>
            </div>

            {/* Completion Message */}
            {isTargetReached(item) && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-center text-green-400 font-bold">
                تم إكمال العد
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Reset All Button */}
      <Button
        onClick={handleResetAll}
        variant="outline"
        className="w-full"
      >
        إعادة تعيين الكل
      </Button>

      {/* Information */}
      <Card className="p-8 space-y-6 bg-black/30 border-brand-gold/30">
        <h2 className="text-2xl font-bold text-brand-gold">فضل الأذكار</h2>
        <div className="space-y-4 text-brand-cream/80">
          <div>
            <h3 className="font-bold text-brand-gold mb-2">سبحان الله (33 مرة)</h3>
            <p>
              عن أبي هريرة رضي الله عنه قال: قال رسول الله صلى الله عليه وسلم:
              "من قال سبحان الله وبحمده مائة مرة في اليوم حطت خطاياه وإن كانت مثل زبد البحر"
            </p>
          </div>
          <div>
            <h3 className="font-bold text-brand-gold mb-2">الحمد لله (33 مرة)</h3>
            <p>
              عن أبي هريرة رضي الله عنه: "من قال الحمد لله رب العالمين مائة مرة قبل أن يقوم من مقامه ذلك غفرت له ذنوبه وإن كانت مثل زبد البحر"
            </p>
          </div>
          <div>
            <h3 className="font-bold text-brand-gold mb-2">الله أكبر (33 مرة)</h3>
            <p>
              قال رسول الله صلى الله عليه وسلم: "من قال الله أكبر كبيرا والحمد لله كثيرا وسبحان الله بكرة وأصيلا ثلاثا وثلاثين مرة دبر كل صلاة أتمت تسعة وتسعون ومائة تكبيرة وتسعة وتسعون ومائة تحميدة وتسعة وتسعون ومائة تسبيحة"
            </p>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-brand-gold/10 border-brand-gold/30 space-y-3">
        <h3 className="text-lg font-bold text-brand-gold">نصائح</h3>
        <ul className="space-y-2 text-brand-cream/80 text-sm">
          <li>• استخدم هذا العداد لتتبع أذكارك اليومية</li>
          <li>• يتم حفظ عددك تلقائياً في متصفحك</li>
          <li>• يمكنك إعادة تعيين العد في أي وقت</li>
          <li>• استمر في الأذكار بنية صادقة وقلب خاشع</li>
        </ul>
      </Card>
    </Container>
  );
}
