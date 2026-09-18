'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, BedDouble, Sunrise, BookOpen, type LucideIcon } from 'lucide-react';

const adhkarData: Record<string, { title: string; icon: LucideIcon; items: { text: string; count: number; reward: string }[] }> = {
  morning: {
    title: 'أذكار الصباح',
    icon: Sun,
    items: [
      { text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1, reward: 'من قالها حين يصبح فقد شكر يومه' },
      { text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', count: 1, reward: '' },
      { text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', count: 1, reward: 'سيد الاستغفار - من قالها موقناً بها فمات من يومه دخل الجنة' },
      { text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', count: 100, reward: 'من قالها مئة مرة غفرت ذنوبه وإن كانت مثل زبد البحر' },
      { text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 100, reward: 'كانت له عدل عشر رقاب، وكتبت له مئة حسنة، ومحيت عنه مئة سيئة' },
      { text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', count: 3, reward: 'لم يضره شيء في ذلك اليوم' },
      { text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', count: 3, reward: 'لم يصبه فجأة بلاء حتى يمسي' },
    ],
  },
  evening: {
    title: 'أذكار المساء',
    icon: Moon,
    items: [
      { text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1, reward: '' },
      { text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ', count: 1, reward: '' },
      { text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', count: 1, reward: 'كان النبي ﷺ لا يدعها صباحاً ومساءً' },
      { text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ', count: 1, reward: '' },
      { text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', count: 3, reward: 'لم يضره شيء في تلك الليلة' },
    ],
  },
  sleep: {
    title: 'أذكار النوم',
    icon: BedDouble,
    items: [
      { text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', count: 1, reward: '' },
      { text: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', count: 3, reward: '' },
      { text: 'سُبْحَانَ اللَّهِ (33) وَالْحَمْدُ لِلَّهِ (33) وَاللَّهُ أَكْبَرُ (34)', count: 1, reward: 'خير لكما من خادم' },
      { text: 'آية الكرسي: اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...', count: 1, reward: 'لا يقربك شيطان حتى تصبح' },
      { text: 'قُلْ هُوَ اللَّهُ أَحَدٌ، والمعوذتين', count: 3, reward: 'تكفيك من كل شيء' },
    ],
  },
  wakeup: {
    title: 'أذكار الاستيقاظ',
    icon: Sunrise,
    items: [
      { text: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', count: 1, reward: '' },
      { text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', count: 1, reward: 'غفرت ذنوبه وإن كانت مثل زبد البحر' },
    ],
  },
  afterPrayer: {
    title: 'أذكار بعد الصلاة',
    icon: BookOpen,
    items: [
      { text: 'أَسْتَغْفِرُ اللَّهَ', count: 3, reward: '' },
      { text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', count: 1, reward: '' },
      { text: 'سُبْحَانَ اللَّهِ', count: 33, reward: '' },
      { text: 'الْحَمْدُ لِلَّهِ', count: 33, reward: '' },
      { text: 'اللَّهُ أَكْبَرُ', count: 33, reward: '' },
      { text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1, reward: 'تمام المئة' },
      { text: 'آية الكرسي', count: 1, reward: 'لم يمنعه من دخول الجنة إلا الموت' },
    ],
  },
};

type AdhkarCategory = keyof typeof adhkarData;

const COUNTERS_KEY = 'zikr_adhkar_counters';

function loadCounters(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(COUNTERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function AdhkarPage() {
  const [selectedCategory, setSelectedCategory] = useState<AdhkarCategory>('morning');
  const [counters, setCounters] = useState<Record<string, number>>({});

  // Load persisted counters on mount
  useEffect(() => {
    const loaded = loadCounters();
    setCounters(loaded);
  }, []);

  // Persist whenever counters change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
  }, [counters]);

  const currentAdhkar = adhkarData[selectedCategory];

  const handleCount = (index: number, maxCount: number) => {
    const key = `${selectedCategory}-${index}`;
    const current = counters[key] || 0;
    if (current < maxCount) {
      setCounters({ ...counters, [key]: current + 1 });
    }
  };

  const resetCounters = () => {
    const newCounters = { ...counters };
    currentAdhkar.items.forEach((_, idx) => {
      delete newCounters[`${selectedCategory}-${idx}`];
    });
    setCounters(newCounters);
    // Persist the cleared state immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem(COUNTERS_KEY, JSON.stringify(newCounters));
    }
  };

  const getProgress = (index: number, maxCount: number) => {
    const key = `${selectedCategory}-${index}`;
    const current = counters[key] || 0;
    return (current / maxCount) * 100;
  };

  return (
    <Container className="py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">الأذكار والأدعية</h1>
        <p className="text-brand-cream/70 max-w-2xl mx-auto">
          حصّن نفسك بذكر الله، واجعل لسانك رطباً بالدعاء والاستغفار
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {(Object.keys(adhkarData) as AdhkarCategory[]).map((key) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'primary' : 'outline'}
            onClick={() => setSelectedCategory(key)}
            className="flex items-center gap-2"
          >
            {(() => { const Icon = adhkarData[key].icon; return <Icon className="h-4 w-4" />; })()}
            <span>{adhkarData[key].title}</span>
          </Button>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={resetCounters}>
          إعادة تعيين العدادات
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-brand-gold text-center">{currentAdhkar.title}</h2>
        
        {currentAdhkar.items.map((dhikr, idx) => {
          const key = `${selectedCategory}-${idx}`;
          const current = counters[key] || 0;
          const isCompleted = current >= dhikr.count;

          return (
            <Card 
              key={idx} 
              className={`p-6 space-y-4 transition-all cursor-pointer ${isCompleted ? 'opacity-60 bg-green-900/20' : 'hover:border-brand-gold/50'}`}
              onClick={() => handleCount(idx, dhikr.count)}
            >
              <p className="text-xl font-arabic leading-relaxed text-brand-cream text-center" dir="rtl">
                {dhikr.text}
              </p>
              
              {dhikr.reward && (
                <p className="text-sm text-brand-gold/80 text-center border-t border-brand-gold/20 pt-3">
                  {dhikr.reward}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-brand-gold">{current}</span>
                  <span className="text-brand-cream/60">/ {dhikr.count}</span>
                </div>
                
                <div className="w-32 h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-gold transition-all duration-300"
                    style={{ width: `${getProgress(idx, dhikr.count)}%` }}
                  />
                </div>

                {isCompleted && (
                  <span className="text-green-400 text-sm">تم بحمد الله</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 text-center space-y-3 bg-brand-gold/10">
        <h3 className="text-xl font-bold text-brand-gold">فضل الذكر</h3>
        <p className="text-brand-cream/90 font-arabic text-lg leading-relaxed">
          قال رسول الله ﷺ: &quot;أَلَا أُنَبِّئُكُمْ بِخَيْرِ أَع��مَالِكُمْ، وَأَزْكَاهَا عِنْدَ مَلِيكِكُمْ، وَأَرْفَعِهَا فِي دَرَجَاتِكُمْ، وَخَيْرٍ لَكُمْ مِنْ إِنْفَاقِ الذَّهَبِ وَالْوَرِقِ، وَخَيْرٍ لَكُمْ مِنْ أَنْ تَلْقَوْا عَدُوَّكُمْ فَتَضْرِبُوا أَعْنَاقَهُمْ وَيَضْرِبُوا أَعْنَاقَكُمْ؟&quot; قَالُوا: بَلَى، قَالَ: &quot;ذِكْرُ اللَّهِ تَعَالَى&quot;
        </p>
      </Card>
    </Container>
  );
}
